/**
 * One-shot migration: PG effect_progress → Firestore users/{uid}/effectProgress/{effectId}
 *
 * Usage:
 *   npx tsx server/scripts/migrate-effect-progress-to-firestore.ts
 *
 * Required env vars:
 *   DATABASE_URL — PostgreSQL connection string
 *   FIREBASE_SERVICE_ACCOUNT_JSON (or FIREBASE_SERVICE_ACCOUNT_BASE64)
 */
import "dotenv/config";
import { Pool } from "pg";
import admin from "firebase-admin";

// ── 1. Connect to PG ────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ── 2. Init Firebase Admin ──────────────────────────────────────────────────

function loadServiceAccountJson(): string {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) return json;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (b64) return Buffer.from(b64, "base64").toString("utf8");
  throw new Error("Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64");
}

function parseServiceAccount(raw: string): admin.ServiceAccount {
  let s = raw.replace(/^\uFEFF/, "").trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    try { const inner = JSON.parse(s); if (typeof inner === "string") s = inner; } catch {}
  }
  // dotenv may embed literal newlines inside private_key; escape them for JSON.parse
  s = s.replace(/\n/g, "\\n");
  let parsed: unknown = JSON.parse(s);
  if (typeof parsed === "string") parsed = JSON.parse(parsed);
  return parsed as admin.ServiceAccount;
}

const cred = parseServiceAccount(loadServiceAccountJson());
const projectId = (cred as { project_id?: string }).project_id ?? cred.projectId ?? undefined;
admin.initializeApp({
  credential: admin.credential.cert(cred),
  ...(projectId ? { projectId } : {}),
});
const firestore = admin.firestore();

// ── 3. Migrate ──────────────────────────────────────────────────────────────

async function migrate() {
  const { rows } = await pool.query<{
    user_id: string;
    effect_id: string;
    owned: boolean;
    equipped_level: number;
    evolution_progress: number;
    challenge_progress: number;
    earned_at: Date | null;
    updated_at: Date;
  }>("SELECT * FROM effect_progress");

  console.log(`📦 Found ${rows.length} rows in PG effect_progress`);

  if (rows.length === 0) {
    console.log("✅ Nothing to migrate");
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const docRef = firestore
      .collection("users")
      .doc(row.user_id)
      .collection("effectProgress")
      .doc(row.effect_id);

    // Skip if already exists in Firestore (idempotent)
    const existing = await docRef.get();
    if (existing.exists) {
      console.log(`  ⏭ ${row.user_id}/${row.effect_id} — already in Firestore`);
      skipped++;
      continue;
    }

    await docRef.set({
      owned: row.owned,
      equippedLevel: row.equipped_level,
      evolutionProgress: row.evolution_progress,
      challengeProgress: row.challenge_progress,
      earnedAt: row.earned_at,
      updatedAt: row.updated_at,
    });

    console.log(`  ✅ ${row.user_id}/${row.effect_id} — migrated (progress: ${row.challenge_progress})`);
    migrated++;
  }

  console.log(`\n🎉 Done: ${migrated} migrated, ${skipped} skipped`);
}

migrate()
  .catch((err) => { console.error("❌ Migration failed:", err); process.exit(1); })
  .finally(() => pool.end());
