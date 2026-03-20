import express from 'express';
import { registerRoutes } from '../server/routes.js';
const app = express();
// Keep raw request body for Stripe webhook signature verification.
app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express.urlencoded({ extended: true }));
export default async (req, res) => {
    try {
        const httpServer = await registerRoutes(app);
        // Vercel handles the request by passing it to the express app
        // We don't call httpServer.listen() here as Vercel manages the execution
        app(req, res);
    }
    catch (error) {
        console.error('Failed to register routes:', error);
        res.status(500).send('Internal Server Error');
    }
};
