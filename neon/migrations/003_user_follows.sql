-- Seguidores: quem segue quem (persistido no banco para não perder ao fechar o app)
CREATE TABLE IF NOT EXISTS user_follows (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, target_user_id),
  CHECK (user_id != target_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_target ON user_follows(target_user_id);
