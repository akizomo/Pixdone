import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes.js';
/** Stripe webhook など長めの処理向け（デプロイ先の上限に合わせて調整可） */
export const config = {
    maxDuration: 30,
};
const app = express();
// CORS: allow browser requests (including preflight) for /api/* on Vercel.
app.use(cors({
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
}));
// Preflight: Express で OPTIONS が弾かれて 405 になるケースを潰す。
// 注意: Express 5 の path-to-regexp v8 では `app.options('*', ...)` が構文エラーになるため使わない。
app.use((req, res, next) => {
    if (req.method === 'OPTIONS')
        return res.status(204).end();
    next();
});
// Keep raw request body for Stripe webhook signature verification.
app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express.urlencoded({ extended: true }));
/**
 * Vercel の Express 統合は `export default app` を想定している。
 * 手動で `(req, res) => app(req, res)` するとレスポンス完了前にランタイムが終わり
 * FUNCTION_INVOCATION_FAILED になることがある。
 *
 * コールドスタート時に1回だけルート登録（DB 接続確認・セッション含む）。
 */
try {
    await registerRoutes(app);
}
catch (error) {
    console.error('registerRoutes failed at startup:', error);
    const detail = error instanceof Error ? error.message : String(error);
    const isProd = process.env.NODE_ENV === 'production';
    app.use((_req, res) => {
        res.status(500).json({
            error: 'SERVER_INIT_FAILED',
            message: isProd
                ? 'API failed to initialize. Check Vercel env: DATABASE_URL, SESSION_SECRET; Postgres reachable; schema applied. See docs/SUPABASE_DB_SETUP.md.'
                : detail,
        });
    });
}
export default app;
