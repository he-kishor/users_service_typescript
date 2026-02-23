import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import UserModel , {IUser} from '../models/users';
import {  IForgotPasswordResponse,IResetPasswordRequest } from '../interfaces/userInterface';

dotenv.config();



// Function to handle forgot password
const user_forgotpassword = async (email: string): Promise<IForgotPasswordResponse> => {
  const get_users = await UserModel.findOne({ email });
  if (!get_users) {
    throw { status: 400, message: 'User does not exist' };
  }

  const otp = Math.floor(1000 + Math.random() * 9000);
  const otpExpire = new Date();
  otpExpire.setMinutes(otpExpire.getMinutes() + 1);

  const users_updated = await UserModel.findByIdAndUpdate(
    get_users._id,
    {
      $set: {
        resetPasswordOtp: otp.toString(),
        otpExpires: otpExpire,
      },
    },
    { new: true }
  );

  if (!users_updated) {
    throw { status: 500, message: 'Failed to update user with OTP' };
  }

  // Configure transporter with correct SMTP settings
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.app_email,
      pass: process.env.app_email_pass,
    },
  });

  // Designed email body
  const mailOptions = {
    from: process.env.app_email,
    to: email,
    subject: 'Password reset OTP',
    text: `Your OTP (It expires after 1 minute): ${otp}`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject({ status: 500, message: 'Issue while sending OTP', error });
      } else {
        return resolve({ data: `Your OTP has been sent to your email` });
      }
    });
  });
};

// Function to handle reset password
const user_resetPassword = async ({
  email,
  new_password,
  confirm_password,
  otp,
}: IResetPasswordRequest): Promise<{ message: string }> => {
  // Check for required parameters
  if (!email || !new_password || !confirm_password || !otp) {
    throw { status: 400, message: 'User must provide email, new_password, confirm_password, and OTP' };
  }

  // Check if new_password and confirm_password match
  if (new_password !== confirm_password) {
    throw { status: 400, message: 'Password does not match with confirmation' };
  }

  // Find the user by email
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw { status: 400, message: 'Email is incorrect' };
  }

  // Ensure OTP exists in the user document
  if (!user.resetPasswordOtp || !user.otpExpires) {
    throw { status: 400, message: 'OTP not found or expired' };
  }

  const currentTime = new Date();

  // Check if OTP is valid and not expired
  if (currentTime <= user.otpExpires && user.resetPasswordOtp === otp) {
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update user's password
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: {
          pass: hashedPassword,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      throw { status: 500, message: 'Internal error occurred while updating password' };
    }

    return { message: 'Password has been successfully reset' };
  } else if (currentTime > user.otpExpires) {
    throw { status: 400, message: 'OTP has expired' };
  } else {
    throw { status: 400, message: 'Invalid OTP' };
  }
};

export { user_forgotpassword, user_resetPassword };