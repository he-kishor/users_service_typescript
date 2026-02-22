import { Request, Response, NextFunction } from 'express';
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

import {IUser} from '../interfaces/userInterface';
import errorHandler from '../utils/errorHandler';

/* =================================
   User Register
================================= */

export const userRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userResponse = await registerUser(req.body);
    res.status(201).json(userResponse);
  } catch (error) {
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
    errorHandler(res, error);
  }
};

/* =================================
   Update User
================================= */

export const updateUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as Partial<IUser>;
    const id = body._id;

    if (!id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const updatedUser = await updateUser(id, req.body);

    res.status(200).json(updatedUser);
  } catch (error) {
    errorHandler(res, error);
  }
};

/* =================================
   Update Password
================================= */

export const updatePasswordController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as Partial<IUser>;
    const id = body._id;

    if (!id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const message = await updatePassword(id, req.body);

    res.status(200).json(message);
  } catch (error) {
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

    if (!email) {
      res.status(400).json({ message: 'Provide email' });
      return;
    }

    const response = await user_forgotpassword(email);

    res.status(200).json(response);
  } catch (error) {
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

    const response = await user_resetPassword({
      email,
      new_password,
      confirm_password,
      otp
    });

    res.status(200).json(response);
  } catch (error) {
    errorHandler(res, error);
  }
};

/* =================================
   Update Mobile Number
================================= */

export const updateMobileNumberController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { mobilenumber } = req.body;

    if (!mobilenumber) {
      res.status(400).json({ message: 'Mobile number not provided' });
      return;
    }

    const body = req.body as Partial<IUser>;
    const id:string = body._id;

    if (!id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const response = await update_mobilenumber(id , mobilenumber);

    res.status(200).json(response);
  } catch (error) {
    errorHandler(res, error);
  }
};