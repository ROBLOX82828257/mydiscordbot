import { pool } from "./index.js";

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS guild_configs (
        guild_id            TEXT PRIMARY KEY,
        welcome_channel_id  TEXT,
        welcome_message     TEXT DEFAULT 'Welcome to the server, {user}!',
        welcome_banner_url  TEXT,
        log_channel_id      TEXT,
        auto_role_id        TEXT,
        bad_words_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
        bad_words_list      TEXT NOT NULL DEFAULT '[]',
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS bad_words_enabled BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS bad_words_list TEXT NOT NULL DEFAULT '[]';
    `);
  } finally {
    client.release();
  }
}
