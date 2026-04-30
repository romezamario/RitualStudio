# Environment Variables

## Purpose
Inventario de variables de entorno usadas por el proyecto (sin secretos).

## Public Variables (`NEXT_PUBLIC_*`)

### Site
- `NEXT_PUBLIC_SITE_URL`: URL canónica del sitio para callbacks, metadata, sitemap/robots.
- `NEXT_PUBLIC_SITE_VERSION`: versión visible opcional en UI.

### WhatsApp
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: número base para CTA.
- `NEXT_PUBLIC_WHATSAPP_MESSAGE`: mensaje prellenado.

### Supabase (public config)
- `NEXT_PUBLIC_SUPABASE_URL`: URL base de proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: llave pública recomendada.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: fallback retrocompatible.

### Mercado Pago
- `NEXT_PUBLIC_MP_PUBLIC_KEY`: llave pública para bricks/tokenización en frontend.

### Integración metadata (operativa)
- `NEXT_PUBLIC_GITHUB_REPOSITORY`
- `NEXT_PUBLIC_SUPABASE_WORKING_DIRECTORY`
- `NEXT_PUBLIC_SUPABASE_PRODUCTION_BRANCH`
- `NEXT_PUBLIC_SUPABASE_DEPLOY_TO_PRODUCTION`
- `NEXT_PUBLIC_VERCEL_TEAM`
- `NEXT_PUBLIC_VERCEL_PROJECT`
- `NEXT_PUBLIC_SUPABASE_VERCEL_SYNC_ENVS`
- `NEXT_PUBLIC_VERCEL_ENV_PREFIX`

### Marketplace
- `NEXT_PUBLIC_MARKETPLACE_LOCAL_FALLBACK`: habilita fallback local del catálogo cuando backend no responde.

## Server-Only Variables
- `SUPABASE_SERVICE_ROLE_KEY`: acceso privilegiado a Supabase desde backend.
- `SUPABASE_PRODUCT_IMAGES_BUCKET`: bucket de imágenes de producto.
- `MP_ACCESS_TOKEN`: credencial privada para API de Mercado Pago.
- `MP_WEBHOOK_SECRET`: secreto para validar firma del webhook.
- `EMAIL_PROVIDER`: proveedor de correo (`resend`, `disabled`, etc.).
- `EMAIL_FROM`: remitente para correos transaccionales.
- `EMAIL_SUPPORT_CHANNEL`: canal mostrado en comprobantes.
- `RESEND_API_KEY`: API key de Resend.

## Variables nuevas para cursos (estado actual)
- Para la venta/admin de cursos **no se agregaron variables nuevas** en esta iteración.
- La funcionalidad usa variables ya existentes de Supabase y Mercado Pago.
- Si en el futuro se separa bucket de imágenes de cursos, documentar variable con placeholder (ejemplo: `SUPABASE_COURSE_IMAGES_BUCKET=`) antes de activar en código.

## Security Rules
- No versionar `.env*` con valores reales.
- No copiar llaves privadas en README ni en `/docs`.
- Variables server-only no deben consultarse en Client Components.

## Operational Notes
- Verificar que llaves públicas/privadas de Mercado Pago pertenezcan al mismo entorno (test/prod).
- Mantener coherencia de variables entre ambientes Vercel (preview/production).

## Perfil de usuario (Mi perfil)
- El endpoint `PATCH /api/auth/profile` **no requiere variables nuevas** en esta iteración.
- Reutiliza configuración actual de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`) para sesión de usuario y APIs backend ya existentes.
- Mantener `SUPABASE_SERVICE_ROLE_KEY` restringida a backend seguro; nunca necesaria en frontend para edición de perfil.
