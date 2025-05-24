import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from 'cors';
import dotenv from 'dotenv';
import { setupVite, serveStatic, log } from "./vite";

// Load environment variables from .env file
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const clientOriginsEnv = process.env.CLIENT_ORIGINS;
const allowedOrigins = clientOriginsEnv ? clientOriginsEnv.split(',').map(origin => origin.trim()) : [];

if (allowedOrigins.length === 0) {
  if (process.env.NODE_ENV === 'development') {
    // Default fallback for local development if CLIENT_ORIGINS is not set in .env
    allowedOrigins.push('http://localhost:5173'); // Assuming Vite's default client port
    log("WARN: CLIENT_ORIGINS environment variable not set. Defaulting to http://localhost:5173 for CORS in development.");
  } else {
    log("ERROR: CLIENT_ORIGINS environment variable not set for production! CORS may block all cross-origin requests.");
    // In production, if CLIENT_ORIGINS is not set, allowedOrigins will be empty,
    // effectively blocking cross-origin requests, which is a safe default.
  }
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl) or if origin is in the allowed list
    // if (!origin || (allowedOrigins.length > 0 && allowedOrigins.includes(origin))) {
    //   callback(null, true);
    // } else {
    //   log(`CORS: Blocked origin - ${origin}. Allowed: ${allowedOrigins.join(', ') || 'NONE (check CLIENT_ORIGINS env var)'}`);
    //   callback(new Error('Not allowed by CORS'));
    // }
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    } 
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Explicitly list allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Common headers, add any custom ones your client sends
  credentials: true, // Important for sessions/cookies and authorization headers
  optionsSuccessStatus: 204 // Standard success status for OPTIONS preflight requests

}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://bolreckitt.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  console.log('Incoming origin:', req.headers.origin);
  console.log('Allowed origins:', allowedOrigins);
  next();
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

     // Log the error server-side
    console.error(`Error: ${status} - ${message}`, err.stack);
    res.status(status).json({ message });
    
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
