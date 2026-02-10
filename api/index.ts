import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes.js';

const app = express();
app.use(express.json());
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
