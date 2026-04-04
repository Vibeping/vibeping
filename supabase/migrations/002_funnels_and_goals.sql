-- VibePing Funnel Analysis & Goals Migration
-- Adds funnels and goals tables for the prompt-first funnel setup flow (ADR-006)

-- ============================================================
-- 1. funnels table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Steps stored as JSONB array: [{ label, match: { event, filters? }, timeout_seconds? }]
  steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnels_project ON public.funnels(project_id);

-- ============================================================
-- 2. goals table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Event matching criteria: { event: string, filters?: Record<string, string|number|boolean> }
  match JSONB NOT NULL,
  target_percent NUMERIC(5,2),
  -- Optional baseline event for conversion rate calculation
  baseline JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_project ON public.goals(project_id);

-- ============================================================
-- 3. Additional indexes on events for funnel queries
-- ============================================================
-- Funnel stats need to find events by session + time + name efficiently
CREATE INDEX IF NOT EXISTS idx_events_project_name_created
  ON public.events(project_id, name, created_at);

CREATE INDEX IF NOT EXISTS idx_events_session_created
  ON public.events(session_id, created_at);

-- ============================================================
-- 4. Updated_at triggers
-- ============================================================
DROP TRIGGER IF EXISTS trigger_funnels_updated_at ON public.funnels;
CREATE TRIGGER trigger_funnels_updated_at
  BEFORE UPDATE ON public.funnels
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_goals_updated_at ON public.goals;
CREATE TRIGGER trigger_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. Row Level Security
-- ============================================================
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Funnels: project owner CRUD
DROP POLICY IF EXISTS "funnels_select_own" ON public.funnels;
CREATE POLICY "funnels_select_own" ON public.funnels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = funnels.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "funnels_insert_own" ON public.funnels;
CREATE POLICY "funnels_insert_own" ON public.funnels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = funnels.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "funnels_update_own" ON public.funnels;
CREATE POLICY "funnels_update_own" ON public.funnels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = funnels.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "funnels_delete_own" ON public.funnels;
CREATE POLICY "funnels_delete_own" ON public.funnels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = funnels.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Goals: project owner CRUD
DROP POLICY IF EXISTS "goals_select_own" ON public.goals;
CREATE POLICY "goals_select_own" ON public.goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = goals.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "goals_insert_own" ON public.goals;
CREATE POLICY "goals_insert_own" ON public.goals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = goals.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "goals_update_own" ON public.goals;
CREATE POLICY "goals_update_own" ON public.goals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = goals.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "goals_delete_own" ON public.goals;
CREATE POLICY "goals_delete_own" ON public.goals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = goals.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. RPC: get_funnel_stats
-- ============================================================
-- Calculates funnel step-by-step conversion for a date range.
-- Uses session-based sequential matching: for each session that
-- triggered step 1, check if it also triggered step 2 (after step 1), etc.
--
-- Returns: JSON array of { step_index, label, count, conversion_from_previous, conversion_from_start }

