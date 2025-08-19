import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  provider: text("provider").default("email"), // email, google, etc.
  providerId: text("provider_id"),
  emailVerified: timestamp("email_verified"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatAnalysis = pgTable("chat_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  extractedText: text("extracted_text").notNull(),
  tone: text("tone").notNull(),
  generatedReplies: jsonb("generated_replies").notNull(),
  imageData: text("image_data"), // Store base64 image data if needed
  createdAt: timestamp("created_at").defaultNow(),
});

export const pickupLines = pgTable("pickup_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  line: text("line").notNull(),
  category: text("category"),
  rating: text("rating"), // user feedback on the line
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  passwordHash: true,
  provider: true,
  providerId: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertChatAnalysisSchema = createInsertSchema(chatAnalysis).pick({
  userId: true,
  extractedText: true,
  tone: true,
  generatedReplies: true,
  imageData: true,
});

export const insertPickupLineSchema = createInsertSchema(pickupLines).pick({
  userId: true,
  line: true,
  category: true,
  rating: true,
});

export const insertSessionSchema = createInsertSchema(userSessions).pick({
  userId: true,
  sessionToken: true,
  expiresAt: true,
});

export const generateRepliesSchema = z.object({
  text: z.string().min(1, "Text is required"),
  tone: z.enum(["flirty", "funny", "respectful", "sarcastic"]).default("flirty"),
  bypassCache: z.boolean().optional().default(false)
});

export const ocrSchema = z.object({
  image: z.string().min(1, "Base64 image is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type InsertChatAnalysis = z.infer<typeof insertChatAnalysisSchema>;
export type ChatAnalysis = typeof chatAnalysis.$inferSelect;
export type InsertPickupLine = z.infer<typeof insertPickupLineSchema>;
export type PickupLine = typeof pickupLines.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type GenerateRepliesRequest = z.infer<typeof generateRepliesSchema>;
export type OCRRequest = z.infer<typeof ocrSchema>;
