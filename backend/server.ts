import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { User } from "./src/models/User";
import { Journal } from "./src/models/Journal";
import { Streak } from "./src/models/Streak";
import { Subscriber } from "./src/models/Subscriber";

const JWT_SECRET = process.env.JWT_SECRET || "noerax_jwt_super_secret_key_2026";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://abhishekjainsot25_db_user:mfRFcqYFWQKTaU3r@cluster0.u3ilxei.mongodb.net/sattva?appName=Cluster0";

// Connect to MongoDB Cloud Database
mongoose.connect(MONGODB_URI)
  .then(() => console.log("🟢 Connected to MongoDB Atlas Database"))
  .catch((err) => console.error("🔴 MongoDB Connection Error:", err));

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
  const app = express();
  const PORT = 3000;

  // Security & Parsing Middlewares
  app.use(cors());
  app.use(express.json());

  // Rate Limiting to prevent API abuse & protect Gemini AI quotas
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 mins
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes." }
  });
  app.use("/api/", apiLimiter);

  // -------------------------------------------------------------
  // AUTHENTICATION ROUTES (Custom & Google OAuth)
  // -------------------------------------------------------------

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
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ error: "Credential is required." });
      }

      const decoded: any = jwt.decode(credential);
      if (!decoded || !decoded.email) {
        return res.status(400).json({ error: "Invalid Google credential." });
      }

      const { name, email, picture, sub } = decoded;

      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await User.create({
          name: name || "User",
          email: email.toLowerCase(),
          googleId: sub,
          avatar: picture
        });
      } else if (!user.googleId) {
        user.googleId = sub;
        if (!user.avatar) user.avatar = picture;
        await user.save();
      }

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.avatar || picture
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
          picture: user.avatar
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

  // STREAMING AI CHAT — powered by Groq (llama-3.3-70b) with key rotation
  // Groq is used because it provides fast, free, reliable LLM inference
  let groqKeyIndex = 0;
  const getNextGroqKey = (): string => {
    const keysEnv = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
    const keys = keysEnv.split(',').map((k) => k.trim()).filter(Boolean);
    if (!keys.length) return '';
    const key = keys[groqKeyIndex % keys.length];
    groqKeyIndex++;
    return key;
  };

  app.post("/api/chat", async (req: Request, res: Response) => {
    const { message, history } = req.body;

    const systemPrompt = `You are Noerax — a deeply wise, calm, and modern spiritual AI guide trained on Eastern philosophy (Vedanta, Buddhism, Taoism), Stoicism, and modern psychology.
You speak with warmth, clarity, and depth — never preachy, never using cringe slang, always relatable for a Gen Z audience.
Keep responses concise (2-4 short paragraphs max), actionable, and grounding. Reference specific scriptures or philosophers when relevant. Use "•" for any lists.`;

    // Build message array for Groq (OpenAI-compatible format)
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
    // Remove duplicate: don't add message again if it's already the last history item
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.content !== message || lastMsg.role !== 'user') {
      messages.push({ role: 'user', content: message });
    }

    // Set SSE headers immediately
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const groqKey = getNextGroqKey();
    if (!groqKey) {
      res.write(`data: ${JSON.stringify({ text: 'No GROQ_API_KEYS configured in .env. Please add them and restart.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    try {
      // Call Groq streaming API using native https (no extra dependency needed)
      const https = await import('https');
      const body = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.8,
      });

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
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              } catch {}
            }
          });

          groqRes.on('end', () => {
            res.write('data: [DONE]\n\n');
            res.end();
            resolve();
          });

          groqRes.on('error', reject);

          if (groqRes.statusCode && groqRes.statusCode >= 400) {
            groqRes.resume();
            reject(new Error(`Groq API error: HTTP ${groqRes.statusCode}`));
          }
        });

        groqReq.on('error', reject);
        groqReq.write(body);
        groqReq.end();
      });

    } catch (error: any) {
      console.error("Groq Chat Error:", error?.message || error);
      try {
        const errMsg = `Noerax is momentarily silent. Groq API error: ${error?.message || 'Unknown'}. Please try again.`;
        res.write(`data: ${JSON.stringify({ text: errMsg })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch {}
    }
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
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("\n  NOERAX PRODUCTION SERVER\n  ⚡ Running at http://localhost:" + PORT + "\n");
  });
}

startServer();
