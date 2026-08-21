-- Roles (kept in a dedicated table to avoid privilege escalation)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Suggested corrections on catalogue places
CREATE TABLE public.place_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_place_id uuid NOT NULL REFERENCES public.catalog_places(id) ON DELETE CASCADE,
  field text NOT NULL CHECK (field IN ('name', 'description', 'category', 'area')),
  proposed_value text NOT NULL CHECK (length(btrim(proposed_value)) BETWEEN 2 AND 600),
  reason text CHECK (reason IS NULL OR length(reason) <= 600),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.place_suggestions TO authenticated;
GRANT ALL ON public.place_suggestions TO service_role;

ALTER TABLE public.place_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in travellers read suggestions"
  ON public.place_suggestions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Signed-in travellers propose corrections"
  ON public.place_suggestions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND status = 'pending');

-- Community confirmations
CREATE TABLE public.suggestion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES public.place_suggestions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  agree boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (suggestion_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.suggestion_votes TO authenticated;
GRANT ALL ON public.suggestion_votes TO service_role;

ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in travellers read votes"
  ON public.suggestion_votes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Travellers vote once, not on their own suggestion"
  ON public.suggestion_votes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.place_suggestions s
      WHERE s.id = suggestion_id AND s.created_by = auth.uid()
    )
  );

CREATE POLICY "Travellers withdraw their own vote"
  ON public.suggestion_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Applies an approved suggestion to the catalogue place
CREATE OR REPLACE FUNCTION public.apply_place_suggestion(_suggestion_id uuid, _reviewer uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.place_suggestions;
BEGIN
  SELECT * INTO s FROM public.place_suggestions WHERE id = _suggestion_id AND status = 'pending';
  IF s.id IS NULL THEN
    RAISE EXCEPTION 'Suggestion introuvable ou déjà traitée';
  END IF;

  IF s.field = 'name' THEN
    UPDATE public.catalog_places SET name = btrim(s.proposed_value) WHERE id = s.catalog_place_id;
  ELSIF s.field = 'description' THEN
    UPDATE public.catalog_places SET description = btrim(s.proposed_value) WHERE id = s.catalog_place_id;
  ELSIF s.field = 'category' THEN
    UPDATE public.catalog_places SET category = btrim(s.proposed_value) WHERE id = s.catalog_place_id;
  ELSIF s.field = 'area' THEN
    UPDATE public.catalog_places SET area = btrim(s.proposed_value) WHERE id = s.catalog_place_id;
  END IF;

  UPDATE public.place_suggestions
  SET status = 'approved', reviewed_by = _reviewer, reviewed_at = now(), updated_at = now()
  WHERE id = s.id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_place_suggestion(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Moderator / admin review
CREATE OR REPLACE FUNCTION public.review_place_suggestion(_suggestion_id uuid, _approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Seuls les modérateurs peuvent valider une correction';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.place_suggestions
    WHERE id = _suggestion_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Vous ne pouvez pas valider votre propre proposition';
  END IF;

  IF _approve THEN
    PERFORM public.apply_place_suggestion(_suggestion_id, auth.uid());
  ELSE
    UPDATE public.place_suggestions
    SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
    WHERE id = _suggestion_id AND status = 'pending';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_place_suggestion(uuid, boolean) TO authenticated;

-- Community consensus: 3 confirmations and no dispute applies the correction
CREATE OR REPLACE FUNCTION public.check_suggestion_consensus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agrees int;
  disagrees int;
BEGIN
  SELECT count(*) FILTER (WHERE agree), count(*) FILTER (WHERE NOT agree)
  INTO agrees, disagrees
  FROM public.suggestion_votes WHERE suggestion_id = NEW.suggestion_id;

  IF agrees >= 3 AND disagrees = 0 THEN
    PERFORM public.apply_place_suggestion(NEW.suggestion_id, NULL);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER suggestion_votes_consensus
AFTER INSERT ON public.suggestion_votes
FOR EACH ROW EXECUTE FUNCTION public.check_suggestion_consensus();