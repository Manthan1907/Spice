import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRepliesSchema, ocrSchema } from "@shared/schema";
import { generateReplies, analyzeImageWithVision, generatePickupLines } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate replies from text
  app.post("/api/generate-replies", async (req, res) => {
    try {
      const { text, tone } = generateRepliesSchema.parse(req.body);
      
      const response = await generateReplies(text, tone);
      
      // Store analysis in memory (privacy-first, no persistent storage)
      await storage.createChatAnalysis({
        extractedText: text,
        tone,
        generatedReplies: response.replies
      });
      
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

  const httpServer = createServer(app);
  return httpServer;
}
