import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import UserModel, { IUser } from '../models/users';

dotenv.config();

// Define the structure of the serialized user data
interface ISerializedUser {
  user: IUser;
  token: string;
}

// Configure the Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done) => {
      try {
        // Check if user already exists in the database
        let user = await UserModel.findOne({ email: profile._json.email });

        if (!user) {
          // If the user does not exist, create a new user
          user = await UserModel.create({
            fname: profile._json.given_name || '',
            lname: profile._json.family_name || '',
            email: profile._json.email || '',
            googleId: profile.id,
            role: 'user',
          });
        }

        // Update the last login time
        user.lastLoginAt = new Date();
        await user.save();

        // Generate JWT Token
        const token = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET || '',
          { expiresIn: '4h' }
        );

        return done(null, { user, token });
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch(error:any) {
    done(error, null);
  }
});

export default passport;