-- Add token_profiles table for token usage profiles
CREATE TABLE IF NOT EXISTS token_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  profile_id TEXT UNIQUE NOT NULL,
  version INTEGER DEFAULT 1,
  data TEXT NOT NULL,
  is_public BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_token_profiles_user
  ON token_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_token_profiles_public
  ON token_profiles(is_public, updated_at);