CREATE OR REPLACE FUNCTION public.get_funnel_stats(
  p_funnel_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT now() - interval '30 days',
  p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_steps JSONB;
  v_step_count INT;
  v_result JSONB := '[]'::JSONB;
  v_prev_sessions TEXT[];
  v_curr_sessions TEXT[];
  v_prev_count INT;
  v_first_count INT;
  v_step JSONB;
  v_event_name TEXT;
  v_filters JSONB;
  i INT;
BEGIN
  -- Get funnel details
  SELECT project_id, steps INTO v_project_id, v_steps
  FROM public.funnels
  WHERE id = p_funnel_id;

  IF v_project_id IS NULL THEN
    RETURN '{"error": "Funnel not found"}'::JSONB;
  END IF;

  v_step_count := jsonb_array_length(v_steps);

  -- Process each step
  FOR i IN 0..(v_step_count - 1) LOOP
    v_step := v_steps->i;
    v_event_name := v_step->'match'->>'event';
    v_filters := v_step->'match'->'filters';

    IF i = 0 THEN
      -- First step: find all sessions with this event in the date range
      SELECT ARRAY_AGG(DISTINCT e.session_id)
      INTO v_curr_sessions
      FROM public.events e
      WHERE e.project_id = v_project_id
        AND e.type = 'custom'
        AND e.name = v_event_name
        AND e.created_at >= p_start_date
        AND e.created_at <= p_end_date
        AND e.session_id IS NOT NULL
        AND (v_filters IS NULL OR v_filters = '{}'::JSONB
             OR e.properties @> v_filters);

      v_curr_sessions := COALESCE(v_curr_sessions, ARRAY[]::TEXT[]);
      v_first_count := array_length(v_curr_sessions, 1);
      v_first_count := COALESCE(v_first_count, 0);

      v_result := v_result || jsonb_build_object(
        'step_index', i,
        'label', v_step->>'label',
        'count', v_first_count,
        'conversion_from_previous', 100.0,
        'conversion_from_start', 100.0
      );
    ELSE
      -- Subsequent steps: filter to sessions from previous step
      -- that also have this event AFTER their previous step event
      v_prev_sessions := v_curr_sessions;
      v_prev_count := COALESCE(array_length(v_prev_sessions, 1), 0);

      IF v_prev_count = 0 THEN
        v_curr_sessions := ARRAY[]::TEXT[];
      ELSE
        SELECT ARRAY_AGG(DISTINCT e.session_id)
        INTO v_curr_sessions
        FROM public.events e
        WHERE e.project_id = v_project_id
          AND e.type = 'custom'
          AND e.name = v_event_name
          AND e.created_at >= p_start_date
          AND e.created_at <= p_end_date
          AND e.session_id = ANY(v_prev_sessions)
          AND (v_filters IS NULL OR v_filters = '{}'::JSONB
               OR e.properties @> v_filters);

        v_curr_sessions := COALESCE(v_curr_sessions, ARRAY[]::TEXT[]);
      END IF;

      v_result := v_result || jsonb_build_object(
        'step_index', i,
        'label', v_step->>'label',
        'count', COALESCE(array_length(v_curr_sessions, 1), 0),
        'conversion_from_previous',
          CASE WHEN v_prev_count > 0
            THEN ROUND((COALESCE(array_length(v_curr_sessions, 1), 0)::NUMERIC / v_prev_count) * 100, 2)
            ELSE 0
          END,
        'conversion_from_start',
          CASE WHEN v_first_count > 0
            THEN ROUND((COALESCE(array_length(v_curr_sessions, 1), 0)::NUMERIC / v_first_count) * 100, 2)
            ELSE 0
          END
      );
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

-- ============================================================
-- 7. RPC: get_goal_stats
-- ============================================================
-- Calculates goal conversion rate for a date range.
-- If baseline is set, rate = goal_count / baseline_count.
-- If no baseline, rate = goal_count / unique_sessions.

CREATE OR REPLACE FUNCTION public.get_goal_stats(
  p_goal_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT now() - interval '30 days',
  p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_match JSONB;
  v_baseline JSONB;
  v_target NUMERIC;
  v_goal_count INT;
  v_baseline_count INT;
  v_conversion_rate NUMERIC;
BEGIN
  -- Get goal details
  SELECT project_id, match, baseline, target_percent
  INTO v_project_id, v_match, v_baseline, v_target
  FROM public.goals
  WHERE id = p_goal_id;

  IF v_project_id IS NULL THEN
    RETURN '{"error": "Goal not found"}'::JSONB;
  END IF;

  -- Count goal events
  SELECT COUNT(DISTINCT session_id)
  INTO v_goal_count
  FROM public.events
  WHERE project_id = v_project_id
    AND type = 'custom'
    AND name = v_match->>'event'
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND session_id IS NOT NULL
    AND (v_match->'filters' IS NULL OR v_match->'filters' = '{}'::JSONB
         OR properties @> (v_match->'filters'));

  -- Count baseline
  IF v_baseline IS NOT NULL AND v_baseline->>'event' IS NOT NULL THEN
    -- Custom baseline event
    SELECT COUNT(DISTINCT session_id)
    INTO v_baseline_count
    FROM public.events
    WHERE project_id = v_project_id
      AND type = 'custom'
      AND name = v_baseline->>'event'
      AND created_at >= p_start_date
      AND created_at <= p_end_date
      AND session_id IS NOT NULL
      AND (v_baseline->'filters' IS NULL OR v_baseline->'filters' = '{}'::JSONB
           OR properties @> (v_baseline->'filters'));
  ELSE
    -- Default baseline: unique sessions
    SELECT COUNT(DISTINCT session_id)
    INTO v_baseline_count
    FROM public.events
    WHERE project_id = v_project_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
      AND session_id IS NOT NULL;
  END IF;

  -- Calculate conversion rate
  IF v_baseline_count > 0 THEN
    v_conversion_rate := ROUND((v_goal_count::NUMERIC / v_baseline_count) * 100, 2);
  ELSE
    v_conversion_rate := 0;
  END IF;

  RETURN jsonb_build_object(
    'goal_id', p_goal_id,
    'conversions', v_goal_count,
    'baseline_count', v_baseline_count,
    'conversion_rate', v_conversion_rate,
    'target_percent', v_target,
    'target_met', CASE
      WHEN v_target IS NOT NULL THEN v_conversion_rate >= v_target
      ELSE NULL
    END
  );
END;
$$;
