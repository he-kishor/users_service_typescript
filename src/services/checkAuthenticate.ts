import UserModel , {IUser} from '../models/users';
import { 
    ILoginRequest, 
    ILoginResponse, 
    IJwtPayload, 
   
 } from '../interfaces/userInterface';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


// Function to check user details
const check_user = async (uid: string): Promise<Partial<IUser>> => {
  const user_data = await UserModel.findById(uid);

  if (!user_data) {
    throw { status: 400, message: 'User does not exist' };
  }

  // Convert to plain object and cast to IUser to satisfy the return type
  const userPlainObject = user_data.toObject() as IUser; 

  if (!userPlainObject.pass) {
    return userPlainObject;
  }

  // Manually remove sensitive fields
  delete userPlainObject.pass;
  delete userPlainObject.passwordChangedAt;
  delete userPlainObject.otpExpires;
  delete userPlainObject.resetPasswordOtp;
  delete userPlainObject.refreshToken;

  return userPlainObject;
};
// Function to handle user login
const loginuser = async ({ email, pass }: ILoginRequest): Promise<ILoginResponse> => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw { status: 400, message: 'Invalid EmailID' };
  }

  // Validate hashed password
  const ispasswordValid = await bcrypt.compare(pass, user.pass || '');
  if (!ispasswordValid) {
    throw { status: 400, message: 'Invalid User' };
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role } as unknown as IJwtPayload,
    process.env.JWT_SECRET || '',
    { expiresIn: '4h' }
  );

  // Generate refresh token
  const refreshTokenn = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || '',
    { expiresIn: '30d' } // Set a longer expiration for the refresh token
  );

  const currentdate = new Date();
  const user_up = await UserModel.findByIdAndUpdate(
    user.id,
    {
      $set: {
        lastLoginAt: currentdate,
        refreshToken: refreshTokenn,
      },
    },
    { new: true }
  );

  if (!user_up) {
    throw { status: 500, message: 'Failed to update user details' };
  }

  return {
    user: {
      message: 'Login Successfully',
      token: token,
      refreshTokenn: refreshTokenn,
      u_id: user_up._id.toString(),
      email: user_up.email,
      fname: user_up.fname,
      lname: user_up.lname,
      role: user_up.role || '',
      gender: user_up.gender || '',
      lastLoginAt: user_up.lastLoginAt!,
    },
  };
};

export { check_user, loginuser };