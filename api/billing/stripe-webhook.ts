import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../../server/routes.js';

export const config = {
  maxDuration: 10,
};

const app = express();

// Stripe webhook signature verification needs the raw body.
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: (_origin, callback) => callback(null, true),
  credentials: true,
}));

// Ensure preflight is always answered.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

let initPromise: Promise<void> | null = null;
async function ensureInit() {
  if (!initPromise) {
    initPromise = registerRoutes(app).then(() => {});
  }
  return initPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureInit();
    app(req, res);
  } catch (error) {
    console.error('Failed to init routes:', error);
    res.status(500).send('Internal Server Error');
  }
}

