import { type User, type InsertUser, type ChatAnalysis, type InsertChatAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createChatAnalysis(analysis: InsertChatAnalysis): Promise<ChatAnalysis>;
  getChatAnalysis(id: string): Promise<ChatAnalysis | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatAnalyses: Map<string, ChatAnalysis>;

  constructor() {
    this.users = new Map();
    this.chatAnalyses = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createChatAnalysis(insertAnalysis: InsertChatAnalysis): Promise<ChatAnalysis> {
    const id = randomUUID();
    const analysis: ChatAnalysis = { 
      ...insertAnalysis, 
      id, 
      createdAt: new Date() 
    };
    this.chatAnalyses.set(id, analysis);
    return analysis;
  }

  async getChatAnalysis(id: string): Promise<ChatAnalysis | undefined> {
    return this.chatAnalyses.get(id);
  }
}

export const storage = new MemStorage();
