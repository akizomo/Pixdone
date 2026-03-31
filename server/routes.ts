import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage.js";
import { setupAuth, isAuthenticated } from "./replitAuth.js";
import { setupGoogleAuth } from "./googleAuth.js";
import { setupEmailAuth } from "./emailAuth.js";
import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { createPlusCheckoutSession, cancelPlusSubscription, verifyStripeWebhook } from "./billing/stripe.js";
import { StartupError } from "./startupError.js";
import { assertDeploymentEnv } from "./validateDeploymentEnv.js";
import { setupFirebaseSessionRoute } from "./firebaseSessionRoute.js";

/** Passport session user id: Replit OIDC uses `claims.sub`; Google OAuth stores DB user with `id`. */
function getSessionUserId(req: any): string | undefined {
  const u = req.user as any;
  if (!u) return undefined;
  if (u.claims?.sub) return String(u.claims.sub);
  if (u.id) return String(u.id);
  return undefined;
}

export async function registerRoutes(app: Express): Promise<Server> {
  assertDeploymentEnv();

  // 起動時に SELECT 1 を必須にしない（1回失敗で全 API が SERVER_INIT_FAILED になるのを防ぐ）。
  // 接続確認は GET /api/health / GET /health で行う。
  console.log("📗 Routes registering (DB check deferred to /api/health)");

  // Legacy URL redirect middleware
  app.use((req, res, next) => {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;

    // 古いドメインからのアクセスを検出
    if (host === 'pixtask.replit.app') {
      const newUrl = `https://PixDone.replit.app${req.originalUrl}`;
      console.log(`🔄 Redirecting from legacy URL: ${protocol}://${host}${req.originalUrl} -> ${newUrl}`);
      return res.redirect(301, newUrl);
    }

    next();
  });

  // API Health check endpoint for deployment (JSON response)
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connection as part of health check
      await db.execute(sql`SELECT 1 as test`);

      res.status(200).json({
        status: 'healthy',
        message: 'PixDone server is running',
        database: 'connected',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      console.error("API Health check failed:", error);
      const cause = error instanceof Error && (error as NodeJS.ErrnoException & { cause?: unknown }).cause;
      const causeMsg = cause instanceof Error ? cause.message : cause ? String(cause) : undefined;
      let dbHost: string | undefined;
      try { dbHost = new URL(process.env.DATABASE_URL ?? "").hostname; } catch { /* ignore */ }
      res.status(500).json({
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error),
        cause: causeMsg,
        dbHost,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Comprehensive health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Test database connection
      await db.execute(sql`SELECT 1 as test`);

      // Test basic storage functionality
      const healthCheck = {
        status: 'healthy',
        message: 'PixDone server is running',
        database: 'connected',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      };

      res.status(200).json(healthCheck);
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: 'unhealthy',
        message: 'Health check failed',
        database: 'disconnected',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Auth middleware setup with error handling
  try {
    console.log("🔐 Setting up authentication...");
    await setupAuth(app);
    console.log("✅ Replit Auth setup successful");
  } catch (error: unknown) {
    console.error("❌ Replit Auth setup failed:", error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new StartupError(
      "AUTH_SETUP",
      `Replit Auth setup failed: ${msg}`,
      { cause: error },
    );
  }

  // Google Auth setup with error handling
  try {
    console.log("🔐 Setting up Google authentication...");
    setupGoogleAuth(app);
    console.log("✅ Google Auth setup successful");
  } catch (error) {
    console.error("❌ Google Auth setup failed:", error);
    // Google auth is optional, don't fail the server startup
    console.warn("⚠️ Google Auth unavailable, continuing without it");
  }

  // Email Auth setup with error handling
  try {
    console.log("🔐 Setting up email authentication...");
    setupEmailAuth(app);
    console.log("✅ Email Auth setup successful");
  } catch (error) {
    console.error("❌ Email Auth setup failed:", error);
    // Email auth is optional, don't fail the server startup
    console.warn("⚠️ Email Auth unavailable, continuing without it");
  }

  // Firebase（クライアント）→ Passport セッション（API）の橋渡し（serializeUser は Email 側に依存）
  try {
    setupFirebaseSessionRoute(app);
    console.log("✅ Firebase session bridge route registered");
  } catch (e) {
    console.warn("⚠️ Firebase session route failed to register:", e);
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { themeKey } = req.body;
      const validThemes = ['arcade', 'synthwave'];
      if (!themeKey || !validThemes.includes(themeKey)) {
        return res.status(400).json({ message: "Invalid themeKey" });
      }
      const user = await storage.updateUserTheme(userId, themeKey);
      res.json(user);
    } catch (error) {
      console.error("Error updating user theme:", error);
      res.status(500).json({ message: "Failed to update theme" });
    }
  });

  // ---- PixDone+ billing ----

  app.options('/api/billing/entitlements', (_req, res) => res.sendStatus(204));
  app.get('/api/billing/entitlements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const sub = await storage.getSubscription(userId);
      res.json({
        plan: sub?.plan ?? 'free',
        billingCycle: sub?.billingCycle ?? null,
        currentPeriodEnd: sub?.currentPeriodEnd ?? null,
        unlockedThemes: [],
        isPremium: sub?.plan === 'plus',
      });
    } catch (error) {
      console.error("Error fetching entitlements:", error);
      res.status(500).json({ message: "Failed to fetch entitlements" });
    }
  });

  // POST /api/billing/create-checkout-session — PixDone+ サブスクリプション開始
  app.options('/api/billing/create-checkout-session', (_req, res) => res.sendStatus(204));
  app.post('/api/billing/create-checkout-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { billingCycle } = req.body as { billingCycle?: string };
      if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
        return res.status(400).json({ message: "billingCycle must be 'monthly' or 'yearly'" });
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      const priceId = billingCycle === 'yearly'
        ? process.env.STRIPE_PRICE_PLUS_YEARLY
        : process.env.STRIPE_PRICE_PLUS_MONTHLY;

      if (!stripeSecretKey || !priceId) {
        return res.status(500).json({ message: "Stripe is not configured (missing env)" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const { checkoutUrl } = await createPlusCheckoutSession({
        stripeSecretKey,
        priceId,
        userId,
        successUrl: `${baseUrl}/?purchase=plus_success`,
        cancelUrl: `${baseUrl}/pricing`,
      });

      res.json({ checkoutUrl });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session", detail: error?.message });
    }
  });

  // POST /api/billing/cancel — 期間末キャンセル
  app.options('/api/billing/cancel', (_req, res) => res.sendStatus(204));
  app.post('/api/billing/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const sub = await storage.getSubscription(userId);
      if (!sub?.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) return res.status(500).json({ message: "Stripe not configured" });

      const { cancelAt } = await cancelPlusSubscription({
        stripeSecretKey,
        stripeSubscriptionId: sub.stripeSubscriptionId,
      });

      res.json({ cancelAt });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription", detail: error?.message });
    }
  });

  // Webhook: no auth; verifies Stripe signature and updates subscription state.
  app.options('/api/billing/stripe-webhook', (_req, res) => res.sendStatus(204));
  app.post('/api/billing/stripe-webhook', async (req: any, res) => {
    try {
      const signatureHeader = req.header?.('stripe-signature');
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');

      const rawBody = req.rawBody as Buffer | undefined;
      if (!rawBody) return res.status(400).send('Missing rawBody');

      const event = verifyStripeWebhook({ rawBody, signatureHeader, webhookSecret });
      const obj = (event.data as any).object;

      switch (event.type) {
        case 'checkout.session.completed': {
          const userId = obj?.metadata?.userId as string | undefined;
          if (!userId) { console.warn('[stripe-webhook] Missing metadata.userId'); break; }
          const subscriptionId = obj?.subscription as string | undefined;
          const customerId = obj?.customer as string | undefined;
          // billingCycle はサブスクリプションオブジェクトから取得できないので metadata から渡す場合は
          // create-checkout-session 側で metadata に追加する。ここでは subscription.updated で補完。
          await storage.updateSubscription(userId, {
            plan: 'plus',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          });
          break;
        }
        case 'customer.subscription.updated': {
          // billing_cycle_anchor や current_period_end を同期する
          const customerId = obj?.customer as string | undefined;
          if (!customerId) break;
          const user = await storage.getUser(customerId);
          const userId = user?.id;
          if (!userId) break;
          const periodEnd = obj?.current_period_end
            ? new Date(obj.current_period_end * 1000)
            : null;
          const interval = obj?.items?.data?.[0]?.price?.recurring?.interval as string | undefined;
          const billingCycle = interval === 'year' ? 'yearly' : interval === 'month' ? 'monthly' : null;
          await storage.updateSubscription(userId, {
            plan: 'plus',
            billingCycle,
            currentPeriodEnd: periodEnd,
          });
          break;
        }
        case 'customer.subscription.deleted':
        case 'invoice.payment_failed': {
          const customerId = obj?.customer as string | undefined;
          if (!customerId) break;
          // stripeCustomerId で検索して plan を free に戻す
          const { db } = await import('./db.js');
          const { users } = await import('../shared/schema.js');
          const { eq } = await import('drizzle-orm');
          const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
          if (user) {
            await storage.updateSubscription(user.id, { plan: 'free', billingCycle: null, currentPeriodEnd: null });
          }
          break;
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).send('Webhook signature verification failed');
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const tasks = await storage.getUserTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const taskData = { ...req.body, userId };
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = req.body;
      const task = await storage.updateTask(taskId, updates);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      await storage.deleteTask(taskId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // TaskList routes
  app.get('/api/lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const lists = await storage.getUserTaskLists(userId);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching lists:", error);
      res.status(500).json({ message: "Failed to fetch lists" });
    }
  });

  app.post('/api/lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Free プラン: 3 リストまで (Smash List は仮想リストなので除外)
      const isPremium = await storage.isPremium(userId);
      if (!isPremium) {
        const existingLists = await storage.getUserTaskLists(userId);
        if (existingLists.length >= 3) {
          return res.status(403).json({
            error: "LIST_LIMIT_REACHED",
            message: "Upgrade to PixDone+ for unlimited lists",
          });
        }
      }

      const listData = { ...req.body, userId };
      const list = await storage.createTaskList(listData);
      res.json(list);
    } catch (error) {
      console.error("Error creating list:", error);
      res.status(500).json({ message: "Failed to create list" });
    }
  });

  app.put('/api/lists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const listId = parseInt(req.params.id);
      const { name } = req.body;
      const updatedList = await storage.updateTaskList(listId, { name });
      res.json(updatedList);
    } catch (error) {
      console.error("Error updating list:", error);
      res.status(500).json({ message: "Failed to update list" });
    }
  });

  app.delete('/api/lists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const listId = parseInt(req.params.id);
      await storage.deleteTaskList(listId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting list:", error);
      res.status(500).json({ message: "Failed to delete list" });
    }
  });

  app.get('/api/lists/:id/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const listId = parseInt(req.params.id);
      const userId = getSessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const tasks = await storage.getTasksByListId(listId, userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks for list:", error);
      res.status(500).json({ message: "Failed to fetch tasks for list" });
    }
  });

  // Link preview: fetch URL and return og:title, og:image (no auth required for unfurl)
  app.get('/api/link-preview', async (req, res) => {
    const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Missing or invalid url' });
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PixDone-LinkPreview/1.0 (https://pixdone.vercel.app)' },
        redirect: 'follow',
      });
      clearTimeout(timeout);
      if (!response.ok) {
        return res.status(502).json({ error: 'Failed to fetch URL' });
      }
      const html = await response.text();
      const headEnd = html.indexOf('</head>');
      const slice = headEnd > 0 ? html.slice(0, headEnd + 7) : html.slice(0, 60000);
      const getMeta = (name: string): string | null => {
        const prop = name.startsWith('og:') ? `property=["']${name.replace(/:/g, '\\:')}["']` : `name=["']${name}["']`;
        const re = new RegExp(`<meta[^>]+${prop}[^>]+content=["']([^"']+)["']`, 'i');
        const m = slice.match(re);
        if (m) return m[1];
        const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${prop}`, 'i');
        const m2 = slice.match(re2);
        return m2 ? m2[1] : null;
      };
      let title = getMeta('og:title') || getMeta('twitter:title') || null;
      let image = getMeta('og:image') || getMeta('twitter:image') || null;
      const description = getMeta('og:description') || getMeta('twitter:description') || null;
      if (!title) {
        const titleMatch = slice.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = titleMatch ? titleMatch[1].trim() : null;
      }
      if (image && image.startsWith('//')) image = 'https:' + image;
      if (image && image.startsWith('/')) {
        try {
          const base = new URL(url);
          image = base.origin + image;
        } catch (_) {}
      }
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json({ title: title || url, description, image, url });
    } catch (e: any) {
      if (e.name === 'AbortError') return res.status(504).json({ error: 'Timeout' });
      console.error('Link preview error:', e);
      res.status(502).json({ error: 'Failed to fetch URL' });
    }
  });

  // Serve the frontend application
  app.get('/app', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, '..', 'public') });
  });

  // Success! All routes registered
  console.log("✅ All API routes registered successfully");

  const httpServer = createServer(app);
  return httpServer;
}