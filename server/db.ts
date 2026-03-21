import { Pool, type PoolConfig } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema.js";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _pool: Pool | null = null;
let _db: Db | null = null;

/** Supabase / hosted Postgres on Vercel: use TLS (often needs relaxed chain verify). */
function poolConfig(connectionString: string): PoolConfig {
  const cfg: PoolConfig = { connectionString };
  let host = "";
  try {
    host = new URL(connectionString).hostname;
  } catch {
    // ignore parse errors; pg will surface bad URL
  }
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^127\./.test(host) ||
    connectionString.includes("@localhost");

  const hostedSsl =
    !isLocal &&
    (/supabase\.(co|com)$/i.test(host) ||
      /sslmode=require/i.test(connectionString) ||
      process.env.DATABASE_SSL === "1" ||
      process.env.DATABASE_SSL === "true");

  if (hostedSsl) {
    cfg.ssl = { rejectUnauthorized: false };
  }
  return cfg;
}

function getOrCreateDb(): Db {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  if (!_db) {
    _pool = new Pool(poolConfig(process.env.DATABASE_URL));
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

/**
 * Lazy DB: モジュール読み込み時に throw しない（Vercel で env 未注入だと import だけで FUNCTION_INVOCATION_FAILED になるのを防ぐ）。
 * 初回クエリ時に `DATABASE_URL` が無ければエラー。
 */
export const db = new Proxy({} as Db, {
  get(_, prop) {
    const d = getOrCreateDb() as unknown as Record<string | symbol, unknown>;
    const v = d[prop as string];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(d) : v;
  },
});
