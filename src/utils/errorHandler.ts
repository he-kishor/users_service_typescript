import { Response } from 'express';

interface CustomError {
  status?: number;
  message?: string;
}

const errorHandler = (res: Response, error: unknown): void => {
  let status = 500;
  let message = 'Server error';

  if (typeof error === 'object' && error !== null) {
    const err = error as CustomError;
    status = err.status ?? 500;
    message = err.message ?? 'Server error';
  }

  res.status(status).json({ message });
};

export default errorHandler;