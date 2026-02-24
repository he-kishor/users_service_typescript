import mongoose from 'mongoose';
import logger from '../utils/logger';

const MONGODB_URI = process.env.MONGODBP as string;

if (!MONGODB_URI) {
  logger.error('❌ MONGODB_URI is not defined in environment variables');
  throw new Error('❌ MONGODB_URI is not defined in environment variables');
}

export const connectDB = async (): Promise<void> => {
    try {
      await mongoose.connect(process.env.MONGODBP as string);
      logger.info('✅ MongoDB connected');
    } catch(error:any) {
      logger.error(`❌ Database connection failed:${error.message}`);
      process.exit(1);
    }
};