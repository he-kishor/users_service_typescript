import dotenv from 'dotenv';
import logger from '../utils/logger';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel , { IUser } from '../models/users';
import { Types } from 'mongoose';

dotenv.config();

/* ================================
   Register User
================================ */

interface RegisterInput {
  fname: string;
  lname: string;
  email: string;
  pass: string;
  role?: string;
  gender?: string;
  mobilenumber: string;
}

export const registerUser = async ({
  fname,
  lname,
  email,
  pass,
  role,
  gender,
  mobilenumber
}: RegisterInput) => {
  if (!fname || !lname || !email || !pass || !mobilenumber) {
    logger.warn(`User registration attempt with missing fields: ${JSON.stringify({ fname, lname, email, pass, mobilenumber })}`);
    throw { status: 400, message: 'Please provide all required fields' };
  }

  if (role == 'admin') {
    logger.warn(`User registration attempt with role 'admin' for email: ${email}`);
    throw { status: 400, message: " Invalid role" };
  }
  const hashedPassword = await bcrypt.hash(pass, 10);

  const newUser = await UserModel.create({
    fname,
    lname,
    email,
    pass: hashedPassword,
    role,
    gender: gender || 'NO response',
    mobilenumber,
    passwordChangedAt: new Date(),
    resetPasswordOtp: '',
    otpExpires: new Date()
  });

  const userObject = newUser.toObject();
  delete userObject.pass;
  delete userObject.passwordChangedAt;
  delete userObject.otpExpires;
  delete userObject.resetPasswordOtp;
  delete userObject.refreshToken;

  return userObject;
};

/* ================================
   Login User
================================ */

interface LoginInput {
  email: string;
  pass: string;
}

export const loginUser = async ({ email, pass }: LoginInput) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    logger.warn(`Login attempt with invalid email: ${email}`);
    throw { status: 400, message: 'Invalid EmailID' };
  }

  const isPasswordValid = await bcrypt.compare(pass, user.pass as string);

  if (!isPasswordValid) {
    logger.warn(`Login attempt with invalid password for email: ${email}`);
    throw { status: 400, message: 'Invalid User' };
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '4h' }
  );

  

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET as string,
    { expiresIn: '30d' }
  );

  const updatedUser = await UserModel.findByIdAndUpdate(
    user._id,
    {
      $set: {
        lastLoginAt: new Date(),
        refreshToken
      }
    },
    { new: true }
  );

  if (!updatedUser) {
    logger.error(`Failed to update user details for user ID: ${user._id} after login`);
    throw { status: 400, message: 'User update failed' };
  }

  return {
    token,
    user: {
      message: 'Login Successfully',
      u_id: updatedUser._id,
      email: updatedUser.email,
      fname: updatedUser.fname,
      lname: updatedUser.lname,
      role: updatedUser.role,
      gender: updatedUser.gender,
      lastLoginAt: updatedUser.lastLoginAt
    }
  };
};

/* ================================
   Update User
================================ */

interface UpdateInput {
  email: string;
  fname: string;
  lname: string;
  gender: string;
}

export const updateUser = async (
  id: string | Types.ObjectId,
  body: UpdateInput
) => {
  const { email, fname, lname, gender } = body;

  if (!email || !fname || !lname || !gender) {
    logger.warn(`User update attempt with missing fields for user ID: ${id}: ${JSON.stringify({ email, fname, lname, gender })}`);
    throw {
      status: 400,
      message: 'All fields (email, fname, lname, gender) must be provided'
    };
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    {
      $set: { fname, lname, gender }
    },
    { new: true }
  );

  if (!updatedUser) {
    logger.warn(`User update attempt for non-existent user ID: ${id}`);
    throw { status: 404, message: 'User not found' };
  }

  return {
    u_id: updatedUser._id,
    email: updatedUser.email,
    fname: updatedUser.fname,
    lname: updatedUser.lname,
    role: updatedUser.role,
    gender: updatedUser.gender
  };
};

/* ================================
   Update Password
================================ */

interface UpdatePasswordInput {
  email: string;
  old_pass: string;
  new_pass: string;
}

export const updatePassword = async (
  id: string | Types.ObjectId,
  { email, old_pass, new_pass }: UpdatePasswordInput
) => {
  if (!email || !old_pass || !new_pass) {
    logger.warn(`Password update attempt with missing fields for user ID: ${id}: ${JSON.stringify({ email, old_pass, new_pass })}`);
    throw {
      status: 400,
      message: 'All fields (email, old pass, new pass) must be provided'
    };
  }

  if (old_pass === new_pass) {
    logger.warn(`Password update attempt with same old and new password for user ID: ${id}`);
    throw {
      status: 400,
      message: 'New password must be different from old password'
    };
  }

  const user = await UserModel.findById(id);

  if (!user) {
    logger.warn(`Password update attempt for non-existent user ID: ${id}`);
    throw { status: 400, message: 'Invalid User' };
  }

  const isValid = await bcrypt.compare(old_pass, user.pass as string);

  if (!isValid) {
    logger.warn(`Password update attempt with incorrect old password for user ID: ${id}`);
    throw { status: 401, message: 'Incorrect password' };
  }

  const newHashedPassword = await bcrypt.hash(new_pass, 10);

  await UserModel.findByIdAndUpdate(id, {
    $set: {
      pass: newHashedPassword,
      passwordChangedAt: new Date()
    }
  });

  return {
    message: 'Password updated successfully'
  };
};