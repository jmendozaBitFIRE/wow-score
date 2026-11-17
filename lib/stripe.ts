import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Los planes ya no están fijos en el código: viven en la tabla plan_prices y
// el admin los importa desde Stripe. plan_key es un identificador libre
// (p. ej. "wow_score_monthly"); por convención termina en _monthly o _annual.
export type StripePlan = string

// ¿La llave secreta configurada es de producción? Se usa para mostrar solo los
// precios del mismo modo (pruebas o producción) que la cuenta de Stripe activa.
export function isStripeLiveMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  return key.startsWith('sk_live_') || key.startsWith('rk_live_')
}
