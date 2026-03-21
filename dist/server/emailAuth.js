import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { compare, hash } from "bcryptjs";
import { storage } from "./storage.js";
import { users, tasks, taskLists } from "../shared/schema.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";
// Store for email verification tokens (simplified for development)
const verificationTokens = new Map();
/** 純 JS の bcryptjs（ネイティブ `bcrypt` は Vercel 等でロード失敗し得る） */
export function setupEmailAuth(app) {
    // Local strategy for login
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            const user = await storage.getUserByEmail(email);
            if (!user) {
                return done(null, false);
            }
            // Check if user is verified
            if (!user.emailVerified) {
                return done(null, false);
            }
            const isValidPassword = await compare(password, user.password);
            if (!isValidPassword) {
                return done(null, false);
            }
            return done(null, user);
        }
        catch (error) {
            return done(error);
        }
    }));
    // Serialize and deserialize user
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    });
    // Register route - with email verification
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            // Check if user already exists
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            // Hash password
            const hashedPassword = await hash(password, 10);
            // Generate verification token
            const verificationToken = crypto.randomUUID();
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            // Store token temporarily
            verificationTokens.set(verificationToken, {
                email,
                password: hashedPassword,
                expires
            });
            // For development, show verification link directly
            const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${verificationToken}`;
            res.status(200).json({
                message: `Please verify your email by clicking this link: ${verificationUrl}`,
                needsVerification: true,
                verificationUrl: verificationUrl
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
    // Email verification route
    app.get('/api/auth/verify-email', async (req, res) => {
        try {
            const { token } = req.query;
            if (!token || typeof token !== 'string') {
                return res.status(400).send('Invalid verification token');
            }
            const tokenData = verificationTokens.get(token);
            if (!tokenData) {
                return res.status(400).send('Invalid or expired verification token');
            }
            if (new Date() > tokenData.expires) {
                verificationTokens.delete(token);
                return res.status(400).send('Verification token has expired');
            }
            // Create user account
            const newUser = await storage.upsertUser({
                id: crypto.randomUUID(),
                email: tokenData.email,
                password: tokenData.password,
                emailVerified: true,
                firstName: null,
                lastName: null,
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            // Clean up token
            verificationTokens.delete(token);
            // Redirect to login page with success message
            res.redirect('/?verified=true');
        }
        catch (error) {
            console.error('Email verification error:', error);
            res.status(500).send('Internal server error');
        }
    });
    // Login route
    app.post('/api/auth/login', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials or email not verified' });
            }
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Login failed' });
                }
                res.json({
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                });
            });
        })(req, res, next);
    });
    // Logout route
    app.post('/api/auth/logout', (req, res) => {
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: 'Logout failed' });
            }
            res.json({ message: 'Logged out successfully' });
        });
    });
    // Delete account route
    app.delete('/api/auth/delete-account', async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }
            const userId = req.user.id;
            // Delete user's tasks
            await db.delete(tasks).where(eq(tasks.userId, userId));
            // Delete user's task lists
            await db.delete(taskLists).where(eq(taskLists.userId, userId));
            // Delete user
            await db.delete(users).where(eq(users.id, userId));
            // Logout user
            req.logout((err) => {
                if (err) {
                    return res.status(500).json({ message: 'Account deleted but logout failed' });
                }
                res.json({ message: 'Account deleted successfully' });
            });
        }
        catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({ message: 'Failed to delete account' });
        }
    });
    // Get current user
    app.get('/api/auth/user', (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const user = req.user;
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        });
    });
}
