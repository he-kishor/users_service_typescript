import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

interface CustomRequest extends Request {
  userId?: string;
}

interface CustomJwtPayload extends JwtPayload {
  id: string;
}

/* ===============================
   Authenticate from Cookie
================================ */

export const authenticate = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({ message: 'Access Denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;

    req.userId = decoded.id;
    req.headers.authorization = `Bearer ${token}`;

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

/* ===============================
   Authenticate from Header
================================ */

export const authenticateHeader = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;

    req.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

/* ===============================
   Verify Access Token
================================ */

export const verifyAccessToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;

    req.userId = decoded.id;

    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: 'Invalid or expired access token' });
  }
};

/* ===============================
   Logger Middleware
================================ */

export const logger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(`Logger: ${req.method} request received on ${req.url}`);
  next();
};