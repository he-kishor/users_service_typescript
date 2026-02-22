import { Request, Response } from 'express';
import errorHandler from '../../../Shared/errorHandler';
import { check_user, loginuser } from '../services/check_authenticate';

/* =================================
   Check Logged-in User
================================= */

export const checkUserController = async (
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