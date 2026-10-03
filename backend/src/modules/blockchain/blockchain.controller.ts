import { Request, Response } from 'express';
import { blockchainService } from './blockchain.service.js';

export class BlockchainController {
  public async getProjectIntegrityTrail(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;

    const trail = await blockchainService.getProjectAuditTrail(projectId);

    // Sanitize records: return only audit metadata & hashes, never internal keys
    const sanitized = trail.map((r) => ({
      auditId: r.auditId,
      entityType: r.entityType,
      entityId: r.entityId,
      eventType: r.eventType,
      payloadHash: r.payloadHash,
      hashAlgorithm: r.hashAlgorithm,
      timestamp: r.blockTimestamp || r.timestamp,
      transactionId: r.fabricTxId,
      status: 'CONFIRMED',
    }));

    res.json({
      success: true,
      projectId,
      totalAnchors: sanitized.length,
      anchors: sanitized,
    });
  }

  public async getEntityHistory(req: Request, res: Response): Promise<void> {
    const { entityType, entityId } = req.params;

    const history = await blockchainService.getEntityHistory(entityType, entityId);

    const sanitized = history.map((r) => ({
      auditId: r.auditId,
      entityType: r.entityType,
      entityId: r.entityId,
      eventType: r.eventType,
      payloadHash: r.payloadHash,
      timestamp: r.blockTimestamp || r.timestamp,
      transactionId: r.fabricTxId,
      previousEntityAnchorId: r.previousEntityAnchorId,
      status: 'CONFIRMED',
    }));

    res.json({
      success: true,
      entityType,
      entityId,
      totalVersions: sanitized.length,
      history: sanitized,
    });
  }

  public async verifyEntity(req: Request, res: Response): Promise<void> {
    const { entityType, entityId, currentData, auditId } = req.body;

    const result = await blockchainService.verifyEntityIntegrity(
      entityType,
      entityId,
      currentData,
      auditId
    );

    res.json({
      success: true,
      verification: result,
    });
  }

  public async getAnchor(req: Request, res: Response): Promise<void> {
    const { auditId } = req.params;

    const anchor = await blockchainService.getAnchorByAuditId(auditId);
    if (!anchor) {
      res.status(404).json({
        success: false,
        error: 'BLOCKCHAIN_NOT_ANCHORED',
        message: `No anchor found on Hyperledger Fabric ledger for audit ID '${auditId}'.`,
      });
      return;
    }

    res.json({
      success: true,
      anchor: {
        auditId: anchor.auditId,
        projectId: anchor.projectId,
        entityType: anchor.entityType,
        entityId: anchor.entityId,
        eventType: anchor.eventType,
        payloadHash: anchor.payloadHash,
        hashAlgorithm: anchor.hashAlgorithm,
        timestamp: anchor.blockTimestamp || anchor.timestamp,
        transactionId: anchor.fabricTxId,
        status: 'CONFIRMED',
      },
    });
  }
}

export const blockchainController = new BlockchainController();
