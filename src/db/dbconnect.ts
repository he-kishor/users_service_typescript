import mongoose from 'mongoose';
import logger from '../utils/logger';

const MONGODB_URI = process.env.MONGODBP as string;

if (!MONGODB_URI) {
  logger.error('❌ MONGODB_URI is not defined in environment variables');
  throw new Error('❌ MONGODB_URI is not defined in environment variables');
}

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5_000,  // fail fast on startup if DB unreachable
      socketTimeoutMS: 45_000,          // close idle sockets after 45s
    });
    logger.info('✅ MongoDB connected');
  } catch (error: any) {
    logger.error(`❌ Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB disconnected cleanly');
  } catch (error: any) {
    logger.error(`❌ MongoDB disconnect failed: ${error.message}`);
    throw error; // let gracefulShutdown() handle the exit
  }
};

/**
 * Synchronous and cheap — just reads an in-memory value.
 * Safe to call on every /actuator/health request with zero overhead.
 *
 * readyState values:
 *   0 = disconnected
 *   1 = connected      ← only healthy state
 *   2 = connecting
 *   3 = disconnecting
 */
export const getDBStatus = () => {
  const state = mongoose.connection.readyState;

  const stateLabel: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    connected:  state === 1,
    readyState: state,
    state:      stateLabel[state] ?? 'unknown',
    host:       mongoose.connection.host   || null,  // e.g. "cluster0.mongodb.net"
    name:       mongoose.connection.name   || null,  // DB name
  };
};