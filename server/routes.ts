import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage.js";
import { setupAuth, isAuthenticated } from "./replitAuth.js";
import { setupGoogleAuth } from "./googleAuth.js";
import { setupEmailAuth } from "./emailAuth.js";
import { db } from "./db.js";
import { createCheckoutSession, verifyStripeWebhook } from "./billing/stripe.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate database connection on startup
  console.log("🔍 Testing database connection...");
  try {
    await db.execute('SELECT 1 as test');
    console.log("✅ Database connection successful");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw new Error(`Database connection failed: ${error.message}`);
  }

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
      await db.execute('SELECT 1 as test');

      res.status(200).json({
        status: 'healthy',
        message: 'PixDone server is running',
        database: 'connected',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      console.error("API Health check failed:", error);
      res.status(500).json({
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Comprehensive health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Test database connection
      await db.execute('SELECT 1 as test');

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
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Auth middleware setup with error handling
  try {
    console.log("🔐 Setting up authentication...");
    await setupAuth(app);
    console.log("✅ Replit Auth setup successful");
  } catch (error) {
    console.error("❌ Replit Auth setup failed:", error);
    throw new Error(`Replit Auth setup failed: ${error.message}`);
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // ---- Theme entitlements (Stripe) ----
  // OPTIONS for CORS preflight (must not require auth).
  app.options('/api/billing/entitlements', (_req, res) => res.sendStatus(204));
  app.get('/api/billing/entitlements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({
        synthwavePremium: !!user?.synthwavePremium,
      });
    } catch (error) {
      console.error("Error fetching entitlements:", error);
      res.status(500).json({ message: "Failed to fetch entitlements" });
    }
  });

  app.options('/api/billing/synthwave/create-checkout-session', (_req, res) => res.sendStatus(204));
  app.post('/api/billing/synthwave/create-checkout-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.synthwavePremium) {
        return res.status(409).json({ message: "Already unlocked" });
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      const priceId = process.env.STRIPE_PRICE_SYNTHWAVE_ONETIME;
      if (!stripeSecretKey || !priceId) {
        return res.status(500).json({ message: "Stripe is not configured (missing env)" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const successUrl = `${baseUrl}/?purchase=synthwave_success`;
      const cancelUrl = `${baseUrl}/?purchase=synthwave_cancelled`;

      const { checkoutUrl } = await createCheckoutSession({
        stripeSecretKey,
        priceId,
        userId,
        successUrl,
        cancelUrl,
        themeKey: 'synthwave',
      });

      res.json({ checkoutUrl });
    } catch (error: any) {
      console.error("Error creating synthwave checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Webhook: no auth; verifies Stripe signature and updates DB entitlement.
  app.options('/api/billing/stripe-webhook', (_req, res) => res.sendStatus(204));
  app.post('/api/billing/stripe-webhook', async (req: any, res) => {
    try {
      const signatureHeader = req.header?.('stripe-signature');
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');

      const rawBody = req.rawBody as Buffer | undefined;
      if (!rawBody) return res.status(400).send('Missing rawBody');

      const event = verifyStripeWebhook({
        rawBody,
        signatureHeader,
        webhookSecret,
      });

      if (event?.type === 'checkout.session.completed') {
        const metadata = event?.data?.object?.metadata ?? {};
        const userId = metadata.userId as string | undefined;

        if (userId) {
          await storage.updateUserSynthwavePremium(userId, true);
        } else {
          console.warn('[stripe-webhook] Missing metadata.userId');
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
      const userId = req.user.claims.sub;
      const tasks = await storage.getUserTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const lists = await storage.getUserTaskLists(userId);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching lists:", error);
      res.status(500).json({ message: "Failed to fetch lists" });
    }
  });

  app.post('/api/lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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