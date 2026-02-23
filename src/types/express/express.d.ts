declare global {
  namespace Express {
    interface User {
      id?: string;
      userId?: string;
    }
    interface Request {
      userId?: string;
    }
  }
}

export {};