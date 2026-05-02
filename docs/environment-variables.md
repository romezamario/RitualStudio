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
- `MP_PUBLIC_KEY_PROD`: llave pública usada por checkout cuando `payments_mode=prod`.
- `MP_PUBLIC_KEY_TEST` (opcional): llave pública usada por checkout cuando `payments_mode=test`.

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
- `MP_ACCESS_TOKEN_PROD`: credencial privada para API de Mercado Pago.
- `MP_ACCESS_TOKEN_TEST`: credencial privada de pruebas para reconciliación webhook en endpoint `/api/mercadopago/webhook/test`.
- `MP_WEBHOOK_SECRET_PROD`: secreto para validar firma del webhook.
- `MP_WEBHOOK_SECRET_TEST`: secreto de pruebas para validar firma del endpoint `/api/mercadopago/webhook/test`.
- `MP_NOTIFICATION_URL_PROD`: URL absoluta (https) para enviar como `notification_url` en pagos de producción (recomendado `/api/mercadopago/webhook/prod`).
- `MP_NOTIFICATION_URL_TEST`: URL absoluta (https) para enviar como `notification_url` en pagos de pruebas (recomendado `/api/mercadopago/webhook/test`).
- `MP_NOTIFICATION_URL` (legacy opcional): fallback retrocompatible si aún no se migraron variables por ambiente.
- `EMAIL_PROVIDER`: proveedor de correo (`resend`, `disabled`, etc.).
- `RESEND_API_KEY`: API key de Resend.
- `RESEND_FROM_EMAIL`: remitente principal para correos transaccionales (recomendado).
- `EMAIL_FROM` (legacy opcional): fallback temporal de remitente para compatibilidad retroactiva.
- `EMAIL_SUPPORT_CHANNEL`: canal mostrado en comprobantes.
- `SITE_URL` (opcional): URL canónica server-side usada como fallback para links en emails.
- `EMAIL_ACCOUNT_ORDERS_URL` (opcional): URL absoluta personalizada para CTA de "Revisar mis compras" en email; si no existe se deriva como `<SITE_URL>/mi-cuenta/pedidos` (o `NEXT_PUBLIC_SITE_URL`).
- `EMAIL_SOCIAL_INSTAGRAM_URL` (opcional): link de Instagram mostrado en comprobante.
- `EMAIL_SOCIAL_FACEBOOK_URL` (opcional): link de Facebook mostrado en comprobante.
- `EMAIL_SOCIAL_TIKTOK_URL` (opcional): link de TikTok mostrado en comprobante.

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


## Payment Mode Toggle (Superusuario)
- `SUPERUSER_EMAILS`: lista separada por comas de correos autorizados para cambiar el modo de pagos desde admin.
- `payments_mode` (persistido en `public.app_settings`): valor runtime (`test` o `prod`) que define qué credenciales usa backend en checkout.


## Validación cruzada de entorno (Mercado Pago)
- Se agregó validación centralizada en `src/lib/mercadopago-env.ts` para asegurar consistencia entre llaves públicas y privadas por ambiente.
- Compatibilidad adicional: `NEXT_PUBLIC_MP_PUBLIC_KEY` y `MP_ACCESS_TOKEN` pueden inyectarse como alias por ambiente (útil en Vercel Preview/Development).
- Regla de prefijos: `TEST-` (test) y `APP_USR-` (producción). Si se mezclan, el backend bloquea el flujo con error controlado.
- Logs seguros: solo prefijo parcial (7 chars), longitud y entorno detectado; nunca se imprime token completo.
