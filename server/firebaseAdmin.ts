/**
 * Shared Firebase Admin SDK initialization.
 * Used by firebaseSessionRoute.ts (auth) and storage.ts (Firestore).
 */
import admin from "firebase-admin";

let initialized = false;
let projectId: string | null = null;

function loadServiceAccountJson(): string {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) return json;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf8");
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is invalid base64");
    }
  }
  throw new Error(
    "Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64",
  );
}

function parseServiceAccount(rawInput: string): admin.ServiceAccount {
  let raw = rawInput.replace(/^\uFEFF/, "").trim();
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      const inner = JSON.parse(raw) as unknown;
      if (typeof inner === "string") raw = inner;
    } catch { /* parse below */ }
  }
  let parsed: unknown = JSON.parse(raw);
  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  return parsed as admin.ServiceAccount;
}

export function ensureFirebaseAdmin(): void {
  if (initialized) return;
  const raw = loadServiceAccountJson();
  const cred = parseServiceAccount(raw);
  projectId =
    (cred as { project_id?: string }).project_id ?? cred.projectId ?? null;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(cred),
      ...(projectId ? { projectId } : {}),
    });
    console.info(
      "[firebase-admin] Initialized for project_id:",
      projectId ?? "(unknown)",
    );
  }
  initialized = true;
}

export function getProjectId(): string | null {
  return projectId;
}

export function getFirestoreAdmin(): admin.firestore.Firestore {
  ensureFirebaseAdmin();
  return admin.firestore();
}
