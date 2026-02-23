import { Router, Request, Response } from 'express';
import passport from 'passport';
import { IUser } from '../models/users';

const router = Router();
interface CustomRequest extends Request {
  userId?: string;
}
/* ==============================
   OAuth Sign Page
============================== */

router.get('/oauthsign', (req: Request, res: Response) => {
  res.send('<a href="auth/google">Authenticate with Google</a>');
});

/* ==============================
   Google Authentication Start
============================== */

router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

/* ==============================
   Google Authentication Callback
============================== */

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: CustomRequest, res: Response) => {
    const usersInfo:{ user: IUser, token: string } | null = req.user as any;
    if (!usersInfo) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const { user, token } = usersInfo;

    const maxAge = 24 * 60 * 60 * 1000;

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });

    return res.status(200).json({
      message: 'Login Successfully',
      user: {
        u_id: req.userId,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        lastLoginAt: user.lastLoginAt
      }
    });
  }
);

export default router;