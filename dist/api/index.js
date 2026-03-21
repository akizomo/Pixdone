import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes.js';
const app = express();
// CORS: allow browser requests (including preflight) for /api/* on Vercel.
app.use(cors({
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
}));
// Preflight: Express で OPTIONS が弾かれて 405 になるケースを潰す。
// まず上の `cors(...)` で CORS ヘッダーを付与し、その後 OPTIONS だけ即終了する。
app.use((req, res, next) => {
    if (req.method === 'OPTIONS')
        return res.status(204).end();
    next();
});
// 念のため、OPTIONS をハンドラとしても用意（経路差異の保険）。
app.options('*', cors({
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
}), (_req, res) => res.sendStatus(204));
// Keep raw request body for Stripe webhook signature verification.
app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express.urlencoded({ extended: true }));
export default async (req, res) => {
    try {
        // Preflight (CORS) が Vercel/ルーティング側で弾かれることがあるため、
        // Express に流す前に OPTIONS は即返す。
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }
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
