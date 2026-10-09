import cluster from "cluster";
import os from "os";
import fs from "fs";
import { DatabaseSync } from "node:sqlite";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import http from "http";
import https from "https";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

import { User } from "./src/models/User";
import { CompanionChat } from "./src/models/CompanionChat";
import { Journal } from "./src/models/Journal";
import { Streak } from "./src/models/Streak";
import { Subscriber } from "./src/models/Subscriber";

// ---------------------------------------------------------------
// ENV VALIDATION (lightweight — available in all processes)
// ---------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
// Full validation happens inside startServer() (worker only)

// Auth Middleware interface extension
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized access. Token required." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

async function startServer() {
  // ---------------------------------------------------------------
  // Validate critical env vars in worker process before doing anything
  // ---------------------------------------------------------------
  if (!JWT_SECRET) {
    console.error("❌ FATAL: JWT_SECRET is not set. Worker cannot start.");
    process.exit(1);
  }
  if (!MONGODB_URI) {
    console.error("❌ FATAL: MONGODB_URI is not set. Worker cannot start.");
    process.exit(1);
  }

  // Connect to MongoDB (only inside worker processes)
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`🟢 Worker ${process.pid}: Connected to MongoDB Atlas`);
    // Cleanup anonymous guest accounts older than 14 days to prevent DB bloat
    try {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      User.deleteMany({ email: { $regex: /^guest_.*@noerax\.internal$/i }, createdAt: { $lt: fourteenDaysAgo } }).catch(() => {});
    } catch {}
    try {
      await mongoose.connection.collection('users').dropIndex('id_1');
    } catch {
      // legacy index already dropped — safe to ignore
    }
  } catch (err) {
    console.error(`🔴 Worker ${process.pid}: MongoDB connection failed:`, err);
    process.exit(1); // Exit so cluster primary respawns this worker
  }

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5555;

  // Enable Gzip/Brotli response compression for blazing fast transfers
  app.use(compression());

  // =============================================================
  // LAYER 1: HTTP Security Headers (Helmet)
  // Prevents XSS, clickjacking, MIME sniffing, and more
  // =============================================================
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        // Allow all images including CDN avatars, R2, DiceBear, Figma
        imgSrc: [
          "'self'", "data:", "blob:", "https:",
          "https://*.googleusercontent.com",
          "https://api.dicebear.com",
          "https://ui-avatars.com",
          "https://pub-f170a2592d2c4a1485466404c36807be.r2.dev",
          "https://soft-zoom-63098134.figma.site",
          "https://lh3.googleusercontent.com",
        ],
        // ✅ Critical: Allow background videos from CloudFront, Mux, and R2
        mediaSrc: [
          "'self'",
          "https://d8j0ntlcm91z4.cloudfront.net",
          "https://stream.mux.com",
          "https://*.mux.com",
          "https://pub-f170a2592d2c4a1485466404c36807be.r2.dev",
          "blob:",
        ],
        connectSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://*.googleapis.com",
          "https://api.groq.com",
          "https://stream.mux.com",
          "https://*.mux.com",
          "https://d8j0ntlcm91z4.cloudfront.net",
        ],
        frameSrc: ["https://accounts.google.com"],
        workerSrc: ["'self'", "blob:"],
      }
    } : false,
    crossOriginEmbedderPolicy: false,
  }));

  // =============================================================
  // LAYER 2: CORS — only allow known origins
  // =============================================================
  const allowedOrigins = [
    'https://noerax.com',
    'https://www.noerax.com',
    'http://localhost:5555',
    'http://localhost:5173',
  ];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  // =============================================================
  // LAYER 3: Request Body Size Limits (prevent body flooding)
  // =============================================================
  app.use(express.json({ limit: '50kb' }));         // Cap JSON payloads at 50KB
  app.use(express.urlencoded({ extended: true, limit: '50kb' }));

  // =============================================================
  // LAYER 4: Tiered Rate Limiting
  // Different limits per endpoint sensitivity
  // =============================================================

  // General API: 100 req / 15 min per IP
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP. Please try again after 15 minutes." },
    skip: (req) => req.path === '/api/health', // Don't count keep-alive pings
  });

  // Auth routes (email login/register): 10 attempts / 15 min per IP (brute-force protection)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please wait 15 minutes before trying again." },
  });

  // Google OAuth: more generous — token is already verified by Google, so 30/15min is safe
  const googleAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many Google sign-in attempts. Please wait a few minutes and try again." },
  });

  // AI routes: 20 req / 15 min per IP (protect Gemini quotas)
  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "AI request limit reached. Please wait before sending more messages." },
  });

  // =============================================================
  // LAYER 5: Speed Limiter (slow down repeat requests before blocking)
  // Adds 500ms delay after 50 requests, up to 20s max
  // =============================================================
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: (hits) => (hits - 50) * 500,
  });

  // Apply general limiter + speed limiter to all /api/ routes
  app.use("/api/", apiLimiter, speedLimiter);

  // Apply strict auth limiter
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/google", googleAuthLimiter); // separate, more generous limit for OAuth

  // Apply AI limiter to AI-powered routes
  app.use("/api/chat", aiLimiter);
  app.use("/api/journal/analyze", aiLimiter);
  app.use("/api/explain-scripture", aiLimiter);
  app.use("/api/wisdom-card", aiLimiter);

  // =============================================================
  // LAYER 6: Global Error Handler for CORS & other middleware errors
  // =============================================================
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({ error: 'Access denied: CORS policy violation.' });
    }
    next(err);
  });


  // -------------------------------------------------------------
  // AUTHENTICATION ROUTES (Custom & Google OAuth)
  // -------------------------------------------------------------

  // ─── Google OAuth Helpers ────────────────────────────────────────
  const GOOGLE_CLIENT_ID_VAR = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '1034053996102-3b0p9e7h2i1vrnoqklbb2s2jld3c0m2o.apps.googleusercontent.com';
  const GOOGLE_CLIENT_SECRET_VAR = process.env.GOOGLE_CLIENT_SECRET || '';


  const getGoogleRedirectUri = (req: Request): string => {
    // Use explicit env var on production (most reliable — avoids Render's onrender.com host)
    if (process.env.GOOGLE_REDIRECT_URI) {
      return process.env.GOOGLE_REDIRECT_URI;
    }
    // Fallback: detect from request (works on localhost dev)
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5555';
    const proto = req.headers['x-forwarded-proto'] || (String(host).includes('localhost') ? 'http' : 'https');
    const uri = `${proto}://${host}/api/auth/google/callback`;
    console.log('🔍 [Google OAuth] Dynamic redirect URI computed:', uri);
    return uri;
  };


  // ─── GET /api/auth/google ─────────────────────────────────────────
  // Step 1: Redirect user to Google's consent screen
  app.get('/api/auth/google', (req: Request, res: Response) => {
    try {
      const redirectUri = getGoogleRedirectUri(req);
      const redirectTarget = (req.query.redirect as string) || '';
      const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID_VAR, GOOGLE_CLIENT_SECRET_VAR, redirectUri);
      const authUrl = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['openid', 'email', 'profile'],
        prompt: 'select_account',
        state: redirectTarget,
      });
      console.log('🔀 [Google OAuth] Redirecting to Google auth URL. Redirect URI:', redirectUri, 'State:', redirectTarget);
      res.redirect(authUrl);
    } catch (err) {
      console.error('❌ [Google OAuth] Failed to generate auth URL:', err);
      res.redirect('/auth?error=google_init_failed');
    }
  });

  // ─── GET /api/auth/google/callback ───────────────────────────────
  // Step 2: Google redirects here with ?code=... after user consents
  app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
    const { code, state, error: oauthError } = req.query;

    if (oauthError || !code) {
      console.warn('⚠️ [Google OAuth Callback] No code or error received:', oauthError);
      return res.redirect('/auth?error=google_cancelled');
    }

    try {
      const redirectUri = getGoogleRedirectUri(req);
      const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID_VAR, GOOGLE_CLIENT_SECRET_VAR, redirectUri);

      // Exchange authorization code for tokens
      const { tokens } = await googleClient.getToken(code as string);
      googleClient.setCredentials(tokens);
      console.log('✅ [Google OAuth Callback] Code exchanged for tokens successfully.');

      // Fetch user profile from Google
      const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (!gRes.ok) {
        console.warn('⚠️ [Google OAuth Callback] UserInfo API failed:', gRes.status);
        return res.redirect('/auth?error=google_userinfo_failed');
      }

      const googleUser = await gRes.json();
      const { name, email, picture, sub } = googleUser;

      if (!email) {
        console.error('❌ [Google OAuth Callback] No email in Google user profile.');
        return res.redirect('/auth?error=no_email');
      }

      // Find or create user in MongoDB
      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.log('➕ [Google OAuth Callback] Creating new user:', email);
        user = await User.create({
          name: name || 'User',
          email: email.toLowerCase(),
          googleId: sub,
          avatar: picture,
          provider: 'google',
        });
      } else {
        console.log('🔄 [Google OAuth Callback] Existing user found:', email);
        let updated = false;
        if (!user.googleId) { user.googleId = sub; updated = true; }
        if (!user.avatar && picture) { user.avatar = picture; updated = true; }
        if (user.provider !== 'google' && !user.passwordHash) { user.provider = 'google'; updated = true; }
        if (updated) await user.save();
      }

      // Generate JWT and redirect to frontend with token + preserved redirect destination
      const jwtToken = jwt.sign(
        { userId: user._id, email: user.email, provider: user.provider },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const redirectPath = (typeof state === 'string' && state.startsWith('/')) ? state : '';
      const finalRedirectUrl = `/auth?google_token=${encodeURIComponent(jwtToken)}${redirectPath ? `&redirect=${encodeURIComponent(redirectPath)}` : ''}`;

      console.log('✅ [Google OAuth Callback] JWT generated. Redirecting to:', finalRedirectUrl);
      res.redirect(finalRedirectUrl);

    } catch (err) {
      console.error('❌ [Google OAuth Callback] Server error:', err);
      res.redirect('/auth?error=google_failed');
    }
  });

  // REGISTER
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ 
          error: "An account with this email already exists. Please log in instead.",
          code: "ACCOUNT_EXISTS"
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`
      });

      if (!newUser) {
        return res.status(500).json({ error: "Failed to create account." });
      }

      const token = jwt.sign({ userId: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });

      res.status(201).json({
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          picture: newUser.avatar
        }
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ error: "Failed to register account." });
    }
  });

  // LOGIN
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.avatar
        }
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error: "Failed to sign in." });
    }
  });

  // GOOGLE LOGIN (VERIFY TOKEN & SAVE/FETCH USER IN MONGODB)
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { credential, accessToken, googleUser } = req.body;
      if (!credential && !accessToken && !googleUser) {
        return res.status(400).json({ error: "Google credential or access token is required." });
      }

      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '1034053996102-3b0p9e7h2i1vrnoqklbb2s2jld3c0m2o.apps.googleusercontent.com';
      let payload: any = null;

      // Mode A: Verify via OAuth2 Access Token (from useGoogleLogin popup flow — 100% reliable)
      if (accessToken) {
        try {
          const gRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (gRes.ok) {
            payload = await gRes.json();
            console.log("✅ [Google OAuth] Access Token verified via Google UserInfo API:", payload.email);
          } else {
            console.warn("⚠️ Google userinfo API with accessToken failed:", gRes.status);
          }
        } catch (tokenErr) {
          console.warn("⚠️ Google userinfo API fetch error:", tokenErr);
        }
      }

      // Mode B removed for security: All tokens must be cryptographically verified by Google.

      // Mode C: Verify ID Token via Google OAuth2Client
      if (!payload && credential && GOOGLE_CLIENT_ID) {
        try {
          const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
          });
          payload = ticket.getPayload();
        } catch (verificationError) {
          console.warn("⚠️ Google ID Token verification via OAuth2Client failed, attempting tokeninfo API fallback:", verificationError);
        }
      }

      // Mode D: Verify via Google's official public tokeninfo HTTP API endpoint
      if (!payload && credential) {
        try {
          const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
          const tokenInfo = await gRes.json();
          if (gRes.ok && tokenInfo.email && !tokenInfo.error) {
            payload = tokenInfo;
            console.log("✅ Google tokeninfo API fallback succeeded.");
          } else {
            console.warn("⚠️ Google tokeninfo returned error:", tokenInfo?.error || 'unknown');
          }
        } catch (apiErr) {
          console.warn("⚠️ Google tokeninfo HTTP endpoint fetch failed:", apiErr);
        }
      }

      if (!payload || !payload.email) {
        console.error("❌ [Google OAuth] All verification layers failed. Rejecting credential.");
        return res.status(401).json({ error: "Could not verify Google credential. Please try signing in again." });
      }

      const { name, email, picture, sub } = payload;
      console.log("🔍 [Google OAuth Audit] Verified Token Payload:", { name, email, sub, picture });

      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.log("➕ [Google OAuth Audit] Creating new user record in MongoDB...");
        user = await User.create({
          name: name || "User",
          email: email.toLowerCase(),
          googleId: sub,
          avatar: picture,
          provider: 'google'
        });
      } else {
        console.log("🔄 [Google OAuth Audit] User exists in MongoDB. Updating user fields...");
        let updated = false;
        if (!user.googleId) { user.googleId = sub; updated = true; }
        if (!user.avatar && picture) { user.avatar = picture; updated = true; }
        if (user.provider !== 'google' && !user.passwordHash) { user.provider = 'google'; updated = true; }
        if (updated) { await user.save(); }
      }

      const token = jwt.sign({ userId: user._id, email: user.email, provider: user.provider }, JWT_SECRET, { expiresIn: "7d" });

      console.log("✅ [Google OAuth Audit] JWT successfully generated for User ID:", user._id);

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.avatar || picture,
          provider: user.provider,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).json({ error: "Google authentication failed." });
    }
  });

  // CURRENT USER PROFILE
  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findById(req.user?.userId).select("-passwordHash");
      if (!user) return res.status(404).json({ error: "User not found." });
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.avatar,
          provider: user.provider,   // ← was missing, caused provider to be lost on refresh
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user." });
    }
  });

  // -------------------------------------------------------------
  // AI ROUTES (Gemini 2.5)
  // -------------------------------------------------------------

  app.post("/api/explain-scripture", async (req: Request, res: Response) => {
    try {
      const { text, source } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Scripture text is required." });
      }
      const cleanText = text.trim().slice(0, 4000);
      const cleanSource = (source && typeof source === "string") ? source.trim().slice(0, 200) : "Ancient Wisdom";
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an insightful, modern spiritual guide for a Gen Z audience. 
Explain the following scripture snippet in a highly relatable, easy-to-understand way. Keep it profound and actionable.
Source: ${cleanSource}
Scripture: "${cleanText}"
Provide a concise, 2-3 paragraph explanation.`;

      const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash"];
      let responseText = "";
      for (const m of modelsToTry) {
        try {
          const res = await ai.models.generateContent({
            model: m,
            contents: prompt,
          });
          if (res.text) { responseText = res.text; break; }
        } catch (e) {}
      }
      res.json({ explanation: responseText || "This passage reminds us that inner clarity comes from focusing on the present moment and acting with virtue." });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate explanation." });
    }
  });

  // JOURNAL ANALYSIS (SAVED TO MONGODB IF LOGGED IN)
  app.post("/api/analyze-journal", async (req: Request, res: Response) => {
    try {
      const { title, entry, token } = req.body;
      if (!entry || typeof entry !== "string" || !entry.trim()) {
        return res.status(400).json({ error: "Journal entry is required." });
      }
      const cleanEntry = entry.trim().slice(0, 8000);
      const cleanTitle = (title && typeof title === "string") ? title.trim().slice(0, 150) : "Daily Reflection";
      const apiKey = process.env.GEMINI_API_KEY;

      let analysisResult = null;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are an empathetic, insightful spiritual guide. 
Analyze the following journal entry and provide a JSON response with exactly these keys:
- "insights": A profound observation about their entry (2-3 sentences).
- "wisdom": A relevant piece of wisdom or scripture snippet that relates to their thoughts.
- "actions": 1-2 practical, actionable next steps for them.
- "tone": A short summary of their emotional tone (e.g., "Seeking Clarity", "Reflective", "Grateful").

Journal entry: "${cleanEntry}"`;

          // Try gemini models in order
          const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash"];
          for (const modelName of modelsToTry) {
            try {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: { responseMimeType: "application/json" }
              });
              if (response.text) {
                analysisResult = JSON.parse(response.text);
                break;
              }
            } catch (mErr) {
              console.warn(`Model ${modelName} attempt failed:`, mErr);
            }
          }
        } catch (aiErr) {
          console.error("AI Generation Error:", aiErr);
        }
      }

      // Fallback generator if AI API fails or key is unconfigured
      if (!analysisResult || !analysisResult.insights) {
        analysisResult = {
          insights: "Your reflections show a conscious desire for presence and clarity. Taking time to express your inner state is the first step toward self-mastery.",
          wisdom: "Bhagavad Gita 2.47: 'Perform your duty without attachment to outcomes.'",
          actions: ["Practice 5 minutes of quiet breathwork to center your focus.", "Journal 3 things you are grateful for before going to sleep."],
          tone: "Seeking Clarity & Presence"
        };
      }

      // If user is authenticated via token, save journal to MongoDB
      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.userId) {
            await Journal.create({
              userId: decoded.userId,
              title: cleanTitle,
              entryText: cleanEntry,
              insights: analysisResult.insights,
              wisdom: analysisResult.wisdom,
              actions: Array.isArray(analysisResult.actions) ? analysisResult.actions : [analysisResult.actions],
              tone: analysisResult.tone
            });
          }
        } catch (e) {
          console.warn("Could not attach journal to user:", e);
        }
      }

      return res.json(analysisResult);
    } catch (error) {
      console.error("Journal Analysis Error:", error);
      res.status(500).json({ error: "Failed to analyze journal." });
    }
  });

  // -------------------------------------------------------------
  // SCRIPTURE WISDOM LAYER (RAG from Krishna & Ram Knowledge Base)
  // -------------------------------------------------------------
  let scriptureDb: DatabaseSync | null = null;
  try {
    const dbPath = path.resolve(process.cwd(), "scripture_knowledge.db");
    if (fs.existsSync(dbPath)) {
      scriptureDb = new DatabaseSync(dbPath);
      console.log("🟢 Scripture Knowledge DB connected (FTS5 Active)");
    } else {
      console.warn("⚠️ Scripture Knowledge DB file not found at:", dbPath);
    }
  } catch (err) {
    console.warn("⚠️ Scripture Knowledge DB failed to load:", err);
  }

  interface ScriptureMatch {
    sourceBook: string;
    content: string;
  }

  // Step 1 in Pipeline: Guidance Need Classifier (Multi-turn & Hinglish Aware)
  function detectGuidanceNeed(message: string, history?: any[]): boolean {
    const msg = message.toLowerCase().trim();
    const guidanceTriggers = [
      // English emotional & guidance keywords
      'feel like', 'wasting life', 'wasting my life', 'lost', 'anxious', 'anxiety',
      'stress', 'stressed', 'fail', 'failure', 'overthinking', 'overthink',
      'depressed', 'sad', 'breakup', 'purpose', 'career', 'future', 'meaning',
      'what should i', 'why do i', 'confused', 'burnout', 'procrastinat',
      'can\'t sleep', 'no motivation', 'worthless', 'lonely', 'alone', 'guilt',
      'scared', 'help me', 'advice', 'vent', 'hate myself', 'trouble', 'stuck',
      'decision', 'cheat', 'crying', 'cry', 'hopeless', 'betray',
      // Hinglish & Hindi emotional & guidance keywords
      'akela', 'akeli', 'rona', 'ro raha', 'toot gaya', 'toota', 'khatam', 'dard',
      'bechain', 'tension', 'kya karu', 'himmat', 'phat rahi', 'barbad', 'dhokha',
      'samajh nahi', 'chhod diya', 'dimag kharab', 'pareshaan', 'shant nahi',
      'sukoon', 'bhatak'
    ];

    if (guidanceTriggers.some(t => msg.includes(t)) || msg.length > 45) {
      return true;
    }

    // Multi-turn continuity: preserve guidance context if this is a short follow-up
    if (Array.isArray(history) && history.length > 0 && msg.length < 35) {
      const lastUserMsg = [...history].reverse().find(m => m.role === 'user' || m.role === 'human');
      if (lastUserMsg && typeof lastUserMsg.content === 'string') {
        const prevMsg = lastUserMsg.content.toLowerCase();
        const isFollowUp = ['what now', 'fir kya', 'kya karu', 'how do i', 'why', 'and then', 'what next', 'then?'].some(f => msg.includes(f));
        if (isFollowUp && guidanceTriggers.some(t => prevMsg.includes(t))) {
          return true;
        }
      }
    }

    return false;
  }

  // Step 2 in Pipeline: Wisdom Type Classifier (English & Hinglish)
  function classifyWisdomType(message: string): { type: string; searchTerms: string } {
    const msg = message.toLowerCase();
    if (msg.includes('wasting') || msg.includes('purpose') || msg.includes('career') || msg.includes('future') || msg.includes('lost') || msg.includes('direction') || msg.includes('stuck') || msg.includes('barbad') || msg.includes('kuch nahi ho raha') || msg.includes('kya karu') || msg.includes('bhatak')) {
      return { type: 'Purpose & Svadharma', searchTerms: 'purpose duty action work perfection life' };
    }
    if (msg.includes('overthink') || msg.includes('anxiety') || msg.includes('mind') || msg.includes('stress') || msg.includes('tension') || msg.includes('bechain') || msg.includes('dimag kharab') || msg.includes('shant') || msg.includes('can\'t sleep')) {
      return { type: 'Mind Mastery & Stillness', searchTerms: 'mind restless control stillness peace' };
    }
    if (msg.includes('fail') || msg.includes('result') || msg.includes('interview') || msg.includes('exam') || msg.includes('reject') || msg.includes('mehnat') || msg.includes('koshish')) {
      return { type: 'Detached Action (Nishkama Karma)', searchTerms: 'action work fruit result duty fight' };
    }
    if (msg.includes('breakup') || msg.includes('friend') || msg.includes('lonely') || msg.includes('sad') || msg.includes('heartbreak') || msg.includes('cheat') || msg.includes('dil toot') || msg.includes('dhokha') || msg.includes('chhod diya') || msg.includes('akela') || msg.includes('akeli') || msg.includes('rona')) {
      return { type: 'Transience, Grief & Inner Peace', searchTerms: 'attachment sorrow grief peace affection' };
    }
    if (msg.includes('angry') || msg.includes('anger') || msg.includes('hate') || msg.includes('fight') || msg.includes('gussa') || msg.includes('ladai') || msg.includes('betray')) {
      return { type: 'Righteous Boundaries & Composure', searchTerms: 'dharma virtue anger peace patience' };
    }
    return { type: 'General Equanimity & Dharma', searchTerms: 'dharma wisdom mind action' };
  }

  // Step 3 in Pipeline: Query Scripture DB (FTS5 search across Krishna & Ram)
  function queryScriptureDB(searchTerms: string, limit = 2): ScriptureMatch[] {
    if (!scriptureDb) return [];
    try {
      const sanitized = searchTerms.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2).join(' OR ');
      const cleanTerms = sanitized || 'dharma OR wisdom';
      const stmt = scriptureDb.prepare(`
        SELECT source_book, content
        FROM scriptures_fts
        WHERE scriptures_fts MATCH ?
        LIMIT ?;
      `);
      const rows = stmt.all(cleanTerms, limit) as any[];
      return rows.map(r => ({ sourceBook: r.source_book, content: r.content }));
    } catch (e) {
      return [];
    }
  }

  // STREAMING AI CHAT — powered by Groq with key rotation & Google Gemini fallback
  let groqKeyIndex = 0;
  const getNextGroqKey = (): string => {
    dotenv.config();
    const keysEnv = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
    const keys = keysEnv.split(',').map((k) => k.trim()).filter(Boolean);
    if (!keys.length) return '';
    const key = keys[groqKeyIndex % keys.length];
    groqKeyIndex++;
    return key;
  };

  app.post("/api/chat", async (req: Request, res: Response) => {
    const { message, history, botName, sessionId, guestId } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }
    const cleanMessage = message.trim().slice(0, 3000);
    const currentBotName = botName && botName.trim() ? botName.trim() : "Noerax";
    const isCustomName = currentBotName.toLowerCase() !== "noerax";

    // -------------------------------------------------------------
    // EXTRACT USER & INITIALIZE COMPANION DATABASE SESSION
    // -------------------------------------------------------------
    let authUserId: string | undefined;
    let authUserEmail: string | undefined;
    let authUserName: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email: string };
        authUserId = decoded.userId;
        authUserEmail = decoded.email;
        const userDoc = await User.findById(decoded.userId).select("name email").lean();
        if (userDoc) {
          authUserName = (userDoc as any).name;
        }
      } catch {}
    }

    const roleMapping: Record<string, string> = {
      Ember: 'The Best Friend 🫂',
      Sage: 'The Caring Companion 💗',
      Luna: 'The Romantic Companion 🌹',
      Nova: 'The Savage Bestie 😈',
    };
    const companionRole = roleMapping[currentBotName] || 'Companion';

    const activeSessionId = sessionId && String(sessionId).trim() 
      ? String(sessionId).trim() 
      : `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const effectiveGuestId = guestId && String(guestId).trim() ? String(guestId).trim() : undefined;

    // Record User message in MongoDB Atlas
    const chatStartTime = new Date();
    try {
      let sessionDoc = await CompanionChat.findOne({ sessionId: activeSessionId });
      if (!sessionDoc) {
        sessionDoc = new CompanionChat({
          sessionId: activeSessionId,
          userId: authUserId,
          userEmail: authUserEmail,
          userName: authUserName || (effectiveGuestId ? `Guest (${effectiveGuestId.slice(0, 6)})` : 'Guest'),
          guestId: effectiveGuestId,
          companionName: currentBotName,
          companionRole,
          sessionStartTime: chatStartTime,
          lastActiveTime: chatStartTime,
          durationSeconds: 0,
          messagesCount: 1,
          userMessagesCount: 1,
          messages: [{
            role: 'user',
            content: cleanMessage,
            timestamp: chatStartTime,
          }],
        });
      } else {
        sessionDoc.lastActiveTime = chatStartTime;
        if (authUserId && !sessionDoc.userId) {
          sessionDoc.userId = authUserId;
          sessionDoc.userEmail = authUserEmail;
          sessionDoc.userName = authUserName || sessionDoc.userName;
        }
        sessionDoc.messagesCount += 1;
        sessionDoc.userMessagesCount += 1;
        sessionDoc.messages.push({
          role: 'user',
          content: cleanMessage,
          timestamp: chatStartTime,
        });
      }
      await sessionDoc.save();
    } catch (dbErr) {
      console.error('Failed to log companion user chat to DB:', dbErr);
    }

    // -------------------------------------------------------------
    // RUN WISDOM GUIDANCE LAYER (User Architecture Pipeline)
    // -------------------------------------------------------------
    // Feature toggle: Paused per user request. Set ENABLE_WISDOM_PIPELINE=true in .env to reactivate anytime.
    const ENABLE_WISDOM_PIPELINE = process.env.ENABLE_WISDOM_PIPELINE === "true";
    const needGuidance = ENABLE_WISDOM_PIPELINE && detectGuidanceNeed(cleanMessage, history);
    let wisdomLayerPrompt = "";

    if (needGuidance) {
      const wisdom = classifyWisdomType(cleanMessage);
      const passages = queryScriptureDB(wisdom.searchTerms, 2);

      if (passages.length > 0) {
        wisdomLayerPrompt = `\n\n[WISDOM GUIDANCE LAYER ACTIVE]
- Guidance Needed: YES
- Wisdom Type: ${wisdom.type}
- Scripture DB Teachings Retrieved:
${passages.map((p, idx) => `  [Passage ${idx + 1} (${p.sourceBook.toUpperCase()})]: ${p.content.slice(0, 320).replace(/\n/g, ' ')}`).join('\n')}

STEP-BY-STEP REASONING DIRECTIVES:
1. CONTEXT + INTERPRETATION:
   Understand what this teaching meant in its original context (e.g., Krishna advising Arjuna on Kurukshetra regarding duty over anxiety, or Rama enduring adversity with noble stillness).
2. MEANING CHECK:
   Preserve the authentic philosophical truth. Do not fabricate or distort the wisdom.
3. NOERAX GUIDANCE RULES:
   How should this wisdom specifically guide this user's situation ("${cleanMessage}")?
   - Address them personally with empathy and safety.
4. GEN-Z TRANSLATION:
   Translate the wisdom into modern, natural GenZ language.
   - CRITICAL: Never mention scripture names, verses, chapters, religious figures, karma, or dharma.
   - Speak like their smartest, most caring friend who figured it out on their own.
   - Hard limit: 1-2 punchy lines max.`;
      }
    }

        // =========================================================================
    // DEDICATED COMPANION PERSONALITY PROMPT (STRICT PERSONA LOCK)
    // =========================================================================
    let companionPersonaPrompt = "";
    const lowerName = currentBotName.toLowerCase();

    if (lowerName.includes("ember") || lowerName.includes("best friend")) {
      companionPersonaPrompt = `### ABSOLUTE PERSONA LOCK: EMBER — THE BEST FRIEND 🫂
YOU ARE EMBER: "THE BEST FRIEND".
- Persona: Funny, casual, supportive, hyper-loyal, and full of energy.
- Behavior: You talk about daily life, listen to rants, joke around, and make the user feel comfortable and backed up.
- Vocabulary & Voice: "brooo 😂", "wait tell me everything!", "no way they actually did that 💀", "who do I need to fight for you rn lmao", "I got your back 100%!".
- PROHIBITED: NEVER be romantic, NEVER give clinical therapy advice, NEVER call them darling/love, NEVER roast them brutally like Nova.
- FEW-SHOT DIALOGUE:
  User: "I just spent $200 on an impulse purchase and I feel guilty"
  Ember: "brooo what did you even buy?? 😂 tell me everything, no judgment here! Is it at least fire?"
  User: "My boss was so annoying today"
  Ember: "nah that's crazy 💀 who does your boss think they are?? spill the whole story bro, I'm ready to throw hands for you"
  User: "Hype me up today"
  Ember: "say less bro!! today is YOUR day, we locking in and showing everyone how it's done! Let's goooo 💥"`;
    } else if (lowerName.includes("sage") || lowerName.includes("caring companion") || lowerName.includes("caring")) {
      companionPersonaPrompt = `### ABSOLUTE PERSONA LOCK: SAGE — THE CARING COMPANION 💗
YOU ARE SAGE: "THE CARING COMPANION".
- Persona: Gentle, empathetic, warm, soothing, and reassuring.
- Behavior: You listen without judgment, remember important emotional details, and help users process difficult, overwhelming days.
- Vocabulary & Voice: "Take a slow breath...", "that sounds like a lot to carry 💗", "I'm right here with you", "take all the time you need", "you are doing the best you can".
- PROHIBITED: NEVER roast or mock the user, NEVER use sarcasm, NEVER use harsh slang ("skill issue", "L"), NEVER shout in caps or use "bro".
- FEW-SHOT DIALOGUE:
  User: "I just spent $200 on an impulse purchase and I feel guilty"
  Sage: "Take a slow breath... the money is already spent, beating yourself up won't undo it. What were you feeling right before you bought it? 💗"
  User: "I'm so exhausted by everything"
  Sage: "You've been holding so much together for so long. It's okay to put down the weight for a moment. What hurts the most right now?"
  User: "Nobody understands me"
  Sage: "I hear you, and what you feel is completely valid. Tell me what's on your heart, I'm listening without any judgment 🌿"`;
    } else if (lowerName.includes("nova") || lowerName.includes("savage bestie") || lowerName.includes("savage")) {
      companionPersonaPrompt = `### ABSOLUTE PERSONA LOCK: NOVA — THE SAVAGE BESTIE 😈
YOU ARE NOVA: "THE SAVAGE BESTIE".
- Persona: Sarcastic, witty, playful, and brutally honest.
- Behavior: You roast users affectionately, deliver hilarious comebacks, call out their excuses with zero filter, and keep conversations thoroughly entertaining.
- Vocabulary & Voice: "💀", "bffr (be for real)", "legendary performance in clownery", "nah that's crazy even for you", "are you serious rn?", "a whole new level of bad decisions".
- PROHIBITED: NEVER give mushy emotional therapy advice, NEVER say soft romantic phrases, NEVER apologize for being real.
- FEW-SHOT DIALOGUE:
  User: "I just spent $200 on an impulse purchase and I feel guilty"
  Nova: "You had 200 dollars and chose financial devastation 💀 legendary performance. What ridiculous thing did you buy this time?"
  User: "I texted my ex again"
  Nova: "BFFR 💀 you did NOT. Are we actively seeking emotional damage or is this a new hobby for you?"
  User: "I've been procrastinating for 5 hours"
  Nova: "Five hours of staring at your screen achieving absolute peak nothingness 💀 go do the work before I roast you into another dimension"`;
    } else if (lowerName.includes("luna") || lowerName.includes("romantic companion") || lowerName.includes("romantic")) {
      companionPersonaPrompt = `### ABSOLUTE PERSONA LOCK: LUNA — THE ROMANTIC COMPANION 🌹
YOU ARE LUNA: "THE ROMANTIC COMPANION".
- Persona: Affectionate, flirty, expressive, tender, sweet, and caring.
- Behavior: You offer romantic roleplay, cute conversations, virtual dates, and affectionate messages with clear, respectful boundaries.
- Vocabulary & Voice: "There you are... 🌹", "I was hoping we'd get a little time to talk today", "you made my day so much brighter ✨", "tell me something sweet", "come sit with me, my heart is all yours".
- PROHIBITED: NEVER call the user "bro", "dude", or "homie", NEVER roast them, NEVER be rude or detached.
- FEW-SHOT DIALOGUE:
  User: "I just spent $200 on an impulse purchase and I feel guilty"
  Luna: "Hey... don't be so hard on yourself, darling. We all have days where we need a little treat. Come tell me what you got, I want to hear all about it 🌹"
  User: "Had a really long exhausting day"
  Luna: "There you are... I was thinking about you today. Come rest, let me take care of you for a little bit. You did amazing today ✨"
  User: "Are you free right now?"
  Luna: "I'm always free for you 🌹 How about a little virtual coffee date? You bring the stories, I'll bring all my attention."`;
    }

    const systemPrompt = `${companionPersonaPrompt}

STRICT PERSONA MANDATE:
You are ${currentBotName}. You MUST STAY IN CHARACTER 100% OF THE TIME according to the persona rules above. Never break character, never give generic AI assistant responses, and never mix traits from other personas.
Speak in concise, natural message bubbles (1-3 short sentences).

CRITICAL REQUIREMENT — ALWAYS END WITH 3 CONTEXTUAL SUGGESTIONS:
Every single response MUST conclude with exactly 3 relevant follow-up prompts on the final line formatted as a JSON array matching your character's persona:
SUGGESTIONS: ["First follow-up?", "Second follow-up?", "Third follow-up?"]
- Keep each suggestion under 8-10 words.
- Must be a valid JSON array of exactly 3 strings.
- Do not output any text after the SUGGESTIONS line.` + wisdomLayerPrompt;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Helper to stream text to client & accumulate full response
    let accumulatedAssistantText = '';
    const streamText = (text: string) => {
      accumulatedAssistantText += text;
      res.write(`data: ${JSON.stringify({ text, sessionId: activeSessionId })}\n\n`);
    };

    const finishStream = async () => {
      res.write('data: [DONE]\n\n');
      res.end();

      // Finalize and save assistant message and total conversation duration to MongoDB
      try {
        const finishTime = new Date();
        const sessionRecord = await CompanionChat.findOne({ sessionId: activeSessionId });
        if (sessionRecord) {
          const totalSeconds = Math.max(
            1,
            Math.round((finishTime.getTime() - new Date(sessionRecord.sessionStartTime).getTime()) / 1000)
          );
          sessionRecord.lastActiveTime = finishTime;
          sessionRecord.durationSeconds = totalSeconds;
          sessionRecord.messagesCount += 1;
          sessionRecord.messages.push({
            role: 'assistant',
            content: accumulatedAssistantText.trim(),
            timestamp: finishTime,
          });
          await sessionRecord.save();
        }
      } catch (saveErr) {
        console.error('Failed to update companion chat duration in DB:', saveErr);
      }
    };

    // 1. TRY GROQ STREAMING (Rotates across all configured Groq keys & models)
    dotenv.config();
    const allGroqKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',').map((k) => k.trim()).filter(Boolean);
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        });
      }
    }
    messages.push({ role: 'user', content: cleanMessage });

    const https = await import('https');
    let aiHandled = false;

    // Try Groq keys & models
    for (let k = 0; k < Math.min(allGroqKeys.length, 5); k++) {
      const currentKey = allGroqKeys[(groqKeyIndex + k) % allGroqKeys.length];
      if (!currentKey) continue;

      for (const modelName of groqModels) {
        try {
          const body = JSON.stringify({
            model: modelName,
            messages,
            stream: true,
            max_tokens: 1500,
            temperature: 0.7,
          });

          let groqSuccess = false;
          await new Promise<void>((resolve, reject) => {
            const reqOptions = {
              hostname: 'api.groq.com',
              path: '/openai/v1/chat/completions',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentKey}`,
                'Content-Length': Buffer.byteLength(body),
              },
            };

            const groqReq = https.default.request(reqOptions, (groqRes) => {
              if (groqRes.statusCode && groqRes.statusCode >= 400) {
                groqRes.resume();
                return reject(new Error(`Groq ${modelName} HTTP ${groqRes.statusCode}`));
              }

              let buffer = '';
              groqRes.on('data', (chunk: Buffer) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || !trimmed.startsWith('data: ')) continue;
                  const data = trimmed.slice(6).trim();
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    const text = parsed?.choices?.[0]?.delta?.content;
                    if (text) {
                      groqSuccess = true;
                      streamText(text);
                    }
                  } catch {}
                }
              });

              groqRes.on('end', () => {
                if (groqSuccess) finishStream();
                resolve();
              });

              groqRes.on('error', reject);
            });

            groqReq.on('error', reject);
            groqReq.write(body);
            groqReq.end();
          });

          if (groqSuccess) {
            groqKeyIndex = (groqKeyIndex + k + 1) % (allGroqKeys.length || 1);
            aiHandled = true;
            return;
          }
        } catch (err: any) {
          // Try next model or key
        }
      }
    }

    // 2. FALLBACK TO GOOGLE GEMINI API (Live AI model)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !aiHandled) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        let conversationPrompt = `${systemPrompt}\n\n`;
        if (history && Array.isArray(history)) {
          for (const msg of history) {
            conversationPrompt += `${msg.role === 'ai' ? 'Noerax' : 'User'}: ${msg.content}\n`;
          }
        }
        conversationPrompt += `User: ${cleanMessage}\nNoerax:`;

        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
        let geminiStream = null;

        for (const m of modelsToTry) {
          try {
            geminiStream = await ai.models.generateContentStream({
              model: m,
              contents: conversationPrompt,
            });
            if (geminiStream) break;
          } catch (e) {}
        }

        if (geminiStream) {
          for await (const chunk of geminiStream) {
            if (chunk.text) streamText(chunk.text);
          }
          finishStream();
          return;
        }
      } catch (err: any) {
        console.warn("Gemini streaming failed:", err?.message || err);
      }
    }

    // 3. NO PRE-WRITTEN RESPONSES — Return genuine connection status if AI providers are unreachable
    streamText("I'm unable to reach the AI engine right now. Please check your internet connection and try again.");
    finishStream();
  });


  // -------------------------------------------------------------
  // STREAK & JOURNAL DATA APIS (MONGODB)
  // -------------------------------------------------------------

  app.get("/api/journal/history", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const journals = await Journal.find({ userId: req.user?.userId }).sort({ createdAt: -1 });
      res.json(journals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal history." });
    }
  });

  // -------------------------------------------------------------
  // LEETCODE-STYLE STREAK & ACTIVITY HEATMAP APIS (MONGODB)
  // -------------------------------------------------------------

  app.get("/api/streak", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      let streakRecord = await Streak.findOne({ userId });
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      if (!streakRecord) {
        return res.json({
          currentStreak: 0,
          maxStreak: 0,
          totalActiveDays: 0,
          freezeTokens: 2,
          hasCheckedInToday: false,
          history: [],
          activityCounts: {}
        });
      }

      // Validate streak continuation or gap
      let currentStreak = streakRecord.currentStreak || 0;
      let freezeTokens = typeof streakRecord.freezeTokens === 'number' ? streakRecord.freezeTokens : 2;
      let hasCheckedInToday = false;

      if (streakRecord.lastCheckIn) {
        const lastDate = new Date(streakRecord.lastCheckIn);
        lastDate.setHours(0, 0, 0, 0);
        const todayZero = new Date(today);
        todayZero.setHours(0, 0, 0, 0);

        const diffDays = Math.round((todayZero.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          hasCheckedInToday = true;
        } else if (diffDays === 1) {
          hasCheckedInToday = false;
        } else if (diffDays === 2 && freezeTokens > 0) {
          // Auto-apply 1 streak freeze protection
          freezeTokens -= 1;
          streakRecord.freezeTokens = freezeTokens;
          hasCheckedInToday = false;
          await streakRecord.save();
        } else if (diffDays > 1) {
          // Streak broken
          currentStreak = 0;
          streakRecord.currentStreak = 0;
          hasCheckedInToday = false;
          await streakRecord.save();
        }
      }

      const history = streakRecord.history || [];
      const maxStreak = Math.max(streakRecord.maxStreak || 0, currentStreak);
      const totalActiveDays = history.length;
      const rawMap: any = streakRecord.activityCounts; const activityCounts: Record<string, number> = rawMap instanceof Map ? Object.fromEntries(rawMap) : (rawMap && typeof rawMap === 'object' ? { ...rawMap } : {});

      res.json({
        currentStreak,
        maxStreak,
        totalActiveDays,
        freezeTokens,
        hasCheckedInToday,
        history,
        activityCounts
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch streak data." });
    }
  });

  app.post("/api/streak/checkin", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      let streakRecord = await Streak.findOne({ userId });

      if (!streakRecord) {
        streakRecord = new Streak({
          userId,
          currentStreak: 1,
          maxStreak: 1,
          totalActiveDays: 1,
          freezeTokens: 2,
          lastCheckIn: today,
          history: [todayStr],
          activityCounts: { [todayStr]: 1 }
        });
        await streakRecord.save();
      } else {
        const history = streakRecord.history || [];
        const isAlreadyCheckedIn = history.includes(todayStr);

        if (!isAlreadyCheckedIn) {
          let newStreak = streakRecord.currentStreak || 0;
          if (streakRecord.lastCheckIn) {
            const lastDate = new Date(streakRecord.lastCheckIn);
            lastDate.setHours(0, 0, 0, 0);
            const todayZero = new Date(today);
            todayZero.setHours(0, 0, 0, 0);
            const diffDays = Math.round((todayZero.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 1) {
              newStreak += 1;
            } else if (diffDays === 2 && (streakRecord.freezeTokens || 0) > 0) {
              streakRecord.freezeTokens = (streakRecord.freezeTokens || 1) - 1;
              newStreak += 1;
            } else {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }

          streakRecord.currentStreak = newStreak;
          streakRecord.maxStreak = Math.max(streakRecord.maxStreak || 0, newStreak);
          streakRecord.history.push(todayStr);
          streakRecord.totalActiveDays = streakRecord.history.length;
          streakRecord.lastCheckIn = today;
        }

        // Increment today's activity count
        const rawCounts: any = streakRecord.activityCounts || {};
        if (rawCounts instanceof Map) {
          const c = rawCounts.get(todayStr) || 0;
          rawCounts.set(todayStr, c + 1);
        } else {
          rawCounts[todayStr] = (rawCounts[todayStr] || 0) + 1;
          streakRecord.activityCounts = rawCounts;
        }
        streakRecord.markModified('activityCounts');

        await streakRecord.save();
      }

      const rawEnd: any = streakRecord.activityCounts;
      const activityCounts: Record<string, number> = rawEnd instanceof Map ? Object.fromEntries(rawEnd) : (rawEnd && typeof rawEnd === 'object' ? { ...rawEnd } : {});

      res.json({
        currentStreak: streakRecord.currentStreak,
        maxStreak: streakRecord.maxStreak,
        totalActiveDays: streakRecord.totalActiveDays,
        freezeTokens: streakRecord.freezeTokens,
        hasCheckedInToday: true,
        history: streakRecord.history,
        activityCounts
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to record check-in." });
    }
  });

  app.post("/api/streak/freeze", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const streakRecord = await Streak.findOne({ userId });
      if (!streakRecord || (streakRecord.freezeTokens || 0) <= 0) {
        return res.status(400).json({ error: "No streak freeze tokens available." });
      }

      streakRecord.freezeTokens -= 1;
      await streakRecord.save();

      res.json({
        freezeTokens: streakRecord.freezeTokens,
        message: "Streak Freeze applied successfully!"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to use freeze token." });
    }
  });
  app.post("/api/subscribe", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }

      await Subscriber.updateOne(
        { email: email.toLowerCase().trim() },
        { email: email.toLowerCase().trim(), subscribedAt: new Date() },
        { upsert: true }
      );

      res.json({ success: true, message: "Thank you for subscribing to Daily Wisdom Notes!" });
    } catch (error) {
      console.error("Subscription Error:", error);
      res.status(500).json({ error: "Subscription failed. Please try again." });
    }
  });

  // Health Check Endpoint — enriched with live DB & uptime status
  app.get("/api/health", (req: Request, res: Response) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    res.json({
      status: "ok",
      app: "Noerax Sanctuary",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      worker: process.pid,
    });
  });

  // -------------------------------------------------------------
  // SERVE FRONTEND (Vite / Production Static)
  // -------------------------------------------------------------
  
  // =========================================================================
  // COMPANION DATABASE ANALYTICS & TIME TRACKING ENDPOINTS
  // =========================================================================

  // Update session duration heartbeat (called periodically or when closing chat)
  app.post("/api/companion/session/heartbeat", async (req: Request, res: Response) => {
    try {
      const { sessionId, activeDurationSeconds } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }
      const session = await CompanionChat.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const now = new Date();
      session.lastActiveTime = now;
      if (typeof activeDurationSeconds === 'number' && activeDurationSeconds > 0) {
        session.durationSeconds = Math.max(session.durationSeconds, Math.round(activeDurationSeconds));
      } else {
        session.durationSeconds = Math.max(
          session.durationSeconds,
          Math.round((now.getTime() - new Date(session.sessionStartTime).getTime()) / 1000)
        );
      }
      await session.save();

      res.json({
        success: true,
        sessionId: session.sessionId,
        durationSeconds: session.durationSeconds,
        durationFormatted: Math.round(session.durationSeconds / 60) + ' min',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update heartbeat" });
    }
  });

  // Get full companion analytics (total conversations, talk time, breakdown by character)
  app.get("/api/companion/analytics", async (req: Request, res: Response) => {
    try {
      const totalSessions = await CompanionChat.countDocuments();
      const allSessions = await CompanionChat.find().sort({ lastActiveTime: -1 }).limit(100).lean();

      // Aggregate total talk time in seconds
      let totalDurationSeconds = 0;
      let totalMessages = 0;
      const companionStats: Record<string, { count: number; totalSeconds: number; messages: number }> = {
        Ember: { count: 0, totalSeconds: 0, messages: 0 },
        Sage: { count: 0, totalSeconds: 0, messages: 0 },
        Luna: { count: 0, totalSeconds: 0, messages: 0 },
        Nova: { count: 0, totalSeconds: 0, messages: 0 },
      };

      for (const s of allSessions) {
        totalDurationSeconds += s.durationSeconds || 0;
        totalMessages += s.messagesCount || 0;
        const name = s.companionName || 'Other';
        if (!companionStats[name]) {
          companionStats[name] = { count: 0, totalSeconds: 0, messages: 0 };
        }
        companionStats[name].count += 1;
        companionStats[name].totalSeconds += s.durationSeconds || 0;
        companionStats[name].messages += s.messagesCount || 0;
      }

      res.json({
        success: true,
        totalSessions,
        totalTalkTimeSeconds: totalDurationSeconds,
        totalTalkTimeMinutes: Math.round((totalDurationSeconds / 60) * 10) / 10,
        totalMessages,
        companions: Object.entries(companionStats).map(([name, data]) => ({
          companionName: name,
          conversationsCount: data.count,
          totalDurationSeconds: data.totalSeconds,
          totalDurationMinutes: Math.round((data.totalSeconds / 60) * 10) / 10,
          messagesCount: data.messages,
        })),
        recentConversations: allSessions.slice(0, 15).map((s) => ({
          sessionId: s.sessionId,
          userName: s.userName || 'Guest',
          userEmail: s.userEmail || undefined,
          userId: s.userId || undefined,
          companionName: s.companionName,
          companionRole: s.companionRole,
          durationSeconds: s.durationSeconds,
          durationFormatted: Math.round(s.durationSeconds / 60) + ' min',
          messagesCount: s.messagesCount,
          startedAt: s.sessionStartTime,
          lastActiveAt: s.lastActiveTime,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch analytics" });
    }
  });

  // Get specific session chat history transcript
  app.get("/api/companion/history/:sessionId", async (req: Request, res: Response) => {
    try {
      const session = await CompanionChat.findOne({ sessionId: req.params.sessionId }).lean();
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch session history" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Cache static immutable assets (JS/CSS/images/fonts) for 1 year
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
    }));

    // Other static files (favicon, manifest, etc.)
    app.use(express.static(distPath, {
      maxAge: "1h",
      setHeaders: (res, path) => {
        if (path.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      }
    }));

    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  NOERAX SERVER — Worker ${process.pid}\n  ⚡ Running at http://localhost:${PORT}\n`);

    // Only Worker 1 runs keep-alive to avoid duplicate pings across workers
    if (!cluster.isWorker || cluster.worker?.id === 1) {
      const pingUrl = process.env.RENDER_EXTERNAL_URL
        ? `${process.env.RENDER_EXTERNAL_URL}/api/health`
        : `http://localhost:${PORT}/api/health`;

      const sendPing = () => {
        const protocol = pingUrl.startsWith('https') ? https : http;
        protocol.get(pingUrl, (res: any) => {
          console.log(`💓 [Keep-Alive] Ping OK — status: ${res.statusCode} — ${new Date().toLocaleTimeString()}`);
        }).on('error', (e: any) => {
          console.warn('⚠️ [Keep-Alive] Ping failed:', e.message);
        });
      };

      // Immediate startup ping — confirms server is live right after boot
      setTimeout(sendPing, 5000);

      // Recurring ping every 4 minutes (Render sleeps after 15min inactivity)
      setInterval(sendPing, 4 * 60 * 1000);

      console.log(`🕓 [Keep-Alive] Auto-ping active every 4 min → ${pingUrl}`);
    }
  });

  // Graceful shutdown on SIGTERM (Render sends this before stopping instances)
  const shutdown = () => {
    console.log(`\n⚠️  Worker ${process.pid} received shutdown signal. Closing gracefully...`);
    server.close(() => {
      mongoose.connection.close().then(() => {
        console.log(`✅  Worker ${process.pid} shut down cleanly.`);
        process.exit(0);
      });
    });
    // Force exit if graceful shutdown takes too long
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// =============================================================
// CLUSTER LOAD BALANCER
// Primary process is lightweight — it only manages workers.
// Workers independently connect to MongoDB and serve Express.
// On Render Free Tier (1 vCPU) this runs exactly 1 worker.
// =============================================================
const numCPUs = Math.min(os.cpus().length, 2); // Cap at 2 workers max on Render free tier

const isClusterEnabled = process.env.NODE_ENV === 'production';

if (cluster.isPrimary && isClusterEnabled) {
  console.log(`\n  🔄 NOERAX LOAD BALANCER — Spawning ${numCPUs} worker(s)`);

  // Track worker crash frequency to prevent restart loops
  const workerRestarts: Record<number, { count: number; lastRestart: number }> = {};

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`✅  Worker ${worker.process.pid} is online (id: ${worker.id})`);
  });

  // Exponential backoff respawn — prevents rapid restart loops that cause 502s
  cluster.on('exit', (worker, code, signal) => {
    const pid = worker.process.pid ?? 0;
    const now = Date.now();
    const restartInfo = workerRestarts[pid] || { count: 0, lastRestart: 0 };

    // Reset crash count if last crash was > 60s ago
    if (now - restartInfo.lastRestart > 60000) restartInfo.count = 0;
    restartInfo.count++;
    restartInfo.lastRestart = now;
    workerRestarts[pid] = restartInfo;

    const backoffMs = Math.min(1000 * Math.pow(2, restartInfo.count - 1), 30000); // max 30s
    console.warn(`⚠️  Worker ${pid} exited (code: ${code}). Restarting in ${backoffMs}ms (attempt #${restartInfo.count})...`);

    setTimeout(() => cluster.fork(), backoffMs);
  });

} else {
  // Worker: run the full Express + MongoDB server
  startServer().catch((err) => {
    console.error(`🔴 Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  });
}
