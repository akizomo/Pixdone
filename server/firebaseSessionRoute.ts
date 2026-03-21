/**
 * クライアントは Firebase Auth、API は Passport セッション — 両者をつなぐ。
 * フロントでログイン後、Firebase ID トークンを渡してサーバーに connect.sid を発行させる。
 */
import type { Express, Request, Response } from "express";
import admin from "firebase-admin";
import { storage } from "./storage.js";

let firebaseReady = false;

function ensureFirebaseAdmin(): void {
  if (firebaseReady) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  }
  const cred = JSON.parse(raw) as admin.ServiceAccount;
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  }
  firebaseReady = true;
}

export function setupFirebaseSessionRoute(app: Express): void {
  app.options("/api/auth/firebase-session", (_req, res) => res.sendStatus(204));

  app.post("/api/auth/firebase-session", (req: Request, res: Response) => {
    void handleFirebaseSession(req, res);
  });
}

async function handleFirebaseSession(req: Request, res: Response): Promise<void> {
  try {
    ensureFirebaseAdmin();
  } catch (e) {
    console.warn("Firebase Admin not configured:", e);
    res.status(503).json({
      message:
        "Server session bridge not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON on Vercel. See docs/FIREBASE_SERVER_SESSION.md",
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
    console.error("verifyIdToken failed:", e);
    res.status(401).json({ message: "Invalid or expired Firebase token" });
  }
}
