import { Request, Response } from 'express';
import logger from './logger';
import jwt, { JwtPayload } from 'jsonwebtoken';
import UserModel from '../models/users';

interface RefreshTokenPayload extends JwtPayload {
  id: string;
}

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { refresh_tokenId } = req.body;

    if (!refresh_tokenId) {
      logger.info('Refresh token missing in request body');
      return res.status(401).json({ message: 'Refresh Token Missing' });
    }

    if (!process.env.JWT_SECRET_TOKEN) {
      logger.error('JWT secret is not defined in environment variables');
      throw new Error('JWT secret is not defined');
    }

    // ✅ Verify refresh token
    const decoded = jwt.verify(
      refresh_tokenId,
      process.env.JWT_SECRET_TOKEN
    ) as RefreshTokenPayload;

    // ✅ Find user
    const user = await UserModel.findById(decoded.id);

    if (!user || user.refreshToken !== refresh_tokenId) {
      logger.warn(`Invalid refresh token attempt for user ID: ${decoded.id}`);
      return res.status(403).json({ message: 'Invalid Refresh Token' });
    }

    // ✅ Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: '4h' }
    );

    // ✅ Generate new refresh token
    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: '30d' }
    );

    // ✅ Rotate refresh token (Best Practice)
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      accessToken: newAccessToken,
      newrefreshToken: newRefreshToken
    });

  } catch(error:any) {
    logger.error(`Refresh token error:${error.message}`);
    return res.status(403).json({ message: 'Invalid or Expired Refresh Token' });
  }
};