/**
 * Extension auth: Firebase ID トークン（Bearer）で API を叩けるようにする。
 *
 * 既存の `isAuthenticated`（Passport セッション）を壊さないよう、
 * Bearer → セッション の順でフォールバックする `requireAuthEither` を提供する。
 *
 * 拡張用の `/api/quick/*` ルートはこのミドルウェアだけを使う。
 * Web アプリは従来どおり `isAuthenticated` を使い続ける。
 */
import type { Request, Response, NextFunction, RequestHandler } from "express";
import admin from "firebase-admin";
import { storage } from "./storage.js";

let firebaseReady = false;
let serviceAccountProjectId: string | null = null;

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
    "FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64 not set",
  );
}

function parseServiceAccount(rawInput: string): admin.ServiceAccount {
  let raw = rawInput.replace(/^\uFEFF/, "").trim();
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      const inner = JSON.parse(raw) as unknown;
      if (typeof inner === "string") raw = inner;
    } catch {
      /* fall through */
    }
  }
  let parsed: unknown = JSON.parse(raw);
  if (typeof parsed === "string") parsed = JSON.parse(parsed);
  return parsed as admin.ServiceAccount;
}

function ensureFirebaseAdmin(): void {
  if (firebaseReady) return;
  const cred = parseServiceAccount(loadServiceAccountJson());
  const projectId =
    (cred as { project_id?: string }).project_id ?? cred.projectId ?? null;
  serviceAccountProjectId = projectId;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(cred),
      ...(projectId ? { projectId } : {}),
    });
  }
  firebaseReady = true;
}

function extractBearer(req: Request): string | null {
  const raw = req.headers.authorization;
  if (typeof raw !== "string") return null;
  if (!raw.startsWith("Bearer ")) return null;
  const token = raw.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Bearer トークンを検証し、ユーザーレコードを `req.user.id` に乗せる。
 * 既存の `isAuthenticated` が期待する形 (req.user.id / claims) と互換にする。
 */
async function authenticateWithBearer(
  req: Request,
  idToken: string,
): Promise<boolean> {
  ensureFirebaseAdmin();
  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (e) {
    console.warn("[extensionAuth] verifyIdToken failed:", e);
    return false;
  }

  const uid = decoded.uid;
  try {
    await storage.upsertUser({
      id: uid,
      email: decoded.email || undefined,
      emailVerified: decoded.email_verified ?? false,
      firstName: decoded.name?.split(/\s+/)[0] || undefined,
      lastName: decoded.name?.split(/\s+/).slice(1).join(" ") || undefined,
    });
  } catch (e) {
    console.error("[extensionAuth] upsertUser failed:", e);
    return false;
  }

  const user = await storage.getUser(uid);
  if (!user) return false;

  (req as Request & { user?: unknown }).user = user;
  (req as Request & { _authViaBearer?: boolean })._authViaBearer = true;
  return true;
}

/**
 * `Authorization: Bearer <idToken>` を優先、なければ既存の Passport セッションに委ねる。
 * 401 を返すのはどちらも失敗した場合のみ。
 */
export const requireAuthEither: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const bearer = extractBearer(req);
  if (bearer) {
    const ok = await authenticateWithBearer(req, bearer);
    if (ok) {
      next();
      return;
    }
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  if (typeof (req as any).isAuthenticated === "function" && (req as any).isAuthenticated()) {
    next();
    return;
  }

  res.status(401).json({ message: "Unauthorized" });
};

/** 診断用: サーバーが拡張用 Firebase 設定を持っているか */
export function getExtensionAuthStatus(): {
  configured: boolean;
  projectId: string | null;
} {
  try {
    ensureFirebaseAdmin();
    return { configured: true, projectId: serviceAccountProjectId };
  } catch {
    return { configured: false, projectId: null };
  }
}
