/**
 * クライアントは Firebase Auth、API は Passport セッション — 両者をつなぐ。
 * フロントでログイン後、Firebase ID トークンを渡してサーバーに connect.sid を発行させる。
 */
import type { Express, Request, Response } from "express";
import admin from "firebase-admin";
import { storage } from "./storage.js";

let firebaseReady = false;
/** サービスアカウント JSON の project_id（トークン aud と突き合わせ用） */
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
    "Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64",
  );
}

/**
 * Vercel で値が `"..."` のように二重に JSON 文字列化されていることがある。
 * BOM や先頭末尾の余計な引用符も除去を試みる。
 */
function parseServiceAccount(rawInput: string): admin.ServiceAccount {
  let raw = rawInput.replace(/^\uFEFF/, "").trim();
  // 全体が1つの JSON 文字列として貼られた場合（"{\n  \"type\"..."）
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      const inner = JSON.parse(raw) as unknown;
      if (typeof inner === "string") raw = inner;
    } catch {
      /* そのまま下で parse */
    }
  }
  let parsed: unknown = JSON.parse(raw);
  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  return parsed as admin.ServiceAccount;
}

function ensureFirebaseAdmin(): void {
  if (firebaseReady) return;
  const raw = loadServiceAccountJson();
  const cred = parseServiceAccount(raw);
  const projectId =
    (cred as { project_id?: string }).project_id ?? cred.projectId ?? null;
  serviceAccountProjectId = projectId;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(cred),
      ...(projectId ? { projectId } : {}),
    });
    console.info(
      "[firebase-session] Firebase Admin initialized for project_id:",
      projectId ?? "(unknown)",
    );
  }
  firebaseReady = true;
}

/** JWT ペイロードを検証なしで読む（aud=プロジェクトIDの突き合わせ用） */
function decodeJwtPayloadUnsafe(
  idToken: string,
): Record<string, unknown> | null {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Firebase ID トークンは通常 3 つの Base64 部分（JWT） */
function looksLikeJwt(idToken: string): boolean {
  const parts = idToken.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

export function setupFirebaseSessionRoute(app: Express): void {
  app.options("/api/auth/firebase-session", (_req, res) => res.sendStatus(204));

  app.post("/api/auth/firebase-session", (req: Request, res: Response) => {
    void handleFirebaseSession(req, res);
  });

  /** 診断用: サーバーが認識している Firebase project_id を返す（認証不要） */
  app.get("/api/auth/firebase-status", (_req: Request, res: Response) => {
    try {
      ensureFirebaseAdmin();
      res.json({ configured: true, projectId: serviceAccountProjectId });
    } catch {
      res.json({ configured: false, projectId: null });
    }
  });
}

async function handleFirebaseSession(req: Request, res: Response): Promise<void> {
  try {
    ensureFirebaseAdmin();
  } catch (e) {
    console.warn("Firebase Admin not configured:", e);
    res.status(503).json({
      message:
        "Server session bridge not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (or FIREBASE_SERVICE_ACCOUNT_BASE64) on Vercel. See docs/FIREBASE_SERVER_SESSION.md",
    });
    return;
  }

  const idToken =
    typeof req.body?.idToken === "string"
      ? req.body.idToken
      : typeof req.headers.authorization === "string" &&
          req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined;

  if (!idToken) {
    res.status(400).json({ message: "idToken required in JSON body" });
    return;
  }

  if (!looksLikeJwt(idToken)) {
    console.warn(
      "firebase-session: idToken does not look like a JWT (length=%s)",
      idToken.length,
    );
    res.status(400).json({
      message:
        "idToken is not a valid Firebase ID token (expected JWT shape). Check request body JSON.",
    });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email ?? "";

    await storage.upsertUser({
      id: uid,
      email: email || undefined,
      emailVerified: decoded.email_verified ?? false,
      firstName: decoded.name?.split(/\s+/)[0] || undefined,
      lastName: decoded.name?.split(/\s+/).slice(1).join(" ") || undefined,
    });

    const user = await storage.getUser(uid);
    if (!user) {
      res.status(500).json({ message: "User upsert failed" });
      return;
    }

    req.login(user, (err) => {
      if (err) {
        console.error("req.login after Firebase:", err);
        res.status(500).json({ message: "Failed to create session" });
        return;
      }
      res.json({ ok: true, userId: uid });
    });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code?: unknown }).code)
        : "";
    console.error("verifyIdToken failed:", code || e);
    const payload = decodeJwtPayloadUnsafe(idToken);
    const aud =
      payload && typeof payload["aud"] === "string"
        ? payload["aud"]
        : undefined;
    const body: {
      message: string;
      firebaseCode?: string;
      tokenProjectId?: string;
      serviceAccountProjectId?: string;
      hint?: string;
    } = {
      message: "Invalid or expired Firebase token",
    };
    if (code) body.firebaseCode = code;
    if (aud) body.tokenProjectId = aud;
    if (serviceAccountProjectId) body.serviceAccountProjectId = serviceAccountProjectId;
    if (aud && serviceAccountProjectId && aud !== serviceAccountProjectId) {
      body.hint =
        "ID token is for a different Firebase project than the service account on the server. Regenerate the key for this project and set FIREBASE_SERVICE_ACCOUNT_JSON again (or fix client firebase.ts projectId).";
    }
    res.status(401).json(body);
  }
}
