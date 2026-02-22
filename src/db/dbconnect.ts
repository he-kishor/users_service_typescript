import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('❌ MONGODB_URI is not defined in environment variables');
}

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(MONGODB_URI, {
      autoIndex: process.env.NODE_ENV !== 'production', // Disable in prod
    });

    console.log('✅ MongoDB connected successfully');

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};