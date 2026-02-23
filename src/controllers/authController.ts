import { Request, Response } from 'express';
import errorHandler from '../utils/errorHandler';
import { check_user, loginuser } from '../services/checkAuthenticate';
import { IUser } from '../models/users';

/* =================================
   Check Logged-in User
================================= */
interface CustomRequest extends Request {
  userId?: string;
}

export const checkUserController = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.userId;

    if (!id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const userData = await check_user(id);

    res.status(200).json(userData);
  } catch (error) {
    errorHandler(res, error);
  }
};

/* =================================
   API Login User
================================= */

export const apiLoginUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const loginResponse = await loginuser(req.body);

    res.status(200).json(loginResponse.user);
  } catch (error) {
    errorHandler(res, error);
  }
};