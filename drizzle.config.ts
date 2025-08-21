import "dotenv/config";
import { defineConfig } from "drizzle-kit";

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Handle bracketed passwords with special characters like #, @, etc.
// Convert: postgresql://postgres:[pass#word]@host:5432/db?sslmode=require
// To: postgresql://postgres:pass%23word@host:5432/db?sslmode=require
const bracketMatch = databaseUrl.match(/postgresql:\/\/([^:]+):\[([^\]]+)\]@(.+)/);
if (bracketMatch) {
  const [, username, rawPassword, rest] = bracketMatch;
  const encodedPassword = encodeURIComponent(rawPassword);
  databaseUrl = `postgresql://${username}:${encodedPassword}@${rest}`;
}

// Ensure sslmode=require is present for Supabase
if (!/sslmode=/.test(databaseUrl)) {
  databaseUrl += databaseUrl.includes("?") ? "&sslmode=require" : "?sslmode=require";
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
