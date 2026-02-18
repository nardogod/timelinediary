-- Estado da conversa do bot (fluxo passo a passo por usuário)
-- step: confirm_name | ask_date | ask_has_end | ask_end_date | ask_level
-- payload: { "title": "...", "date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD" (opcional) }
CREATE TABLE IF NOT EXISTS telegram_bot_state (
  telegram_id BIGINT PRIMARY KEY,
  step TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telegram_bot_state_updated ON telegram_bot_state(updated_at);
