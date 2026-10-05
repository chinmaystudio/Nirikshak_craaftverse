import crypto from 'crypto';
import { supabaseAdmin } from '../core/database/supabase.js';
import { fabricClient } from '../modules/blockchain/blockchain.client.js';
import { hashCanonicalPayload } from '../modules/blockchain/blockchain.hash.js';
import { AuditRecord } from '../modules/blockchain/blockchain.types.js';

export interface OutboxClaimedJob {
  id: string;
  dedupe_key: string;
  anchor_id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  minimal_payload: any;
  attempt_count: number;
}

export class BlockchainAnchorWorker {
  public workerId = `worker-${crypto.randomBytes(4).toString('hex')}`;
  private isRunning = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private staleRecoveryTimer: NodeJS.Timeout | null = null;
  private readonly maxAttempts = 5;

  public async processBatch(): Promise<number> {
    try {
      // 1. Concurrency-safe atomic job claiming using FOR UPDATE SKIP LOCKED RPC
      const { data: jobs, error: claimError } = await supabaseAdmin.rpc(
        'claim_blockchain_outbox_jobs',
        {
          p_worker_id: this.workerId,
          p_batch_size: 10,
        }
      );

      if (claimError) {
        console.warn(`[BlockchainAnchorWorker] RPC claim_blockchain_outbox_jobs notice: ${claimError.message}`);
        return 0;
      }

      if (!jobs || jobs.length === 0) {
        return 0;
      }

      let processedCount = 0;

      for (const job of (jobs as OutboxClaimedJob[])) {
        try {
          // 2. Fetch authoritative database anchor row - DO NOT generate a second audit ID
          const { data: anchor, error: anchorError } = await supabaseAdmin
            .from('blockchain_anchors')
            .select('id, audit_id, project_id, entity_type, entity_id, event_type, canonical_version')
            .eq('id', job.anchor_id)
            .single();

          if (anchorError || !anchor) {
            throw new Error(`DATABASE_ANCHOR_NOT_FOUND: blockchain_anchors row '${job.anchor_id}' does not exist.`);
          }

          // 3. Compute single authoritative canonical SHA-256 hash using TypeScript canonicalizer
          const payloadHash = hashCanonicalPayload(job.minimal_payload);

          // 4. Construct record using the exact database-assigned audit_id
          const record: AuditRecord = {
            auditId: anchor.audit_id, // Authoritative single audit ID
            schemaVersion: anchor.canonical_version || 1,
            projectId: anchor.project_id || job.project_id,
            entityType: anchor.entity_type || job.entity_type,
            entityId: anchor.entity_id || job.entity_id,
            eventType: anchor.event_type || job.event_type,
            payloadHash, // Exactly identical hash between DB and Fabric
            hashAlgorithm: 'SHA-256',
            databaseVersion: 1,
            timestamp: new Date().toISOString(),
          };

          // 5. Submit to Hyperledger Fabric Gateway (fail-closed, no fake tx in production)
          const submission = await fabricClient.createAnchor(record);

          // 6. Update database anchor to CONFIRMED with identical hash and real Fabric transaction ID
          const { error: anchorUpdateError } = await supabaseAdmin
            .from('blockchain_anchors')
            .update({
              payload_hash: payloadHash,
              transaction_id: submission.transactionId,
              confirmed_at: submission.blockTimestamp,
              status: 'CONFIRMED',
              last_error: null,
            })
            .eq('id', job.anchor_id);

          if (anchorUpdateError) {
            console.error(`[BlockchainAnchorWorker] Failed to mark anchor ${job.anchor_id} as CONFIRMED: ${anchorUpdateError.message}`);
          }

          // 7. Update outbox row to CONFIRMED
          await supabaseAdmin
            .from('blockchain_anchor_outbox')
            .update({
              status: 'CONFIRMED',
              processed_at: new Date().toISOString(),
              locked_at: null,
              locked_by: null,
              last_error: null,
            })
            .eq('id', job.id);

          processedCount++;
        } catch (err: any) {
          const nextAttempt = (job.attempt_count || 0) + 1;
          const isDeadLetter = nextAttempt >= this.maxAttempts;
          const backoffSec = Math.min(300, Math.pow(2, nextAttempt) * 2);
          const nextAttemptAt = new Date(Date.now() + backoffSec * 1000).toISOString();

          console.error(`[BlockchainAnchorWorker] Error processing job ${job.id} (attempt ${nextAttempt}/${this.maxAttempts}): ${err.message}`);

          // Update outbox status
          await supabaseAdmin
            .from('blockchain_anchor_outbox')
            .update({
              status: isDeadLetter ? 'DEAD_LETTER' : 'FAILED',
              attempt_count: nextAttempt,
              next_attempt_at: nextAttemptAt,
              last_error: err.message,
              locked_at: null,
              locked_by: null,
            })
            .eq('id', job.id);

          // Update corresponding blockchain_anchors row to reflect failure or dead-letter
          await supabaseAdmin
            .from('blockchain_anchors')
            .update({
              status: isDeadLetter ? 'DEAD_LETTER' : 'FAILED',
              last_error: err.message,
              attempt_count: nextAttempt,
            })
            .eq('id', job.anchor_id);
        }
      }

      return processedCount;
    } catch (err: any) {
      console.warn(`[BlockchainAnchorWorker] Batch processing loop warning: ${err.message}`);
      return 0;
    }
  }

  public async recoverStaleJobs(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin.rpc('recover_stale_blockchain_jobs', {
        p_timeout_interval: '5 minutes',
      });
      if (error) {
        console.warn(`[BlockchainAnchorWorker] Stale job recovery warning: ${error.message}`);
        return 0;
      }
      const count = Number(data) || 0;
      if (count > 0) {
        console.log(`[BlockchainAnchorWorker] Recovered ${count} abandoned outbox jobs.`);
      }
      return count;
    } catch {
      return 0;
    }
  }

  public start(pollIntervalMs = 5000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[BlockchainAnchorWorker] Worker ${this.workerId} started (polling every ${pollIntervalMs}ms).`);

    this.intervalTimer = setInterval(async () => {
      if (!this.isRunning) return;
      await this.processBatch();
    }, pollIntervalMs);

    // Stale job recovery every 60 seconds
    this.staleRecoveryTimer = setInterval(async () => {
      if (!this.isRunning) return;
      await this.recoverStaleJobs();
    }, 60000);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.staleRecoveryTimer) {
      clearInterval(this.staleRecoveryTimer);
      this.staleRecoveryTimer = null;
    }
    console.log(`[BlockchainAnchorWorker] Worker ${this.workerId} stopped.`);
  }
}

export const blockchainAnchorWorker = new BlockchainAnchorWorker();
