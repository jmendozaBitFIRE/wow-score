-- ============================================================
-- Plan único individual (2026-11-17)
-- Correr una vez en Supabase → SQL Editor. Es seguro correrlo dos veces.
-- ============================================================

-- 1. subscription_plan ya no es una lista fija: guarda el plan_key de
--    cualquier plan importado desde Stripe en el admin.
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_subscription_plan_check;

-- 2. plan_prices: modo de Stripe (pruebas/producción) e intervalo de cobro.
ALTER TABLE plan_prices ADD COLUMN IF NOT EXISTS livemode boolean NOT NULL DEFAULT false;
ALTER TABLE plan_prices ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'month';
UPDATE plan_prices SET billing_interval = 'year' WHERE plan_key LIKE '%annual%';

-- 3. Ocultar los 4 planes anteriores (Solo/Team, mensual/anual).
UPDATE plan_prices SET is_active = false, updated_at = now()
WHERE plan_key IN ('solo_monthly', 'solo_annual', 'team_monthly', 'team_annual');

-- 4. Registrar el plan único: 8 USD al mes, 100 evaluaciones, 1 de prueba.
--    (Precio de Stripe en modo de pruebas.) El monto se vuelve a leer de Stripe.
INSERT INTO plan_prices (plan_key, display_name, price_amount, currency, stripe_price_id,
                         max_members, monthly_credits, trial_credits, is_active, livemode, billing_interval)
VALUES ('wow_score_monthly', 'WOW Score', 8.00, 'usd', 'price_1UalWURz5X2GKnPhzGgxKY8U',
        1, 100, 1, true, false, 'month')
ON CONFLICT (plan_key) DO UPDATE SET
  stripe_price_id  = EXCLUDED.stripe_price_id,
  monthly_credits  = EXCLUDED.monthly_credits,
  trial_credits    = EXCLUDED.trial_credits,
  is_active        = true,
  livemode         = EXCLUDED.livemode,
  billing_interval = EXCLUDED.billing_interval,
  updated_at       = now();

-- 5. Sin equipos por ahora: lo compartido con Equipo o Compañía pasa a Privado.
--    (Lo Público se queda igual.)
UPDATE evaluations
SET visibility = 'private', shared_team_id = NULL
WHERE visibility IN ('team', 'company');
