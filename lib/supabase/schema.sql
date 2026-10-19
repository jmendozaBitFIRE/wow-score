-- ============================================================
-- 1. COMPANIES
-- ============================================================
CREATE TABLE companies (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  slug                 text        UNIQUE NOT NULL,
  max_members          int         NOT NULL DEFAULT 1,
  stripe_customer_id   text,
  subscription_status  text        CHECK (subscription_status IN ('active','inactive','trialing','past_due')) DEFAULT 'inactive',
  subscription_plan    text        CHECK (subscription_plan IN ('solo_monthly','solo_annual','team_monthly','team_annual')),
  trial_credits        int         NOT NULL DEFAULT 0,
  monthly_credits      int         NOT NULL DEFAULT 0,
  credits_reset_at     timestamptz,
  trial_used           boolean     NOT NULL DEFAULT false,
  trial_end            timestamptz,
  created_at           timestamptz DEFAULT now()
);

-- ============================================================
-- 2. PROFILES
-- ============================================================
CREATE TABLE profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name   text        NOT NULL,
  email       text        NOT NULL,
  role        text        CHECK (role IN ('owner','member')) DEFAULT 'owner',
  is_admin    boolean     NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 3. EVALUATIONS
-- ============================================================
CREATE TABLE evaluations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id    uuid        NOT NULL REFERENCES profiles(id),
  image_url     text        NOT NULL,
  medio         text        NOT NULL,
  objetivo      text        NOT NULL,
  provider      text        NOT NULL DEFAULT 'openai' CHECK (provider IN ('openai','claude')),
  score_overall int         CHECK (score_overall BETWEEN 0 AND 100),
  scores_detail jsonb,
  feedback_json jsonb,
  visibility    text        NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','team','company','public')),
  created_at    timestamptz DEFAULT now()
  -- shared_team_id se agrega más abajo, después de CREATE TABLE teams (referencia hacia adelante)
);

-- ============================================================
-- 4. EVALUATION RATINGS
-- ============================================================
CREATE TABLE evaluation_ratings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id  uuid        NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  company_id     uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES profiles(id),
  rating         int         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at     timestamptz DEFAULT now()
);

-- ============================================================
-- TEAMS (sub-grupos dentro de una compañía, ej. Marketing/Dev/Branding)
-- ============================================================
CREATE TABLE teams (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE TABLE team_members (
  team_id     uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  profile_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, profile_id)
);

-- Compartir un análisis con un equipo específico (visibility='team'). Si se
-- borra el equipo, se limpia la referencia en vez de dejarla colgada.
ALTER TABLE evaluations ADD COLUMN shared_team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- ============================================================
-- 5. PLAN PRICES
-- ============================================================
CREATE TABLE plan_prices (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key        text          UNIQUE NOT NULL,
  display_name    text          NOT NULL,
  price_amount    numeric(10,2) NOT NULL,
  currency        text          NOT NULL DEFAULT 'usd',
  stripe_price_id text          NOT NULL,
  max_members     int           NOT NULL,
  monthly_credits int           NOT NULL DEFAULT 10,
  trial_credits   int           NOT NULL DEFAULT 1,
  is_active       boolean       NOT NULL DEFAULT true,
  updated_at      timestamptz   DEFAULT now(),
  updated_by      uuid          REFERENCES profiles(id)
);

INSERT INTO plan_prices (plan_key, display_name, price_amount, currency, stripe_price_id, max_members, monthly_credits, trial_credits, is_active) VALUES
  ('solo_monthly', 'Solo Mensual', 0.00, 'usd', 'price_PLACEHOLDER', 1, 10, 1, true),
  ('solo_annual',  'Solo Anual',   0.00, 'usd', 'price_PLACEHOLDER', 1, 10, 1, true),
  ('team_monthly', 'Team Mensual', 0.00, 'usd', 'price_PLACEHOLDER', 5, 10, 1, true),
  ('team_annual',  'Team Anual',   0.00, 'usd', 'price_PLACEHOLDER', 5, 10, 1, true);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX ON profiles(company_id);
