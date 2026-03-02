-- Users table (stores API keys)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  email_hash TEXT,
  nickname TEXT,
  organization TEXT,
  show_email BOOLEAN DEFAULT 0,
  show_nickname BOOLEAN DEFAULT 1,
  show_on_leaderboard BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage records table
CREATE TABLE IF NOT EXISTS usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  model TEXT NOT NULL,
  project TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cached_tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  bucket_start DATETIME NOT NULL,
  source TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_bucket
  ON usage_records(user_id, bucket_start);
