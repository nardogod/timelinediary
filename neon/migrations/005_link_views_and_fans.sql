-- Link views: registra quando alguém clica em um link da timeline de outro usuário
-- Usado para: mostrar "visualizado" ao dono e ranking de fãs (Fan #1, #2, ...)
CREATE TABLE IF NOT EXISTS link_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  viewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, viewer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_link_views_event_id ON link_views(event_id);
CREATE INDEX IF NOT EXISTS idx_link_views_viewer_user_id ON link_views(viewer_user_id);
CREATE INDEX IF NOT EXISTS idx_link_views_viewed_at ON link_views(viewed_at);

COMMENT ON TABLE link_views IS 'Registro de cliques em links da timeline: quem visualizou qual evento (para selo visualizado e ranking de fãs)';
