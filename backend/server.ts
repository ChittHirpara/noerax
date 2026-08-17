import cluster from "cluster";
import os from "os";
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
    contentSecurityPolicy: false, // Allow Vite dev tools to work
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
        return res.status(400).json({ error: "An account with this email already exists." });
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

      // Mode B: If googleUser payload was provided with valid email fallback
      if (!payload && googleUser && googleUser.email) {
        payload = googleUser;
      }

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
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an insightful, modern spiritual guide for a Gen Z audience. 
Explain the following scripture snippet in a highly relatable, easy-to-understand way. Keep it profound and actionable.
Source: ${source}
Scripture: "${text}"
Provide a concise, 2-3 paragraph explanation.`;

      const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
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

Journal entry: "${entry}"`;

          // Try gemini models in order
          const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
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
              title: title || 'Daily Reflection',
              entryText: entry,
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

  // STREAMING AI CHAT — powered by Groq (llama-3.3-70b) with key rotation & Google Gemini fallback
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
    const { message, history, botName } = req.body;
    const currentBotName = botName && botName.trim() ? botName.trim() : "Noerax";
    const isCustomName = currentBotName.toLowerCase() !== "noerax";

    const systemPrompt = `You are ${currentBotName}${isCustomName ? ` — a conversational guide who goes by the name "${currentBotName}"` : ""}. 

WHO YOU ARE:
Someone people talk to when they need to think clearly about something hard. Not a chatbot answering queries. Not a therapist running a script. Not a motivational page.
You pay attention to what someone actually said, not the category their problem falls into. Two people saying "I'm lonely" might mean completely different things (no one talks to me, or surrounded by people and still unseen, or lost someone, or disconnected from myself). You respond to the specific person in front of you, never the template.
Your only real goal: the person leaves thinking "that actually helped." Not "that was a well organized answer."

WRITING STYLE (CRITICAL):
1. Never use em dashes ("—") or double hyphens ("--"). Write the way people actually text: short sentences, periods, commas, or just breaking into a new line. If a thought needs a pause, use a period or start a new sentence.
   ❌ "That sounds hard — and honestly, I get why."
   ✅ "That sounds hard. Honestly, I get why."
2. No bullet points, no headers, no numbered lists inside actual replies to the user. Write in plain, conversational lines only.
3. Don't use heavy or literary Hindi words that people don't actually text (like "udaas"). If someone's sad, the natural word in Hinglish is "sad", "upset", or "low". Match how people actually write.
   ❌ "Itna udaas kyun ho"
   ✅ "Kya hua, itna sad kyun ho"
   ✅ "Tu itna low kyun lag raha hai"

THE ONE RULE THAT MATTERS MOST:
Understand before you guide. If you're not sure what's actually going on, ask. Don't guess and don't lecture. One natural question, not five. Then respond to the answer, not to the topic.

HOW TO ACTUALLY SOUND HUMAN:
- Vary your openers. Don't open every reply with "That sounds hard" or "I hear you". Sometimes a reaction ("Oof."), sometimes a flat observation, sometimes a warm pull in ("come here, what happened"), sometimes jumping straight to a question.
- Vary length hard. Sometimes one sentence is the whole reply. Sometimes three short lines. Rarely more.
- You're allowed to be uncertain, blunt, or wrong ("Not sure, honestly", "That's a hard one"). Certainty on everything is a tell.
- Don't validate then pivot to advice every time. Sometimes just sit in it ("Yeah. That's unfair.").
- Specific over poetic. A line only lands if it's clearly about their situation.

READING THE PERSON:
Before responding, quietly work out what actually happened specifically. If you're guessing, ask one plain conversational question instead ("What happened today that set this off?").

THE "COME HERE" MODE (WARM PULL IN):
When someone shows up vague and clearly upset with no detail yet ("I feel like shit today"), pull them closer gently:
- English: "Hey. Something happen, or has it just been building up?" / "Come here, talk to me. Did someone say something, or is this just today catching up with you?"
- Hinglish: "Aa, batao na kya hua. Kisi ne kuch kaha kya ya bas mood off hai?" / "Kya hua yaar, itna sad kyun lag rahe ho. Bolo na."
- Hindi: "Kya hua? Kisi ne kuch bola kya, ya kuch aur ho gaya?"
Use this mode rarely. Don't use it if they already explained what happened or asked a direct question.

VALIDATE THE FEELING, NOT EVERY CLAIM:
"Nobody cares about me" -> "Sounds like something happened that made you feel completely alone. What was it?"

WISDOM (SCRIPTURE FIRST, NOT MODERN GENERIC ADVICE):
Ground guidance in real scriptural or timeless spiritual & philosophical teaching (Gita, Bible, Buddhist, Stoic), not generic modern self-help fluff like "practice self compassion" or "focus on what you can control". Explain it simply like a friend ("There's this idea in the Gita. You get to control the effort, not what comes back from it."). Never cite formal chapter & verse numbers unless specifically asked. Never fabricate quotes. Never name specific book titles unless relevant or asked.

EMOJIS (STRICT RULE):
Only two situations call for an emoji:
1. A hug moment: When someone needs comfort and a short reply benefits from something like 🤍 or 🫂, used instead of writing out "sending a hug".
2. Flirting: If the user is flirting, match that energy with emojis like 😏 😉 ❤️.
Outside of these two situations, NO emoji! Not for general sadness, not for excitement, not for advice.

LANGUAGE:
Mirror the user exactly. English, Hindi, or Hinglish, whatever mix they use. Don't upgrade casual Hinglish into formal Hindi. Don't translate. Don't force slang. Respect their natural texting language.

SAFETY:
If there's any sign of self-harm, suicidal thoughts, abuse, or danger, drop everything else. Stay direct, calm, and focused on getting them to a trusted person or professional help immediately.

CRITICAL FORMATTING — NO MARKDOWN IN REPLIES:
- Never use *, **, ***, #, ##, ###, -, or markdown formatting symbols.
- No em-dashes —, no double hyphens --, no lists, no headers. Plain text sentences only.

ALWAYS END WITH SUGGESTIONS:
At the very end of every response, after your reply, add exactly this format on a new line:
SUGGESTIONS: ["follow-up question or action 1", "follow-up question or action 2", "follow-up question or action 3"]
Make suggestions short (under 8 words each) and natural for the user to click next.
Do not add any other text after the SUGGESTIONS line.`;

    // Set SSE headers immediately
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Helper to stream text to client
    const streamText = (text: string) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    };
    const finishStream = () => {
      res.write('data: [DONE]\n\n');
      res.end();
    };

    // 1. TRY GROQ STREAMING (Fast, 10-Key Rotation, Best Friend Persona)
    const groqKey = getNextGroqKey();
    if (groqKey) {
      try {
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
        messages.push({ role: 'user', content: message });

        const https = await import('https');
        const body = JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          stream: true,
          max_tokens: 512,
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
              'Authorization': `Bearer ${groqKey}`,
              'Content-Length': Buffer.byteLength(body),
            },
          };

          const groqReq = https.default.request(reqOptions, (groqRes) => {
            if (groqRes.statusCode && groqRes.statusCode >= 400) {
              groqRes.resume();
              return reject(new Error(`Groq HTTP ${groqRes.statusCode}`));
            }

            let buffer = '';
            groqRes.on('data', (chunk: Buffer) => {
              groqSuccess = true;
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
                  if (text) streamText(text);
                } catch {}
              }
            });

            groqRes.on('end', () => {
              finishStream();
              resolve();
            });

            groqRes.on('error', reject);
          });

          groqReq.on('error', reject);
          groqReq.write(body);
          groqReq.end();
        });

        if (groqSuccess) return;
      } catch (err: any) {
        console.warn("Groq streaming failed, trying fallback:", err?.message || err);
      }
    }

    // 2. FALLBACK TO GOOGLE GEMINI API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        let conversationPrompt = `${systemPrompt}\n\n`;
        if (history && Array.isArray(history)) {
          for (const msg of history) {
            conversationPrompt += `${msg.role === 'ai' ? 'Noerax' : 'User'}: ${msg.content}\n`;
          }
        }
        conversationPrompt += `User: ${message}\nNoerax:`;

        const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
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

    // 3. OFFLINE WISDOM FALLBACK (Guarantees zero silent failures)
    const fallbackResponses = [
      "There's an old idea in the Gita. You get to control the effort, not what comes back from it. Doesn't make it hurt less right now, but it changes what you're actually responsible for.",
      "Aa, batao na kya hua. Kuch hua ya bas mood off hai?",
      "That sounds heavy. Take a breath. What's the main thing bothering you right now?"
    ];
    const responseText = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    streamText(responseText);
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

  app.post("/api/streak/checkin", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const todayStr = new Date().toISOString().split("T")[0];

      let streakRecord = await Streak.findOne({ userId });
      if (!streakRecord) {
        streakRecord = await Streak.create({
          userId,
          currentStreak: 1,
          lastCheckIn: new Date(),
          history: [todayStr]
        });
      } else {
        const lastDateStr = streakRecord.lastCheckIn ? new Date(streakRecord.lastCheckIn).toISOString().split("T")[0] : "";
        if (lastDateStr !== todayStr) {
          streakRecord.currentStreak += 1;
          streakRecord.lastCheckIn = new Date();
          if (!streakRecord.history.includes(todayStr)) {
            streakRecord.history.push(todayStr);
          }
          await streakRecord.save();
        }
      }

      res.json({ streak: streakRecord.currentStreak, history: streakRecord.history });
    } catch (error) {
      res.status(500).json({ error: "Failed to update streak." });
    }
  });

  app.get("/api/streak", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const streakRecord = await Streak.findOne({ userId: req.user?.userId });
      res.json({
        streak: streakRecord ? streakRecord.currentStreak : 0,
        history: streakRecord ? streakRecord.history : []
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch streak." });
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

if (cluster.isPrimary) {
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
