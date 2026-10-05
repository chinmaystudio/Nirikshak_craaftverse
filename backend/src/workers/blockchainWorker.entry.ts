import dotenv from 'dotenv';
dotenv.config();

import { fabricClient } from '../modules/blockchain/blockchain.client.js';
import { blockchainAnchorWorker } from './blockchainAnchor.worker.js';

async function bootstrapBlockchainWorker(): Promise<void> {
  console.log('============================================================');
  console.log('STARTING NIRIKSHAK BLOCKCHAIN OUTBOX WORKER SERVICE');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'} | Mode: ${fabricClient.getMode()}`);
  console.log('============================================================\n');

  const isProduction = process.env.NODE_ENV === 'production' || fabricClient.getMode() === 'production';
  const blockchainEnabled = process.env.BLOCKCHAIN_ENABLED !== 'false';

  if (!blockchainEnabled) {
    console.log('[Worker Entry] BLOCKCHAIN_ENABLED=false. Worker will not start.');
    process.exit(0);
  }

  // 1. Establish connection to Hyperledger Fabric
  console.log('[Worker Entry] Connecting to Hyperledger Fabric Gateway...');
  try {
    const connected = await fabricClient.connect();
    if (!connected && isProduction) {
      console.error('[Worker Entry] FATAL: Failed to establish production connection to Hyperledger Fabric.');
      process.exit(1);
    }
    console.log(`[Worker Entry] Fabric status: ${fabricClient.getState()}`);
  } catch (err: any) {
    if (isProduction) {
      console.error(`[Worker Entry] FATAL: Production startup failed on Fabric gateway connection: ${err.message}`);
      process.exit(1);
    } else {
      console.warn(`[Worker Entry] Running in non-production fallback mode (${err.message}).`);
    }
  }

  // 2. Start worker loop
  const pollInterval = parseInt(process.env.BLOCKCHAIN_WORKER_POLL_INTERVAL_MS || '3000', 10);
  blockchainAnchorWorker.start(pollInterval);

  // 3. Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`\n[Worker Entry] Received ${signal}. Shutting down blockchain worker gracefully...`);
    blockchainAnchorWorker.stop();
    fabricClient.close();
    console.log('[Worker Entry] Fabric gateway closed. Exiting process.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrapBlockchainWorker().catch((err) => {
  console.error('[Worker Entry] Unhandled startup failure:', err);
  process.exit(1);
});
