import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTodoSchema, insertNoteSchema, DashboardConfigSchema } from "@shared/schema";
import { getEmails, getTodayEvents, isOutlookConnected, getOutlookUserInfo, getEmailsForUser, getTodayEventsForUser, getOutlookUserInfoForUser } from "./outlook";
import { chatCompletion, summarizeEmails } from "./openai";
import { getAuthUrl, exchangeCodeForTokens, getMicrosoftUserInfo, isOAuthConfigured, createOAuthState, validateAndConsumeState } from "./oauth";

const cryptoCache: Map<string, { data: any; timestamp: number }> = new Map();
const weatherCache: Map<string, { data: any; timestamp: number }> = new Map();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // OAuth Configuration Status
  app.get("/api/auth/oauth-config", async (req, res) => {
    res.json({ configured: isOAuthConfigured() });
  });

  // Start OAuth flow
  app.get("/api/auth/outlook/login", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }
      
      if (!isOAuthConfigured()) {
        return res.status(503).json({ error: "OAuth not configured" });
      }
      
      const state = await createOAuthState(sessionId);
      const authUrl = getAuthUrl(state);
      res.json({ authUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to start OAuth" });
    }
  });

  // OAuth callback
  app.get("/api/auth/outlook/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      
      if (!code || !state) {
        return res.redirect("/settings?error=missing_params");
      }
      
      const sessionId = await validateAndConsumeState(state);
      if (!sessionId) {
        return res.redirect("/settings?error=invalid_state");
      }
      
      const tokens = await exchangeCodeForTokens(code);
      const userInfo = await getMicrosoftUserInfo(tokens.accessToken);
      
      await storage.upsertOAuthToken({
        sessionId,
        provider: "microsoft",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        email: userInfo.email,
        displayName: userInfo.displayName
      });
      
      res.redirect("/settings?success=connected");
    } catch (error: any) {
      console.error("[OAuth] Callback error:", error);
      res.redirect("/settings?error=auth_failed");
    }
  });

  // Disconnect user's Outlook
  app.post("/api/auth/outlook/disconnect", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }
      
      await storage.deleteOAuthToken(sessionId, "microsoft");
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to disconnect" });
    }
  });

  // Get user's OAuth status
  app.get("/api/auth/outlook/status/:sessionId", async (req, res) => {
    try {
      const token = await storage.getOAuthToken(req.params.sessionId, "microsoft");
      if (token) {
        res.json({
          connected: true,
          email: token.email,
          displayName: token.displayName
        });
      } else {
        res.json({ connected: false });
      }
    } catch (error) {
      res.json({ connected: false });
    }
  });
  
  // Outlook Integration Status (legacy - uses Replit connector)
  app.get("/api/outlook/status", async (req, res) => {
    try {
      const connected = await isOutlookConnected();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  // Get Outlook Emails
  app.get("/api/outlook/emails", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const emails = await getEmails(limit);
      res.json(emails);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch emails" });
    }
  });

  // Get Today's Calendar Events
  app.get("/api/outlook/events/today", async (req, res) => {
    try {
      const events = await getTodayEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch events" });
    }
  });

  // Debug: Get connected user info
  app.get("/api/outlook/user", async (req, res) => {
    try {
      const userInfo = await getOutlookUserInfo();
      res.json(userInfo);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch user info" });
    }
  });

  // AI Assistant Chat
  app.post("/api/assistant/chat", async (req, res) => {
    try {
      const { messages, includeContext } = req.body;
      
      let context = '';
      if (includeContext) {
        try {
          const [emails, events] = await Promise.all([
            getEmails(5),
            getTodayEvents()
          ]);
          context = `Recent emails: ${emails.map(e => `"${e.subject}" from ${e.sender}`).join(', ')}. Today's events: ${events.map(e => e.subject).join(', ')}.`;
        } catch (error) {
          // Context fetching failed, continue without it
        }
      }
      
      const response = await chatCompletion(messages, context);
      res.json({ message: response });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get AI response" });
    }
  });

  // Email Summary
  app.get("/api/assistant/email-summary", async (req, res) => {
    try {
      const emails = await getEmails(10);
      const summary = await summarizeEmails(emails);
      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
  });

  // Todos CRUD
  app.get("/api/todos", async (req, res) => {
    try {
      const todos = await storage.getTodos();
      res.json(todos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch todos" });
    }
  });

  app.post("/api/todos", async (req, res) => {
    try {
      const validatedData = insertTodoSchema.parse(req.body);
      const todo = await storage.createTodo(validatedData);
      res.status(201).json(todo);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid todo data" });
    }
  });

  app.patch("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { completed } = req.body;
      const todo = await storage.updateTodo(id, completed);
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      res.json(todo);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update todo" });
    }
  });

  app.delete("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTodo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete todo" });
    }
  });

  // Notes CRUD
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to fetch note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedData);
      res.status(201).json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid note data" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertNoteSchema.partial().parse(req.body);
      const note = await storage.updateNote(id, validatedData);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNote(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete note" });
    }
  });

  // Dashboard Layout
  app.get("/api/dashboard/layout/:sessionId", async (req, res) => {
    try {
      const config = await storage.getDashboardLayout(req.params.sessionId);
      res.json(config || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch layout" });
    }
  });

  app.put("/api/dashboard/layout/:sessionId", async (req, res) => {
    try {
      const config = DashboardConfigSchema.parse(req.body);
      await storage.saveDashboardLayout(req.params.sessionId, config);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid layout data" });
    }
  });

  // Crypto Prices (CoinGecko API - no key required)
  app.get("/api/crypto", async (req, res) => {
    try {
      const now = Date.now();
      const cacheKey = "all_crypto";
      const cached = cryptoCache.get(cacheKey);
      
      if (cached && now - cached.timestamp < 60000) {
        return res.json({ ...cached.data, cached: true });
      }
      
      const coins = "bitcoin,ethereum,solana,dogecoin,cardano,ripple";
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${coins}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`
      );
      if (!response.ok) throw new Error("CoinGecko API error");
      const data = await response.json();
      
      const result = {
        coins: data.map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.image,
          price: coin.current_price,
          priceUsd: null,
          change24h: coin.price_change_percentage_24h,
          change7d: coin.price_change_percentage_7d_in_currency,
          marketCap: coin.market_cap,
          volume: coin.total_volume,
          sparkline: coin.sparkline_in_7d?.price || [],
          high24h: coin.high_24h,
          low24h: coin.low_24h,
        })),
        timestamp: now
      };
      
      cryptoCache.set(cacheKey, { data: result, timestamp: now });
      res.json({ ...result, cached: false });
    } catch (error: any) {
      const cached = cryptoCache.get("all_crypto");
      if (cached) {
        return res.json({ ...cached.data, cached: true, stale: true });
      }
      res.status(500).json({ error: error.message || "Failed to fetch crypto prices" });
    }
  });

  // Bitcoin Price (legacy endpoint)
  app.get("/api/crypto/btc", async (req, res) => {
    try {
      const now = Date.now();
      const cached = cryptoCache.get("btc");
      if (cached && now - cached.timestamp < 60000) {
        return res.json({ price: cached.data.price, cached: true });
      }
      
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur");
      if (!response.ok) throw new Error("CoinGecko API error");
      const data = await response.json();
      
      cryptoCache.set("btc", { data: { price: data.bitcoin.eur, priceUsd: data.bitcoin.usd }, timestamp: now });
      
      res.json({ 
        price: data.bitcoin.eur, 
        priceUsd: data.bitcoin.usd,
        cached: false 
      });
    } catch (error: any) {
      const cached = cryptoCache.get("btc");
      if (cached) {
        return res.json({ price: cached.data.price, cached: true, stale: true });
      }
      res.status(500).json({ error: error.message || "Failed to fetch BTC price" });
    }
  });

  // Weather (OpenWeatherMap API)
  app.get("/api/weather", async (req, res) => {
    try {
      const city = (req.query.city as string) || "Berlin";
      const apiKey = process.env.OPENWEATHER_API_KEY;
      
      if (!apiKey) {
        return res.status(503).json({ error: "Weather API not configured", configured: false });
      }
      
      const cacheKey = city.toLowerCase();
      const cached = weatherCache.get(cacheKey);
      const now = Date.now();
      
      if (cached && now - cached.timestamp < 300000) {
        return res.json({ ...cached.data, cached: true });
      }
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=de`
      );
      
      if (!response.ok) throw new Error("Weather API error");
      const data = await response.json();
      
      const weather = {
        city: data.name,
        country: data.sys.country,
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        wind: data.wind.speed
      };
      
      weatherCache.set(cacheKey, { data: weather, timestamp: now });
      res.json({ ...weather, cached: false, configured: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch weather" });
    }
  });

  return httpServer;
}
