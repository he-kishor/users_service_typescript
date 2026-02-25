import mongoose, { model,Schema,Model } from 'mongoose';

export interface IUser {
  fname: string;
  lname: string;
  email: string;
  // Added '| null' to handle database nulls and fix the assignment error
  pass?: string | null; 
  role?: string | null;
  gender?: string | null;
  passwordChangedAt?: Date | null;
  lastLoginAt?: Date | null;
  googleId?: string | null;
  mobilenumber?: string | null;
  resetPasswordOtp?: string | null;
  otpExpires?: Date | null;
  refreshToken?: string | null;
  dob?: Date | null;
  weight?: number | null; //kg
  height?: number | null; //cm
}

// 1. Pass <IUser> to the Schema constructor
const userSchema = new Schema<IUser>(
  {
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    pass: { type: String },
    role: { type: String },
    gender: { type: String },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
    googleId: { type: String },
    mobilenumber: { type: String },
    resetPasswordOtp: { type: String },
    otpExpires: { type: Date },
    refreshToken: { type: String },
    dob: { type: Date },
    weight: { type: Number }, //kg
    height: { type: Number } //cm
  }
);

// 2. Explicitly type the Model to stop the "deep instantiation" error

const UserModel:Model<IUser>= model<IUser>('User', userSchema);

export default UserModel;