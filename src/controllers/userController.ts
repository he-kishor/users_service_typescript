import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import {
  registerUser,
  loginUser,
  updateUser,
  updatePassword
} from '../services/usersService';
import {
  user_forgotpassword,
  user_resetPassword
} from '../services/forgotPassword';
import { update_mobilenumber } from '../services/mobileNumberService';

import { IUser } from '../models/users';
import errorHandler from '../utils/errorHandler';
import { CorsRequest } from 'cors';

interface CustomRequest extends Request {
  userId?: string;
}
/* =================================
   User Register
================================= */

export const userRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    logger.info(`User registration attempt for email: ${req.body.email}`);
    const userResponse = await registerUser(req.body);
    res.status(201).json(userResponse);

  } catch (error) {
    logger.error(`User registration failed:${error}`);
    errorHandler(res, error);
  }
};

/* =================================
   Login User
================================= */

export const loginUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    logger.info(`User login attempt for email: ${req.body.email}`);
    const loginResponse = await loginUser(req.body);

    const maxAge = 24 * 60 * 60 * 1000;

    res.cookie('authToken', loginResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });

    res.status(200).json(loginResponse.user);
  } catch (error) {
    logger.error(`User login failed:${error}`);
    errorHandler(res, error);
  }
};

/* =================================
   Update User
================================= */

export const updateUserController = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.userId;
    logger.info(`User update attempt for user ID: ${id}`);

    if (!id) {
      logger.warn('Unauthorized update attempt: No user ID found in request');
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const updatedUser = await updateUser(id, req.body);

    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error(`User update failed:${error}`);
    errorHandler(res, error);
  }
};

/* =================================
   Update Password
================================= */

export const updatePasswordController = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    logger.info(`Password update attempt for user ID: ${req.userId}`);
    const id = req.userId;

    if (!id) {
      logger.warn('Unauthorized password update attempt: No user ID found in request');
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const message = await updatePassword(id, req.body);

    res.status(200).json(message);
  } catch (error) {
    logger.error(`Password update failed:${error}`);
    errorHandler(res, error);
  }
};

/* =================================
   Forgot Password
================================= */

export const forgotPasswordController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    logger.info

    if (!email) {
      logger.warn('Forgot password attempt with missing email');
      res.status(400).json({ message: 'Provide email' });
      return;
    }

    const response = await user_forgotpassword(email);

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Forgot password process failed:${error}`);
    errorHandler(res, error);
  }
};

/* =================================
   Reset Password
================================= */

export const resetPasswordController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, new_password, confirm_password, otp } = req.body;
    logger.info(`Password reset attempt for email: ${email}`);
    const response = await user_resetPassword({
      email,
      new_password,
      confirm_password,
      otp
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Password reset process failed:${error} `);
    errorHandler(res, error);
  }
};

/* =================================
   Update Mobile Number
================================= */

export const updateMobileNumberController = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { mobilenumber } = req.body;
    logger.info(`Mobile number update attempt for user ID: ${req.userId}`);
    if (!mobilenumber) {
      logger.warn('Mobile number update attempt with missing mobile number');
      res.status(400).json({ message: 'Mobile number not provided' });
      return;
    }

    const id = req.userId;

    if (!id) {
      logger.warn('Unauthorized mobile number update attempt: No user ID found in request');
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const response = await update_mobilenumber(id , mobilenumber);

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Mobile number update process failed:${error}`);
    errorHandler(res, error);
  }
};