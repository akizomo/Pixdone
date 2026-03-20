import express from "express";
import { registerRoutes } from "./routes.js";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Startup logging
console.log("🔧 Starting PixDone Server...");
console.log(`📊 Node.js version: ${process.version}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${process.env.PORT || 5000}`);

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const optionalEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET', 'REPLIT_DOMAINS'];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
const missingOptionalVars = optionalEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

if (missingOptionalVars.length > 0) {
  console.warn("⚠️ Missing optional environment variables (some features may be unavailable):", missingOptionalVars);
}

console.log("✅ All required environment variables are set");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS - allow all Replit domains
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all Replit domains
    if (origin.includes('.replit.app') || origin.includes('.replit.dev') || origin.includes('replit.com')) {
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    callback(null, true);
  },
  credentials: true,
}));

// Preflight handler for endpoints that only define GET/POST.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// Preflight handler for endpoints that only define GET/POST.
app.options('*', cors({
  origin: (_origin, callback) => callback(null, true),
  credentials: true,
}), (_req, res) => res.sendStatus(204));

// Body parsing
// Keep raw request body for Stripe webhook signature verification.
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Setup routes
const setupServer = async () => {
  try {
    console.log("📋 Registering routes...");
    const httpServer = await registerRoutes(app);
    console.log("✅ Routes registered successfully");

    // Start server
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 PixDone server running on port ${PORT}`);
      console.log(`🌐 Server accessible at http://0.0.0.0:${PORT}`);
      console.log("✅ Server initialization complete");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.error("📋 Error details:", error.stack);
    process.exit(1);
  }
};

setupServer();