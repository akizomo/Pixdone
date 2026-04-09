import { StartupError } from "./startupError.js";
import { resolveDatabaseUrl } from "./databaseUrl.js";

/**
 * Vercel / 本番で「そもそも設定されていない」ことを、DB に繋ぐ前に落とす。
 * 5 Whys: 欠落は DB 接続エラーと紛らわしいため、フェーズを ENV_CONFIG に分離する。
 */
export function assertDeploymentEnv(): void {
  const onVercel = process.env.VERCEL === "1";
  const prod = process.env.NODE_ENV === "production";
  if (!onVercel && !prod) return;

  const required = ["DATABASE_URL", "SESSION_SECRET"] as const;
  const missing = required.filter((key) => {
    const v = process.env[key];
    return v === undefined || String(v).trim() === "";
  });

  if (missing.length > 0) {
    throw new StartupError(
      "ENV_CONFIG",
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Set them in Vercel → Project → Settings → Environment Variables (Production). " +
        "See docs/DEPLOYMENT_CONTRACT.md.",
    );
  }

  try {
    resolveDatabaseUrl();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new StartupError(
      "ENV_CONFIG",
      `Invalid DATABASE_URL: ${msg}`,
    );
  }
}
