import crypto from 'crypto';
import { supabase } from '../core/database/supabase.js';
import { fabricClient } from '../modules/blockchain/blockchain.client.js';
import { hashCanonicalPayload } from '../modules/blockchain/blockchain.hash.js';
import { AuditRecord } from '../modules/blockchain/blockchain.types.js';

export interface OutboxRow {
  id: string;
  dedupe_key: string;
  anchor_id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  minimal_payload: any;
  status: string;
  attempt_count: number;
}

export class BlockchainAnchorWorker {
  private workerId = `worker-${crypto.randomBytes(4).toString('hex')}`;
  private isRunning = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private readonly maxAttempts = 5;

  public async processBatch(): Promise<number> {
    try {
      // 1. Fetch pending or retryable outbox rows
      const { data: jobs, error } = await supabase
        .from('blockchain_anchor_outbox')
        .select('*')
        .in('status', ['PENDING', 'FAILED'])
        .lte('next_attempt_at', new Date().toISOString())
        .limit(10);

      if (error || !jobs || jobs.length === 0) {
        return 0;
      }

      let processedCount = 0;

      for (const job of jobs) {
        // Lock job
        const { error: lockError } = await supabase
          .from('blockchain_anchor_outbox')
          .update({
            status: 'PROCESSING',
            locked_at: new Date().toISOString(),
            locked_by: this.workerId,
          })
          .eq('id', job.id)
          .eq('status', job.status);

        if (lockError) continue;

        try {
          // Recompute and verify canonical hash
          const payloadHash = hashCanonicalPayload(job.minimal_payload);

          const record: AuditRecord = {
            auditId: `AUD-${job.entity_type}-${job.entity_id ? job.entity_id.slice(0, 8) : 'REF'}-${crypto.randomBytes(4).toString('hex')}`,
            schemaVersion: 1,
            projectId: job.project_id,
            entityType: job.entity_type,
            entityId: job.entity_id,
            eventType: job.event_type,
            payloadHash,
            hashAlgorithm: 'SHA-256',
            databaseVersion: 1,
            timestamp: new Date().toISOString(),
          };

          // Submit to Fabric Gateway
          const submission = await fabricClient.createAnchor(record);

          // Mark outbox row CONFIRMED
          await supabase
            .from('blockchain_anchor_outbox')
            .update({
              status: 'CONFIRMED',
              processed_at: new Date().toISOString(),
              last_error: null,
            })
            .eq('id', job.id);

          // Mark anchor CONFIRMED
          await supabase
            .from('blockchain_anchors')
            .update({
              status: 'CONFIRMED',
              transaction_id: submission.transactionId,
              confirmed_at: submission.blockTimestamp,
              last_error: null,
            })
            .eq('id', job.anchor_id);

          processedCount++;
        } catch (err: any) {
          const nextAttempt = job.attempt_count + 1;
          const isDeadLetter = nextAttempt >= this.maxAttempts;
          const backoffSec = Math.pow(2, nextAttempt) * 2;
          const nextAttemptAt = new Date(Date.now() + backoffSec * 1000).toISOString();

          await supabase
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

          if (isDeadLetter) {
            console.error(`[BlockchainAnchorWorker] CRITICAL: Outbox job ${job.id} exceeded max retries. Moved to DEAD_LETTER. Error: ${err.message}`);
          }
        }
      }

      return processedCount;
    } catch (err: any) {
      console.warn(`[BlockchainAnchorWorker] Batch processing notice: ${err.message}`);
      return 0;
    }
  }

  public start(pollIntervalMs = 5000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[BlockchainAnchorWorker] Worker ${this.workerId} started.`);

    this.intervalTimer = setInterval(async () => {
      if (!this.isRunning) return;
      await this.processBatch();
    }, pollIntervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    console.log(`[BlockchainAnchorWorker] Worker ${this.workerId} stopped.`);
  }
}

export const blockchainAnchorWorker = new BlockchainAnchorWorker();
