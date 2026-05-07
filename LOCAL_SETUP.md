# Local Setup — WowScore

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.x (probado con 24.13) |
| npm | 9.x (probado con 11.6) |
| Cuenta Supabase | Plan gratuito funciona |
| Cuenta Stripe | Modo test |
| API Key OpenAI | GPT-4o habilitado |

---

## 1. Clonar y instalar dependencias

```bash
git clone <repo-url>
cd wow-score
npm install
```

`npm install` no produce errores. Hay 2 vulnerabilidades de severidad moderada
en dependencias indirectas; no afectan el funcionamiento en desarrollo.

---

## 2. Variables de entorno

Copia el archivo de ejemplo y rellena cada valor:

```bash
cp .env.local.example .env.local
```

### Variables requeridas

| Variable | Dónde obtenerla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role |
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret |
| `STRIPE_WEBHOOK_SECRET` | Ver sección Stripe Webhook más abajo |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Publishable |
| `STRIPE_PRICE_SOLO_MONTHLY` | Stripe Dashboard → Products → precio mensual Solo |
| `STRIPE_PRICE_SOLO_ANNUAL` | Stripe Dashboard → Products → precio anual Solo |
| `STRIPE_PRICE_TEAM_MONTHLY` | Stripe Dashboard → Products → precio mensual Team |
| `STRIPE_PRICE_TEAM_ANNUAL` | Stripe Dashboard → Products → precio anual Team |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` en desarrollo |

> **Nota:** `NEXT_PUBLIC_APP_URL` no está en el `.env.local` original pero es
> necesaria para los redirects de Stripe Checkout y el Customer Portal.
> El código usa `http://localhost:3000` como fallback, pero es preferible
> declararla explícitamente.

---

## 3. Base de datos Supabase

### 3.1 Crear las tablas

En Supabase → SQL Editor, ejecuta el contenido completo de:

```
lib/supabase/schema.sql
```

Esto crea las tablas `companies`, `profiles` y `evaluations` con sus índices
y políticas RLS.

### 3.2 Crear el bucket de Storage

En Supabase → Storage → New bucket:

- **Name:** `ad-images`
- **Public bucket:** actívalo si quieres URLs públicas para las imágenes
  (ver advertencias de seguridad en las auditorías)

---

## 4. Stripe

### 4.1 Crear los 4 productos/precios

En Stripe Dashboard → Products → Add product:

| Producto | Precio | Billing | Price ID para `.env.local` |
|---|---|---|---|
| Solo | $19 | Monthly | `STRIPE_PRICE_SOLO_MONTHLY` |
| Solo | $190 | Annual | `STRIPE_PRICE_SOLO_ANNUAL` |
| Team | $49 | Monthly | `STRIPE_PRICE_TEAM_MONTHLY` |
| Team | $490 | Annual | `STRIPE_PRICE_TEAM_ANNUAL` |

### 4.2 Webhook local con Stripe CLI

```bash
# Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

La CLI imprime el `whsec_...` — cópialo a `STRIPE_WEBHOOK_SECRET` en `.env.local`.

---

## 5. Servidor de desarrollo

```bash
npm run dev
```

La app corre en [http://localhost:3000](http://localhost:3000).

---

## 6. Build de producción

```bash
npm run build
```

### Estado actual del build

**Compilación TypeScript:** sin errores.

**Error conocido en build de producción:**

```
Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
Failed to collect page data for /api/stripe/checkout
```

**Causa:** `lib/supabase/admin.ts` inicializa el cliente de Supabase a nivel de
módulo. Durante el build estático, Next.js ejecuta los módulos para pre-renderizar
páginas; si `NEXT_PUBLIC_SUPABASE_URL` contiene el placeholder (`your-supabase-url`),
el SDK lanza una excepción porque no es una URL HTTP válida.

**Solución:** Rellena `.env.local` con las URLs y claves reales de Supabase
antes de ejecutar `npm run build`.

---

## 7. Tests

No existe script `test` en `package.json`. Las opciones disponibles son:

```bash
npm run dev    # servidor de desarrollo
npm run build  # build de producción
npm run lint   # ESLint
npm start      # servidor de producción (requiere build previo)
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción (requiere `.env.local` con URLs reales) |
| `npm start` | Servidor de producción (ejecutar después de build) |
| `npm run lint` | Análisis estático con ESLint |

---

## Diagnóstico rápido

| Síntoma | Causa probable |
|---|---|
| `Invalid supabaseUrl` en build | `.env.local` tiene placeholders; necesita URL real |
| `401 Unauthorized` en APIs | Token de sesión expirado o cookie no configurada |
| `403` en `/api/upload` o `/api/analyze` | Company sin `subscription_status = 'active'` |
| Webhook retorna 400 | `STRIPE_WEBHOOK_SECRET` incorrecto o body parseado antes de verificar firma |
| Imágenes no cargan en historial | Bucket `ad-images` no existe o no es público |
