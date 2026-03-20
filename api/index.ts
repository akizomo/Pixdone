import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes.js';

const app = express();

// CORS: allow browser requests (including preflight) for /api/* on Vercel.
app.use(cors({
  origin: (_origin, callback) => callback(null, true),
  credentials: true,
}));

// Preflight handler for endpoints that only define POST/GET.
app.options('*', cors({
  origin: (_origin, callback) => callback(null, true),
  credentials: true,
}), (_req, res) => res.sendStatus(204));

// Keep raw request body for Stripe webhook signature verification.
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const httpServer = await registerRoutes(app);
    // Vercel handles the request by passing it to the express app
    // We don't call httpServer.listen() here as Vercel manages the execution
    app(req, res);
  } catch (error) {
    console.error('Failed to register routes:', error);
    res.status(500).send('Internal Server Error');
  }
};
