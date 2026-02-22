import passport from 'passport';
import { Strategy as GoogleStrategy, VerifyCallback,Profile } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();
// Define the interface for the user profile
interface IUserProfile {
  id: string;
  displayName: string;
  emails: { value: string }[];
}

// Configure the Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
      passReqToCallback: true,
    },
    async (req: any, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        // Here you can handle the user profile and save it to the database
        const user = {
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
        };

        // Call the `done` callback with the user object
        return done(null, user);
      } catch (error) {
        // Call the `done` callback with the error
        return done(error);
      }
    }
  )
);

export default passport;