import { Pool, type PoolConfig } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema.js";
import { resolveDatabaseUrl } from "./databaseUrl.js";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _pool: Pool | null = null;
let _db: Db | null = null;

/**
 * Shared Pool options for Drizzle and connect-pg-simple (session store).
 * - Serverless: keep pool tiny; avoid holding many connections.
 * - Remote Postgres (Supabase, Neon, RDS, …): TLS with relaxed verify is common on PaaS.
 */
export function buildPgPoolConfig(connectionString: string): PoolConfig {
  const cfg: PoolConfig = {
    connectionString,
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 20_000,
  };

  let host = "";
  let sslMode: string | null = null;
  try {
    const u = new URL(connectionString);
    host = u.hostname;
    sslMode = u.searchParams.get("sslmode");
  } catch {
    // ignore parse errors; pg will surface bad URL
  }

  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^127\./.test(host) ||
    connectionString.includes("@localhost");

  const sslDisabled =
    sslMode === "disable" ||
    sslMode === "allow" ||
    process.env.DATABASE_SSL === "0" ||
    process.env.DATABASE_SSL === "false";

  const needsSsl =
    !isLocal &&
    !sslDisabled &&
    (process.env.DATABASE_SSL === "1" ||
      process.env.DATABASE_SSL === "true" ||
      sslMode === "require" ||
      sslMode === "verify-full" ||
      /supabase\.(co|com)$/i.test(host) ||
      /\.neon\.tech$/i.test(host) ||
      process.env.VERCEL === "1");

  if (needsSsl) {
    cfg.ssl = { rejectUnauthorized: false };
  }

  // Vercel ↔ Supabase で IPv6 経路が不安定なときの回避（必要なら Vercel で PG_USE_IPV4=1）
  if (
    process.env.PG_USE_IPV4 === "1" &&
    (/supabase\.(co|com)$/i.test(host) || host.includes("pooler"))
  ) {
    (cfg as PoolConfig & { family?: number }).family = 4;
  }

  return cfg;
}

function getOrCreateDb(): Db {
  if (!_db) {
    const connectionString = resolveDatabaseUrl();
    _pool = new Pool(buildPgPoolConfig(connectionString));
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
