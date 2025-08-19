import { db } from './db';
import { sql } from 'drizzle-orm';

async function setupDatabase() {
  try {
    console.log('Creating database tables...');
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" text NOT NULL,
        "username" text,
        "password_hash" text,
        "provider" text DEFAULT 'email',
        "provider_id" text,
        "email_verified" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_email_unique" UNIQUE("email"),
        CONSTRAINT "users_username_unique" UNIQUE("username")
      )
    `);

    // Create user_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar NOT NULL,
        "session_token" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
      )
    `);

    // Create chat_analysis table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "chat_analysis" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar NOT NULL,
        "extracted_text" text NOT NULL,
        "tone" text NOT NULL,
        "generated_replies" jsonb NOT NULL,
        "image_data" text,
        "created_at" timestamp DEFAULT now()
      )
    `);

    // Create pickup_lines table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pickup_lines" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar,
        "line" text NOT NULL,
        "category" text,
        "rating" text,
        "created_at" timestamp DEFAULT now()
      )
    `);

    // Add foreign key constraints
    await db.execute(sql`
      ALTER TABLE "chat_analysis" 
      ADD CONSTRAINT "chat_analysis_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE no action ON UPDATE no action
    `);

    await db.execute(sql`
      ALTER TABLE "pickup_lines" 
      ADD CONSTRAINT "pickup_lines_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE no action ON UPDATE no action
    `);

    await db.execute(sql`
      ALTER TABLE "user_sessions" 
      ADD CONSTRAINT "user_sessions_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE no action ON UPDATE no action
    `);

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => {
      console.log('Setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupDatabase };