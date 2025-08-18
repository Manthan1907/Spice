import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chatAnalysis = pgTable("chat_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  extractedText: text("extracted_text").notNull(),
  tone: text("tone").notNull(),
  generatedReplies: jsonb("generated_replies").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatAnalysisSchema = createInsertSchema(chatAnalysis).pick({
  extractedText: true,
  tone: true,
  generatedReplies: true,
});

export const generateRepliesSchema = z.object({
  text: z.string().min(1, "Text is required"),
  tone: z.enum(["flirty", "funny", "respectful", "sarcastic"]).default("flirty"),
});

export const ocrSchema = z.object({
  image: z.string().min(1, "Base64 image is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChatAnalysis = z.infer<typeof insertChatAnalysisSchema>;
export type ChatAnalysis = typeof chatAnalysis.$inferSelect;
export type GenerateRepliesRequest = z.infer<typeof generateRepliesSchema>;
export type OCRRequest = z.infer<typeof ocrSchema>;
