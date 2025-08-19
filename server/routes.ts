import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRepliesSchema, ocrSchema, loginSchema, registerSchema } from "@shared/schema";
import { generateReplies, analyzeImageWithVision, generatePickupLines } from "./services/openai";
import { hashPassword, verifyPassword, createSession, authenticateMiddleware, optionalAuthMiddleware, type AuthenticatedRequest } from "./auth";
import { db } from "./db";
import { users, userSessions } from "../shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate replies from text
  app.post("/api/generate-replies", optionalAuthMiddleware as any, async (req: AuthenticatedRequest, res) => {
    try {
      const { text, tone, bypassCache } = generateRepliesSchema.parse(req.body);
      
      const response = await generateReplies(text, tone, bypassCache);
      
      // Store analysis if user is authenticated
      if (req.user) {
        await storage.createChatAnalysis({
          userId: req.user.id,
          extractedText: text,
          tone,
          generatedReplies: response.replies
        });
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error generating replies:", error);
      res.status(500).json({ 
        message: "Failed to generate replies", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // OCR and analyze image
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { image } = ocrSchema.parse(req.body);
      
      // Remove data URL prefix if present
      const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const extractedText = await analyzeImageWithVision(base64Image);
      
      if (!extractedText.trim()) {
        return res.status(400).json({ 
          message: "No text found in the image. Please ensure the image contains readable chat messages." 
        });
      }
      
      res.json({ 
        extractedText: extractedText.trim(),
        message: "Text extracted successfully" 
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ 
        message: "Failed to analyze image", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Generate pickup lines
  app.post("/api/pickup-lines", async (req, res) => {
    try {
      const response = await generatePickupLines();
      
      res.json(response);
    } catch (error) {
      console.error("Error generating pickup lines:", error);
      res.status(500).json({ 
        message: "Failed to generate pickup lines", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password } = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const newUser = await db
        .insert(users)
        .values({
          email,
          username,
          passwordHash,
          provider: "email",
        })
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
        });
      
      // Create session
      const sessionToken = await createSession(newUser[0].id);
      
      res.status(201).json({
        user: newUser[0],
        token: sessionToken,
        message: "User registered successfully",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        message: "Registration failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (!user[0] || !user[0].passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(password, user[0].passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create session
      const sessionToken = await createSession(user[0].id);
      
      res.json({
        user: {
          id: user[0].id,
          email: user[0].email,
          username: user[0].username,
        },
        token: sessionToken,
        message: "Login successful",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        message: "Login failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/auth/logout", authenticateMiddleware as any, async (req: AuthenticatedRequest, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (token) {
        // Delete session from database
        await db
          .delete(userSessions)
          .where(eq(userSessions.sessionToken, token));
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authenticateMiddleware as any, async (req: AuthenticatedRequest, res) => {
    try {
      res.json({ user: req.user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
