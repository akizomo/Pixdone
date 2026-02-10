import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  // Check if Google OAuth credentials are available
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Google OAuth credentials not found, skipping Google authentication setup');
    return;
  }

  const callbackURL = `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`;
  console.log('Setting up Google OAuth authentication...');
  console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('Callback URL:', callbackURL);

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth callback received for user:', profile.id);
      // Create or update user in database
      const userData = {
        id: `google_${profile.id}`,
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        profileImageUrl: profile.photos?.[0]?.value || ''
      };

      const user = await storage.upsertUser(userData);
      console.log('User created/updated:', user.id);
      return done(null, user);
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      return done(error, null);
    }
  }));

  // Google OAuth routes
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
    (req, res) => {
      console.log('Google OAuth callback completed successfully');
      res.redirect('/');
    }
  );

  console.log('Google OAuth routes registered successfully');
}