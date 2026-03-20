import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findOrCreateGoogleUser } from "../services/userService.js";
import dotenv from "dotenv";  

dotenv.config({override: true});


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, {
            message: "Email not found",
          });
        }

        const user = await findOrCreateGoogleUser({
          googleId: profile.id,
          email,
          fullname: profile.displayName || email.split("@")[0],
        });

        return done(null, user);
      } catch (error) {
        console.error(error);
        return done(error, false, {
          message: "Error logging in with Google",
        });
      }
    },
  ),
);
export default passport;
