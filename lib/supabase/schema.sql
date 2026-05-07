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
  score_overall int         CHECK (score_overall BETWEEN 0 AND 100),
  scores_detail jsonb,
  feedback_json jsonb,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- 4. PLAN PRICES
-- ============================================================
CREATE TABLE plan_prices (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key        text          UNIQUE NOT NULL,
  display_name    text          NOT NULL,
  price_amount    numeric(10,2) NOT NULL,
  currency        text          NOT NULL DEFAULT 'usd',
  stripe_price_id text          NOT NULL,
  max_members     int           NOT NULL,
  is_active       boolean       NOT NULL DEFAULT true,
  updated_at      timestamptz   DEFAULT now(),
  updated_by      uuid          REFERENCES profiles(id)
);

INSERT INTO plan_prices (plan_key, display_name, price_amount, currency, stripe_price_id, max_members, is_active) VALUES
  ('solo_monthly', 'Solo Mensual', 0.00, 'usd', 'price_PLACEHOLDER', 1, true),
  ('solo_annual',  'Solo Anual',   0.00, 'usd', 'price_PLACEHOLDER', 1, true),
  ('team_monthly', 'Team Mensual', 0.00, 'usd', 'price_PLACEHOLDER', 5, true),
  ('team_annual',  'Team Anual',   0.00, 'usd', 'price_PLACEHOLDER', 5, true);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX ON profiles(company_id);
CREATE INDEX ON evaluations(company_id);
CREATE INDEX ON evaluations(profile_id);
CREATE INDEX ON evaluations(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE companies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_prices ENABLE ROW LEVEL SECURITY;

-- companies: el usuario lee/actualiza solo su propia company
CREATE POLICY "company_select" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- profiles: el usuario ve todos los miembros de su company
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- evaluations: el usuario ve todas las evaluaciones de su company
CREATE POLICY "evaluations_select" ON evaluations
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- evaluations: el usuario solo inserta en su propia company
CREATE POLICY "evaluations_insert" ON evaluations
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- plan_prices: cualquier usuario autenticado puede leer
CREATE POLICY "plan_prices_select" ON plan_prices
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- plan_prices: solo admins pueden escribir
CREATE POLICY "plan_prices_insert" ON plan_prices
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

CREATE POLICY "plan_prices_update" ON plan_prices
  FOR UPDATE WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

CREATE POLICY "plan_prices_delete" ON plan_prices
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- companies: admins pueden ver todas las companies
CREATE POLICY "company_select_admin" ON companies
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- companies: admins pueden actualizar cualquier company
CREATE POLICY "company_update_admin" ON companies
  FOR UPDATE WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- profiles: admins pueden ver todos los perfiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- profiles: admins pueden actualizar cualquier perfil
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- ============================================================
-- FUNCIÓN ADMIN (solo service_role)
-- ============================================================
CREATE OR REPLACE FUNCTION set_admin(target_user_id uuid, admin_value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET is_admin = admin_value WHERE id = target_user_id;
END;
$$;
