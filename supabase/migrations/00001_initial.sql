CREATE TABLE IF NOT EXISTS public.profiles (
  user_id text PRIMARY KEY,
  points int4 NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'Novice',
  level_index int4 NOT NULL DEFAULT 0,
  streak int4 NOT NULL DEFAULT 0,
  last_session_date text,
  badges text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pairing_history (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  track_or_playlist text NOT NULL,
  drink_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_points_desc ON public.profiles (points DESC);
CREATE INDEX IF NOT EXISTS idx_pairing_history_user_created_at_desc ON public.pairing_history (user_id, created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairing_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_anon'
  ) THEN
    CREATE POLICY profiles_select_anon ON public.profiles
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_insert_anon'
  ) THEN
    CREATE POLICY profiles_insert_anon ON public.profiles
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_anon'
  ) THEN
    CREATE POLICY profiles_update_anon ON public.profiles
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pairing_history' AND policyname = 'pairing_history_select_anon'
  ) THEN
    CREATE POLICY pairing_history_select_anon ON public.pairing_history
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pairing_history' AND policyname = 'pairing_history_insert_anon'
  ) THEN
    CREATE POLICY pairing_history_insert_anon ON public.pairing_history
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;
