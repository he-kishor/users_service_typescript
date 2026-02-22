import mongoose, { Schema, Document, Model } from 'mongoose';
import {IUser} from '../interfaces/userInterface';

// Define the schema for the User model
const UserSchema: Schema<IUser> = new Schema(
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
    mobilenumber: {
      type: String,
      unique: true,
      validate: {
        validator: function (v: string): boolean {
          return /^\+[1-9]\d{1,1}\d{10}$/.test(v); // Basic E.164 format validation
        },
        message: (props: { value: string }) => `${props.value} is not a valid phone number!`,
      },
    },
    resetPasswordOtp: { type: String },
    otpExpires: { type: Date },
    refreshToken: { type: String },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Create the User model
const UserModel: Model<IUser> = mongoose.model<IUser>('Users_main', UserSchema);

export default UserModel;