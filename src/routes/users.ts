import { Router } from 'express';

import { authenticate, 
    authenticateHeader,
    verifyAccessToken } from '../middlewares/middleware';

import {
    userRegister,
    loginUserController,
    updateUserController,
    updatePasswordController,
    forgotPasswordController,
    resetPasswordController,
    updateMobileNumberController
} from '../controllers/userController';

import { refreshToken } from '../utils/refreshtoken';

import {
   checkUserController,
   apiLoginUserController
} from '../controllers/authController';

const router = Router();

/* ==============================
   Refresh Token
============================== */
router.post('/refresh-token', refreshToken);

/* ==============================
   Check Authenticated User
============================== */
router.get('/check-user', authenticateHeader, checkUserController);

/* ==============================
   API Login (Header Based)
============================== */
router.post('/api-login', apiLoginUserController);

/* ==============================
   User Authentication
============================== */
router.post('/signup', userRegister);
router.post('/login', loginUserController);

/* ==============================
   Update User
============================== */
router.put('/update-users', authenticate, updateUserController);
router.put('/update-password', authenticate, updatePasswordController);

/* ==============================
   Forgot & Reset Password
============================== */
router.post('/forgot-passwords', forgotPasswordController);
router.post('/reset-password-otps', resetPasswordController);

/* ==============================
   Update Mobile Number
============================== */
router.put('/update-mobile', authenticate, updateMobileNumberController);

export default router;