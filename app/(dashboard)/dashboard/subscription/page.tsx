import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Calendar, CheckCircle2, AlertTriangle, ArrowLeft, Receipt, ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CancelButton } from './CancelButton'

export const metadata = { title: 'Gestión de Suscripción — WowScore' }

function formatStripeDate(timestamp: any): string {
  if (!timestamp) return 'No disponible'
  
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  
  const num = Number(timestamp)
  if (!isNaN(num) && num > 0) {
    const date = new Date(num > 9999999999 ? num : num * 1000)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  }
  
  const parsedDate = new Date(timestamp)
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  
  return 'No disponible'
}

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener perfil y company_id del usuario
  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Obtener datos de la empresa
  const { data: company } = await createAdminClient()
    .from('companies')
    .select('id, name, stripe_customer_id, subscription_status, subscription_plan, trial_credits, monthly_credits')
    .eq('id', profile.company_id)
    .single()

  if (!company) redirect('/dashboard')

  let stripeSubscription: any = null
  let paymentMethod: any = null
  let invoices: any[] = []
  let errorMsg: string | null = null

  if (company.stripe_customer_id) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: company.stripe_customer_id,
        limit: 1,
        status: 'all',
        expand: ['data.default_payment_method']
      })
      
      if (subscriptions.data.length > 0) {
        stripeSubscription = subscriptions.data[0]
        paymentMethod = stripeSubscription.default_payment_method
        
        if (!paymentMethod) {
          // Si no está adjunto a la suscripción directamente, buscar el predeterminado del cliente
          const customer = await stripe.customers.retrieve(company.stripe_customer_id, {
            expand: ['invoice_settings.default_payment_method']
          }) as any
          paymentMethod = customer.invoice_settings?.default_payment_method
        }
      }

      // Obtener el historial de facturas
      const stripeInvoices = await stripe.invoices.list({
        customer: company.stripe_customer_id,
        limit: 12
      })
      invoices = stripeInvoices.data
    } catch (err) {
      console.error('Error fetching Stripe data:', err)
      errorMsg = 'No se pudo sincronizar la información detallada desde Stripe en este momento.'
    }
  }

  const hasActiveSub = (company.subscription_status === 'active' || company.subscription_status === 'trialing') && stripeSubscription

  const cancelAtPeriodEnd = stripeSubscription?.cancel_at_period_end ?? stripeSubscription?.cancelAtPeriodEnd ?? false
  const periodEnd = stripeSubscription?.current_period_end ?? 
                    stripeSubscription?.currentPeriodEnd ?? 
                    stripeSubscription?.items?.data?.[0]?.current_period_end ??
                    stripeSubscription?.trial_end ?? 
                    stripeSubscription?.trialEnd ??
                    stripeSubscription?.period_end

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Volver */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Suscripción</h1>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/10 text-sm flex gap-2 items-center">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tarjeta de Resumen */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Información del Plan */}
        <div className="md:col-span-2 rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 p-6 space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Plan Actual</span>
                <h2 className="text-xl font-bold capitalize text-zinc-900 dark:text-white mt-1">
                  {company.subscription_plan ? company.subscription_plan.replace('_', ' ') : 'Plan Gratis / Inactivo'}
                </h2>
              </div>
              <div>
                {hasActiveSub && !cancelAtPeriodEnd ? (
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    Activa (Renovación automática)
                  </span>
                ) : hasActiveSub && cancelAtPeriodEnd ? (
                  <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-500/20">
                    <AlertTriangle size={12} />
                    Cancela próximamente
                  </span>
                ) : (
                  <span className="bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Inactiva
                  </span>
                )}
              </div>
            </div>

            {hasActiveSub ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      {company.subscription_status === 'trialing' ? 'Crédito de Prueba' : 'Créditos Disponibles'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {company.subscription_status === 'trialing' 
                        ? 'Analiza tu primer anuncio gratis' 
                        : 'Disponibles en este ciclo'}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {company.subscription_status === 'trialing' ? company.trial_credits : company.monthly_credits}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Calendar size={16} className="text-zinc-400" />
                  <span>
                    {cancelAtPeriodEnd
                      ? `Tu plan expira el ${formatStripeDate(periodEnd)}`
                      : `Siguiente cobro el ${formatStripeDate(periodEnd)}`
                    }
                  </span>
                </div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: stripeSubscription.currency || 'usd',
                    maximumFractionDigits: 0
                  }).format((stripeSubscription.plan?.amount || 0) / 100)}
                  <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                    {stripeSubscription.plan?.interval === 'month' ? ' / mes' : ' / año'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No tienes ninguna suscripción de pago activa para tu empresa ({company.name}). Puedes adquirir un plan para ampliar tus límites.
                </p>
                <div>
                  <Link
                    href="/dashboard/pricing"
                    className={cn(buttonVariants({ variant: 'default' }), 'bg-orange-600 hover:bg-orange-700 text-white rounded-full px-5')}
                  >
                    Ver planes disponibles
                  </Link>
                </div>
              </div>
            )}
          </div>

          {hasActiveSub && profile.role === 'owner' && !cancelAtPeriodEnd && (
            <div className="pt-4 border-t dark:border-zinc-800">
              <CancelButton />
            </div>
          )}
        </div>

        {/* Método de Pago */}
        <div className="rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 p-6 space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Método de Pago</span>
            {paymentMethod && paymentMethod.card ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold capitalize text-zinc-900 dark:text-white">
                      {paymentMethod.card.brand} •••• {paymentMethod.card.last4}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Expira {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay ningún método de pago guardado.
              </p>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Para cambiar de tarjeta o actualizar tus datos, puedes adquirir una nueva suscripción en la sección de planes.
          </div>
        </div>
      </div>

      {/* Historial de Facturas */}
      <div className="rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-zinc-400" />
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Historial de Facturas</h3>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b dark:border-zinc-800 text-zinc-400 text-xs uppercase">
                  <th className="py-3 font-semibold">Fecha</th>
                  <th className="py-3 font-semibold">Monto</th>
                  <th className="py-3 font-semibold">Estado</th>
                  <th className="py-3 font-semibold text-right">Factura</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                    <td className="py-3">
                      {new Date(invoice.created * 1000).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 font-medium">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: invoice.currency,
                        maximumFractionDigits: 2
                      }).format(invoice.amount_paid / 100)}
                    </td>
                    <td className="py-3">
                      {invoice.status === 'paid' ? (
                        <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
                          Pagado
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full font-semibold">
                          {invoice.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {invoice.hosted_invoice_url ? (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 underline font-medium"
                        >
                          Ver Recibo
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No tienes facturas anteriores registradas.
          </p>
        )}
      </div>

      {/* Botón Ver más planes y precios */}
      <div className="flex justify-center pt-4">
        <Link
          href="/dashboard/pricing"
          className={cn(buttonVariants({ variant: 'default' }), 'bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 py-2')}
        >
          Ver más planes y precios
        </Link>
      </div>
    </div>
  )
}
