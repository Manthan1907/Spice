import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users, userSessions } from '../shared/schema';
import { eq, and, gt } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username?: string;
  };
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateToken(userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await db.insert(userSessions).values({
    userId,
    sessionToken,
    expiresAt,
  });
  
  return sessionToken;
}

export async function validateSession(sessionToken: string): Promise<string | null> {
  try {
    const session = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.sessionToken, sessionToken),
          gt(userSessions.expiresAt, new Date())
        )
      )
      .limit(1);
    
    return session[0]?.userId || null;
  } catch {
    return null;
  }
}

export async function authenticateMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const userId = await validateSession(token);
    if (!userId) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user[0]) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
}

export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (token) {
      const userId = await validateSession(token);
      if (userId) {
        const user = await db
          .select({
            id: users.id,
            email: users.email,
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (user[0]) {
          req.user = user[0];
        }
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}