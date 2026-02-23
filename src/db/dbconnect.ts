import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODBP as string;

if (!MONGODB_URI) {
  throw new Error('❌ MONGODB_URI is not defined in environment variables');
}

export const connectDB = async (): Promise<void> => {
    try {
      await mongoose.connect(process.env.MONGODBP as string);
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
};