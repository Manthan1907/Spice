import { type User, type InsertUser, type ChatAnalysis, type InsertChatAnalysis, type PickupLine, type InsertPickupLine } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createChatAnalysis(analysis: InsertChatAnalysis): Promise<ChatAnalysis>;
  getChatAnalysis(id: string): Promise<ChatAnalysis | undefined>;
  createPickupLine(pickupLine: InsertPickupLine): Promise<PickupLine>;
  getUserPickupLines(userId: string): Promise<PickupLine[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatAnalyses: Map<string, ChatAnalysis>;
  private pickupLines: Map<string, PickupLine>;

  constructor() {
    this.users = new Map();
    this.chatAnalyses = new Map();
    this.pickupLines = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      email: insertUser.email,
      username: insertUser.username ?? null,
      passwordHash: insertUser.passwordHash ?? null,
      provider: insertUser.provider ?? null,
      providerId: insertUser.providerId ?? null,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createChatAnalysis(insertAnalysis: InsertChatAnalysis): Promise<ChatAnalysis> {
    const id = randomUUID();
    const analysis: ChatAnalysis = { 
      id,
      userId: insertAnalysis.userId,
      extractedText: insertAnalysis.extractedText,
      tone: insertAnalysis.tone,
      generatedReplies: insertAnalysis.generatedReplies,
      imageData: insertAnalysis.imageData ?? null,
      createdAt: new Date() 
    };
    this.chatAnalyses.set(id, analysis);
    return analysis;
  }

  async getChatAnalysis(id: string): Promise<ChatAnalysis | undefined> {
    return this.chatAnalyses.get(id);
  }

  async createPickupLine(insertPickupLine: InsertPickupLine): Promise<PickupLine> {
    const id = randomUUID();
    const pickupLine: PickupLine = { 
      id,
      userId: insertPickupLine.userId ?? null,
      line: insertPickupLine.line,
      category: insertPickupLine.category ?? null,
      rating: insertPickupLine.rating ?? null,
      createdAt: new Date() 
    };
    this.pickupLines.set(id, pickupLine);
    return pickupLine;
  }

  async getUserPickupLines(userId: string): Promise<PickupLine[]> {
    return Array.from(this.pickupLines.values()).filter(
      (line) => line.userId === userId,
    );
  }
}

export const storage = new MemStorage();
