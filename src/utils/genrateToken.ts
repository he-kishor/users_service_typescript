import jwt from 'jsonwebtoken';
import logger from './logger';
import { Types } from 'mongoose';

interface IUserTokenPayload {
  _id: Types.ObjectId | string;
  email: string;
}

interface JwtPayload {
  id: string;
  email: string;
  passwordChangedAt: number;
}

const generateToken = (user: IUserTokenPayload): string => {
  if (!process.env.JWT_SECRET_TOKEN) {
    logger.error('JWT secret is not defined in environment variables');
    throw new Error('JWT secret is not defined');
  }

  const payload: JwtPayload = {
    id: user._id.toString(),
    email: user.email,
    passwordChangedAt: Date.now()
  };

  return jwt.sign(payload, process.env.JWT_SECRET_TOKEN, {
    expiresIn: '10h'
  });
};

export default generateToken;