CREATE INDEX ON evaluations(company_id);
CREATE INDEX ON evaluations(profile_id);
CREATE INDEX ON evaluations(created_at DESC);
CREATE INDEX ON evaluations(visibility);
CREATE INDEX ON evaluation_ratings(evaluation_id);
CREATE INDEX ON evaluation_ratings(company_id);
CREATE INDEX ON teams(company_id);
CREATE INDEX ON team_members(profile_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_prices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members       ENABLE ROW LEVEL SECURITY;

-- Función para obtener el company_id sin causar ciclos infinitos (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- Función para saber si es admin sin causar ciclos infinitos
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT is_admin FROM profiles WHERE id = auth.uid();
$$;

-- companies: el usuario lee/actualiza solo su propia company
CREATE POLICY "company_select" ON companies
  FOR SELECT USING (id = get_my_company_id());

-- profiles: el usuario ve todos los miembros de su company
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (company_id = get_my_company_id());

-- evaluations: el usuario ve lo suyo, lo compartido con su equipo o company, o lo público
CREATE POLICY "evaluations_select" ON evaluations
  FOR SELECT USING (
    profile_id = auth.uid()
    OR (visibility = 'company' AND company_id = get_my_company_id())
    OR visibility = 'public'
    OR (visibility = 'team' AND shared_team_id IN (SELECT team_id FROM team_members WHERE profile_id = auth.uid()))
  );

-- evaluations: el usuario solo inserta en su propia company
CREATE POLICY "evaluations_insert" ON evaluations
  FOR INSERT WITH CHECK (company_id = get_my_company_id());

-- evaluation_ratings: el usuario ve solo las calificaciones de su company
CREATE POLICY "evaluation_ratings_select" ON evaluation_ratings
  FOR SELECT USING (company_id = get_my_company_id());

-- evaluation_ratings: el usuario solo inserta en su propia company
CREATE POLICY "evaluation_ratings_insert" ON evaluation_ratings
  FOR INSERT WITH CHECK (company_id = get_my_company_id());

-- teams/team_members: cualquiera de la compañía puede leer; las escrituras
-- pasan por Server Actions con el cliente admin (mismo patrón que profiles).
CREATE POLICY "teams_select" ON teams
  FOR SELECT USING (company_id = get_my_company_id());

CREATE POLICY "team_members_select" ON team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.company_id = get_my_company_id())
  );

-- plan_prices: cualquier usuario autenticado puede leer
CREATE POLICY "plan_prices_select" ON plan_prices
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- plan_prices: solo admins pueden escribir
CREATE POLICY "plan_prices_insert" ON plan_prices
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "plan_prices_update" ON plan_prices
  FOR UPDATE WITH CHECK (is_admin());

CREATE POLICY "plan_prices_delete" ON plan_prices
  FOR DELETE USING (is_admin());

-- admins policies
CREATE POLICY "company_select_admin" ON companies
  FOR SELECT USING (is_admin());

CREATE POLICY "company_update_admin" ON companies
  FOR UPDATE WITH CHECK (is_admin());

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE WITH CHECK (is_admin());

-- ============================================================
-- FUNCIÓN ADMIN (solo service_role)
-- ============================================================
CREATE OR REPLACE FUNCTION set_admin(target_user_id uuid, admin_value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET is_admin = admin_value WHERE id = target_user_id;
END;
$$;

-- ============================================================
-- MIGRACIÓN PARA BD EXISTENTE
-- Copia y pega esto en el SQL Editor si ya creaste las tablas antes:
-- ============================================================
-- ALTER TABLE companies ADD COLUMN trial_credits int NOT NULL DEFAULT 0;
-- ALTER TABLE companies ADD COLUMN monthly_credits int NOT NULL DEFAULT 0;
-- ALTER TABLE companies ADD COLUMN credits_reset_at timestamptz;
-- ALTER TABLE companies ADD COLUMN trial_used boolean NOT NULL DEFAULT false;
-- ALTER TABLE plan_prices ADD COLUMN monthly_credits int NOT NULL DEFAULT 10;
-- ALTER TABLE plan_prices ADD COLUMN trial_credits int NOT NULL DEFAULT 1;
-- ALTER TABLE companies ADD COLUMN trial_end timestamptz;
-- ALTER TABLE evaluations ADD COLUMN provider text NOT NULL DEFAULT 'openai' CHECK (provider IN ('openai','claude'));
-- CREATE TABLE evaluation_ratings (
--   id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
--   evaluation_id  uuid        NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
--   company_id     uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
--   user_id        uuid        NOT NULL REFERENCES profiles(id),
--   rating         int         NOT NULL CHECK (rating BETWEEN 1 AND 5),
--   created_at     timestamptz DEFAULT now()
-- );
-- CREATE INDEX ON evaluation_ratings(evaluation_id);
-- CREATE INDEX ON evaluation_ratings(company_id);
-- ALTER TABLE evaluation_ratings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "evaluation_ratings_select" ON evaluation_ratings
--   FOR SELECT USING (company_id = get_my_company_id());
-- CREATE POLICY "evaluation_ratings_insert" ON evaluation_ratings
--   FOR INSERT WITH CHECK (company_id = get_my_company_id());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Crear bucket privado para subir imágenes si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ad-images', 'ad-images', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Si tu bucket ya existía y estaba como público, corre esta línea en el SQL Editor
-- para asegurarte de que sea privado:
-- UPDATE storage.buckets SET public = false WHERE id = 'ad-images';
