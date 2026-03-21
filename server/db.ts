import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _pool: InstanceType<typeof Pool> | null = null;
let _db: Db | null = null;

function getOrCreateDb(): Db {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  if (!_db) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzle({ client: _pool, schema });
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
