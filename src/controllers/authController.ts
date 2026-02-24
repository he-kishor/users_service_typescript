import { Request, Response } from 'express';
import logger from '../utils/logger';
import errorHandler from '../utils/errorHandler';
import { check_user, loginuser } from '../services/checkAuthenticate';
import { IUser } from '../models/users';
import { loggerr } from '../middlewares/middleware';

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
    logger.info(`Checking authenticated user with ID: ${id}`);
    
    if (!id) {
      logger.warn('Unauthorized access attempt: No user ID found in request');
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const userData = await check_user(id);
    
    res.status(200).json(userData);
  } catch(error:any) {
    logger.error(`Error checking authenticated user: ${error.message}`);
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

    logger.info(`API login attempt for email: ${req.body.email}`);
    const loginResponse = await loginuser(req.body);

    res.status(200).json(loginResponse.user);
  } catch(error:any) {
    logger.error(`API login failed:${ error.message}`);
    errorHandler(res, error);
  }
};