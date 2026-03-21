import type { VercelRequest, VercelResponse } from '@vercel/node';
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
// まず上の `cors(...)` で CORS ヘッダーを付与し、その後 OPTIONS だけ即終了する。
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.status(204).end();
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
    (req as any).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

// registerRoutes はルートを登録するだけなので、同一インスタンスに毎リクエスト呼ぶとハンドラが二重登録される。
// コールドスタート後1回だけ初期化する。
let routesInit: Promise<void> | null = null;
function ensureRoutesRegistered(): Promise<void> {
  if (!routesInit) {
    routesInit = registerRoutes(app)
      .then(() => {})
      .catch((err) => {
        routesInit = null;
        throw err;
      });
  }
  return routesInit;
}

/**
 * Vercel Serverless では、ハンドラの Promise が先に解決すると Express のレスポンス送信前に
 * 実行環境が終了し、FUNCTION_INVOCATION_FAILED になることがある。
 * res が finish/close するまで await する。
 */
function waitForResponseEnd(res: VercelResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    res.once('finish', done);
    res.once('close', done);
    res.once('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const responseDone = waitForResponseEnd(res);
  try {
    // Preflight (CORS) が Vercel/ルーティング側で弾かれることがあるため、
    // Express に流す前に OPTIONS は即返す。
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      await responseDone;
      return;
    }

    await ensureRoutesRegistered();
    app(req, res);
    await responseDone;
  } catch (error) {
    console.error('Failed to register routes:', error);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
    await responseDone.catch(() => {});
  }
};
