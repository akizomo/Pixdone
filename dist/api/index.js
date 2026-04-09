import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes.js';
import { isStartupError } from '../server/startupError.js';
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
    /** 本番でも原因切り分けできる短いメッセージ（183B 固定長ではなく code 主） */
    const code = isStartupError(error) ? error.code : 'UNKNOWN';
    const hints = {
        ENV_CONFIG: '必須の環境変数が Vercel に設定されていません。Production に DATABASE_URL と SESSION_SECRET を追加してください。docs/DEPLOYMENT_CONTRACT.md 参照。',
        DB_CONNECT: 'Postgres に接続できません。Vercel の DATABASE_URL（Supabase の Pooler 可）、SSL、パスワードの URL エンコードを確認してください。docs/SUPABASE_DB_SETUP.md 参照。',
        AUTH_SETUP: 'セッション初期化に失敗しました。SESSION_SECRET を設定し、DATABASE_URL が connect-pg-simple（sessions テーブル）からも使えることを確認してください。',
        UNKNOWN: 'API の起動に失敗しました。Vercel のログ（registerRoutes failed at startup）を確認してください。',
    };
    app.use((_req, res) => {
        res.status(500).json({
            error: 'SERVER_INIT_FAILED',
            code,
            message: isProd ? hints[code] ?? hints.UNKNOWN : detail,
        });
    });
}
export default app;
