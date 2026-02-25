// src/types/passport.d.ts  (create this file)

import { IUser } from '../models/User'; // your Mongoose user interface

declare global {
  namespace Express {
    // This tells Passport/Express what shape req.user will be
    interface User {
      user:  IUser;
      token: string;
    }
  }
}