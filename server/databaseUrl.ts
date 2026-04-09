/**
 * DATABASE_URL の正規化・検証。
 * pg-connection-string は解析に失敗すると result が未定義のまま searchParams に触れ
 * `Cannot read properties of undefined (reading 'searchParams')` になる（原因が分かりにくい）。
 */

let _resolved: string | null = null;

/** コピペで混入しやすい改行・BOM・囲み引用符を除去 */
export function normalizeDatabaseUrl(raw: string): string {
  let s = String(raw).trim();
  s = s.replace(/^\uFEFF/, "");
  s = s.replace(/\r\n/g, "").replace(/\n/g, "").replace(/\r/g, "");
  if (s.length >= 2) {
    const q0 = s[0];
    const q1 = s[s.length - 1];
    if ((q0 === '"' && q1 === '"') || (q0 === "'" && q1 === "'")) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

export function assertUrlParsableForPostgres(connectionString: string): void {
  try {
    const u = new URL(connectionString);
    if (!u.hostname?.trim()) {
      throw new Error("URL に hostname がありません（接続文字列の途中改行や欠落がないか確認）");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `DATABASE_URL を URL として解釈できません: ${msg}。` +
        "パスワードに @ ? & # などが含まれる場合はパスワード部分だけ URL エンコードしてください（docs/SUPABASE_DB_SETUP.md）。",
    );
  }
}

/**
 * Supabase ホストで `sslmode` が無いと、環境によって TLS 交渉に失敗することがある。
 */
export function ensureSslModeRequireIfSupabase(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    const host = u.hostname.toLowerCase();
    const isSupabase =
      host.endsWith(".supabase.co") ||
      host.endsWith(".pooler.supabase.com") ||
      host.endsWith(".supabase.com");
    if (!isSupabase) return connectionString;
    if (!u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }
    return u.toString();
  } catch {
    return connectionString;
  }
}

/**
 * プール生成・connect-pg-simple 用の確定した接続文字列（1プロセス1回キャッシュ）。
 */
export function resolveDatabaseUrl(): string {
  if (_resolved !== null) return _resolved;
  const raw = process.env.DATABASE_URL;
  if (raw === undefined || String(raw).trim() === "") {
    throw new Error("DATABASE_URL must be set");
  }
  const n = normalizeDatabaseUrl(raw);
  assertUrlParsableForPostgres(n);
  _resolved = ensureSslModeRequireIfSupabase(n);
  return _resolved;
}

/** テストや設定変更時にキャッシュを消す（通常は不要） */
export function __resetDatabaseUrlCacheForTests(): void {
  _resolved = null;
}
