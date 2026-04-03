-- VibePing Initial Schema Migration
-- Run against Supabase Postgres

-- ============================================================
-- 1. projects
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  api_key TEXT UNIQUE NOT NULL DEFAULT 'vp_' || replace(gen_random_uuid()::text, '-', ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_api_key ON public.projects(api_key);

-- ============================================================
-- 2. events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pageview', 'error', 'vital', 'custom', 'session', 'identify')),
  name TEXT,
  url TEXT,
  referrer TEXT,
  title TEXT,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  screen_width INT,
  screen_height INT,
  language TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_project_type_created ON public.events(project_id, type, created_at);
CREATE INDEX IF NOT EXISTS idx_events_project_created ON public.events(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON public.events(session_id);

-- ============================================================
-- 3. uptime_checks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.uptime_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  interval_seconds INT NOT NULL DEFAULT 300,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uptime_checks_project ON public.uptime_checks(project_id);

-- ============================================================
-- 4. uptime_pings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.uptime_pings (
  id BIGSERIAL PRIMARY KEY,
  check_id UUID NOT NULL REFERENCES public.uptime_checks(id) ON DELETE CASCADE,
  status_code INT,
  response_time_ms INT,
  is_up BOOLEAN NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uptime_pings_check_created ON public.uptime_pings(check_id, created_at);

-- ============================================================
-- 5. waitlist (create if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.waitlist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ---- projects: owner only ----
DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- ---- events: insert via service role (API validates api_key), select for project owner ----
DROP POLICY IF EXISTS "events_select_own" ON public.events;
CREATE POLICY "events_select_own" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = events.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Allow inserts from service role (bypasses RLS) and anon with valid project
-- The API route uses service role key so inserts bypass RLS automatically.
-- For extra safety, allow anon insert if project exists (SDK direct insert path):
DROP POLICY IF EXISTS "events_insert_anon" ON public.events;
CREATE POLICY "events_insert_anon" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = events.project_id
    )
  );

-- ---- uptime_checks: owner only ----
DROP POLICY IF EXISTS "uptime_checks_select_own" ON public.uptime_checks;
CREATE POLICY "uptime_checks_select_own" ON public.uptime_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = uptime_checks.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "uptime_checks_insert_own" ON public.uptime_checks;
CREATE POLICY "uptime_checks_insert_own" ON public.uptime_checks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = uptime_checks.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "uptime_checks_update_own" ON public.uptime_checks;
CREATE POLICY "uptime_checks_update_own" ON public.uptime_checks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = uptime_checks.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "uptime_checks_delete_own" ON public.uptime_checks;
CREATE POLICY "uptime_checks_delete_own" ON public.uptime_checks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = uptime_checks.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- ---- uptime_pings: select for project owner ----
DROP POLICY IF EXISTS "uptime_pings_select_own" ON public.uptime_pings;
CREATE POLICY "uptime_pings_select_own" ON public.uptime_pings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.uptime_checks
      JOIN public.projects ON projects.id = uptime_checks.project_id
      WHERE uptime_checks.id = uptime_pings.check_id
        AND projects.user_id = auth.uid()
    )
  );

-- Pings are inserted by backend/cron via service role (bypasses RLS)

-- ---- waitlist: allow anon insert, no select ----
DROP POLICY IF EXISTS "waitlist_insert_anon" ON public.waitlist;
CREATE POLICY "waitlist_insert_anon" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- Updated_at trigger for projects
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
