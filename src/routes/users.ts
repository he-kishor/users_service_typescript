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
router.post('/refreshtoken', refreshToken);

/* ==============================
   Check Authenticated User
============================== */
router.get('/check_user', authenticateHeader, checkUserController);

/* ==============================
   API Login (Header Based)
============================== */
router.post('/apilogin', apiLoginUserController);

/* ==============================
   User Authentication
============================== */
router.post('/signup', userRegister);
router.post('/login', loginUserController);

/* ==============================
   Update User
============================== */
router.put('/updateusers', authenticate, updateUserController);
router.put('/updatepassword', authenticate, updatePasswordController);

/* ==============================
   Forgot & Reset Password
============================== */
router.post('/forgotpasswords', forgotPasswordController);
router.post('/resetpasswordotps', resetPasswordController);

/* ==============================
   Update Mobile Number
============================== */
router.put('/updatemobile', authenticate, updateMobileNumberController);

export default router;