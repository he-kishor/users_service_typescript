import {  Document} from 'mongoose';



// Define the payload for JWT tokens
export interface IJwtPayload {
    id: string;
    email: string;
    role: string;
  }
  
  // Define the structure of the login request
export interface ILoginRequest {
    email: string;
    pass: string;
  }
  
  // Define the structure of the login response
export interface ILoginResponse {
    user: {
      message: string;
      token: string;
      refreshTokenn: string;
      u_id: string;
      email: string;
      fname: string;
      lname: string;
      role: string;
      gender: string;
      lastLoginAt: Date;
    };
  }


// Define the structure of the forgot password response
export interface IForgotPasswordResponse {
    data: string;
  }
  
  // Define the structure of the reset password request
export interface IResetPasswordRequest {
    email: string;
    new_password: string;
    confirm_password: string;
    otp: string;
  }
  
