import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Fix URL encoding for special characters in password
let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl.includes('[') && databaseUrl.includes(']')) {
  // Extract password and URL encode it
  const match = databaseUrl.match(/postgresql:\/\/([^:]+):(\[([^\]]+)\])@(.+)/);
  if (match) {
    const [, username, , password, rest] = match;
    const encodedPassword = encodeURIComponent(password);
    databaseUrl = `postgresql://${username}:${encodedPassword}@${rest}`;
  }
}

const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });