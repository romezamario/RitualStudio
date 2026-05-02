# Ritual Studio

Sitio web de **Ritual Studio**, estudio floral premium con enfoque editorial/comercial, catálogo de productos, carrito, checkout con Mercado Pago y paneles operativos para administración.

> Este README está orientado a onboarding y operación diaria.
> La documentación funcional/técnica detallada vive en [`/docs`](./docs).

---

## Table of Contents
- [Project Overview](#project-overview)
- [Stack](#stack)
- [Requirements](#requirements)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment in Vercel](#deployment-in-vercel)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Security Notes](#security-notes)
- [Contribution Workflow](#contribution-workflow)

---

## Project Overview

Ritual Studio es una aplicación Next.js (App Router) que actualmente incluye:

- Home tipo wallpaper navegable con mosaico visual y páginas editoriales/comerciales (`/`, `/marketplace`, `/custom`, `/eventos`, `/nosotros`, `/contacto`).
- Marketplace y detalle de producto (`/marketplace`, `/marketplace/[slug]`).
- Venta de cursos con landing/listado y detalle por slug con sesiones con cupo (`/cursos`, `/cursos/[slug]`), incluyendo CTA de "Ver detalle" en cards para abrir la vista extendida del curso.
  - El selector de participantes en detalle de curso usa control visual grande con botones +/− para ajustar cupos antes de agregar al carrito.
- Carrito unificado para productos y cursos (`/carrito`).
- Checkout con tarjeta (Mercado Pago) y vista de éxito (`/checkout`, `/checkout/exito`).
  - Flujo post-compra para invitados: CTA a registro/login y vinculación automática de compras al historial con correo verificado.
  - En checkout, usuarios autenticados ven su correo prellenado en modo solo lectura antes del formulario embebido.
  - Si hay cursos en carrito, checkout exige nombres de participantes por sesión antes de enviar pago.
  - Backend de pago soporta carrito mixto (productos + cursos), recalcula precios en servidor y reserva/libera cupos de sesión de forma transaccional.
  - Webhook de Mercado Pago registra auditoría operativa en `payment_events.payload`, deduplica notificaciones repetidas y reconcilia cupos por estado final del pago.
- Autenticación base con Supabase (`/login`, `/auth/callback`, `/actualizar-contrasena`).
- Dashboard de cuenta y administración (`/mi-cuenta`, `/mi-cuenta/perfil`, `/admin/*`), incluyendo capability “Mi perfil” para actualizar nombre, teléfono y correo desde una ruta dedicada (vía endpoint seguro `PATCH /api/auth/profile`), además de admin de cursos con navegación dedicada para sesiones por curso (pantalla separada desde "Gestionar sesiones"), cupos por sesión y carga directa de imagen de curso (sin URL manual) usando el mismo pipeline/validaciones de imágenes del módulo de productos.
- Contrato de imágenes por variantes: `thumb` (listados), `card` (cards/previews), `detail` (PDP) y `original` solo para acciones explícitas fuera del flujo normal.
- Upload admin de imágenes con preprocesamiento en navegador (resize máx. 2000px, export preferente WEBP con fallback JPEG/PNG) y registro de metadatos técnicos en Supabase para trazabilidad.
- Módulo "Mis pedidos" conectado a Supabase con consulta server-side por usuario autenticado, filtros por estado/referencia y detalle de líneas para productos/cursos con participantes registrados, consolidando estado con prioridad de `payments.status` y fallback de `orders.status`; cada detalle de orden incluye CTA **Consultar pago** que lleva a `/checkout/exito?external_reference=...` para revisar el comprobante canónico de esa compra.
- Base de datos preparada para cursos, sesiones y participantes con RLS en Supabase.
- Aviso de privacidad (`/aviso-de-privacidad`).

---

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19 + CSS global
- **Linting**: ESLint (config de Next.js)
- **Auth & DB**: Supabase (Auth + Postgres + RLS)
- **Payments**: Mercado Pago
- **Transactional email (optional)**: Resend
- **Hosting/CI preview**: Vercel + GitHub

---

## Requirements

- Node.js 20+ recomendado
- npm 10+ recomendado
- Proyecto Supabase (URL + publishable/anon key)
- Credenciales de Mercado Pago para el ambiente objetivo
- (Opcional) Cuenta en Resend para comprobantes por email

---

## Local Setup

1. Clonar repositorio.
2. Instalar dependencias.
3. Crear archivo `.env.local` con variables mínimas.
4. Ejecutar el servidor local.

```bash
git clone <repo-url>
cd RitualStudio
npm install
npm run dev
```

Abrir `http://localhost:3000`.

---

## Environment Variables

> No incluir valores reales en documentación ni en commits.

Variables base (ajusta según features que quieras probar):

```bash
# Sitio
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SITE_VERSION=

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_WHATSAPP_MESSAGE=
NEXT_PUBLIC_INSTAGRAM_URL= # ícono de Instagram en footer (opcional)

# Supabase (frontend/server público)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# fallback retrocompatible (opcional)
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (solo backend seguro)
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PRODUCT_IMAGES_BUCKET=

# Mercado Pago
MP_PUBLIC_KEY_PROD=
MP_PUBLIC_KEY_TEST= # documentada para pruebas/operación
MP_ACCESS_TOKEN_PROD=
MP_ACCESS_TOKEN_TEST=
MP_WEBHOOK_SECRET_PROD=
MP_WEBHOOK_SECRET_TEST=
SUPERUSER_EMAILS= # correos separados por comas con permiso para cambiar modo de pagos

# Correo transaccional (opcional)
EMAIL_PROVIDER=
RESEND_API_KEY=
RESEND_FROM_EMAIL= # remitente principal recomendado
EMAIL_FROM= # fallback legacy opcional de compatibilidad
EMAIL_SUPPORT_CHANNEL=
EMAIL_SOCIAL_INSTAGRAM_URL= # si no se define, usa el Instagram oficial por defecto
EMAIL_SOCIAL_FACEBOOK_URL=
EMAIL_SOCIAL_TIKTOK_URL=

# Metadata de integración (opcional)
NEXT_PUBLIC_GITHUB_REPOSITORY=
NEXT_PUBLIC_SUPABASE_WORKING_DIRECTORY=
NEXT_PUBLIC_SUPABASE_PRODUCTION_BRANCH=
NEXT_PUBLIC_SUPABASE_DEPLOY_TO_PRODUCTION=
NEXT_PUBLIC_VERCEL_TEAM=
NEXT_PUBLIC_VERCEL_PROJECT=
NEXT_PUBLIC_SUPABASE_VERCEL_SYNC_ENVS=
NEXT_PUBLIC_VERCEL_ENV_PREFIX=

# Catálogo
NEXT_PUBLIC_MARKETPLACE_LOCAL_FALLBACK=
```

Para descripción completa por variable, revisar [`docs/environment-variables.md`](./docs/environment-variables.md).

---

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run release:small -- --notes="..."
npm run release:big -- --notes="..."
npm run release:breaking -- --notes="..."
```

Notas:
- `release:*` incrementa versión y actualiza `CHANGELOG.md`.
- Ejecuta `npm run lint` antes de abrir PR.

---

## Deployment in Vercel

1. Conecta el repositorio en Vercel.
2. Verifica detección automática de framework Next.js.
3. Configura variables de entorno por ambiente (Preview/Production).
4. Usa PRs para validar previews antes de merge a `main`.
5. Confirma que endpoints de Mercado Pago webhook apunten al dominio correcto de producción.
6. Vercel está configurado para omitir deployments cuando el commit solo cambia documentación (`**/*.md`, `docs/**`, `supabase/**/*.md`). Si hay cambios de código/configuración/migraciones SQL, el deployment sí se ejecuta.

Guía de arquitectura/deploy en [`docs/architecture.md`](./docs/architecture.md).

---

## Project Structure

Estructura general (resumen):

```text
.
├─ src/
│  ├─ app/                  # Rutas App Router + API routes
│  ├─ components/           # UI y componentes cliente/servidor
│  ├─ lib/                  # Integraciones (Supabase, Mercado Pago, email, utilidades)
│  └─ data/                 # Datos de catálogo base
├─ supabase/
│  └─ migrations/           # SQL migrations (roles, RLS, storage, etc.)
├─ public/
│  └─ images/               # Estructura de assets estáticos
├─ docs/                    # Documentación técnica/funcional detallada
├─ AGENTS.md                # Reglas operativas para agentes
└─ README.md                # Onboarding humano (este archivo)
```

---

## Documentation

Documentación detallada del proyecto:

- [Architecture](./docs/architecture.md)
- [Business Rules](./docs/business-rules.md)
- [Payments (Mercado Pago)](./docs/payments-mercado-pago.md)
- [Supabase Auth and Roles](./docs/supabase-auth-and-roles.md)
- [Environment Variables](./docs/environment-variables.md)
- [Troubleshooting](./docs/troubleshooting.md)

Regla de gobernanza: cualquier cambio funcional/estructural/integración debe reflejarse también en la documentación aplicable.

Resumen rápido de alcance comercial actual:
- El checkout soporta venta mixta de productos y cursos.
- Existe módulo administrativo para operar cursos y sesiones.
- El detalle funcional/técnico vive en `docs/business-rules.md`, `docs/payments-mercado-pago.md`, `docs/supabase-auth-and-roles.md` y `docs/architecture.md`.

---

## Security Notes

- Nunca exponer secretos en frontend ni en repositorio.
- `SUPABASE_SERVICE_ROLE_KEY` debe quedar en backend seguro.
- `MP_ACCESS_TOKEN_PROD` solo backend.
- Validar pagos por backend/webhook; no confiar en estado del cliente.
- No usar documentación para almacenar credenciales reales.

---

## Contribution Workflow

1. Crear rama de trabajo.
2. Implementar cambios.
3. Actualizar documentación impactada (`README.md` y/o `/docs`).
4. Ejecutar validaciones (`npm run lint` y las que apliquen).
5. Abrir PR con resumen técnico + evidencia de pruebas.

Criterio de done documental:
- Si un cambio no está documentado, el cambio está incompleto.

---

## Supabase Keep-Alive (evitar pausa por inactividad)

Se agregó el endpoint backend `GET /api/health/supabase` para realizar un ping seguro y de solo lectura a Supabase.

### Qué hace
- Corre 100% server-side (Route Handler de Next.js).
- Realiza una consulta mínima de metadatos en `rest/v1`.
- No modifica tablas ni datos de negocio.
- Responde:
  - `200 { "ok": true }` cuando Supabase responde.
  - `401 { "ok": false, "error": "Unauthorized" }` cuando `CRON_SECRET` existe y el header no coincide.
  - `503/500 { "ok": false, "error": "..." }` ante fallas del backend/Supabase.

### Variables necesarias
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY` como fallback)
- `CRON_SECRET` (**recomendado** en Vercel Preview/Production)

### Cómo probar localmente
```bash
# sin CRON_SECRET definido
curl -i http://localhost:3000/api/health/supabase

# con CRON_SECRET definido
curl -i http://localhost:3000/api/health/supabase -H "x-cron-secret: $CRON_SECRET"

# header incorrecto (debe responder 401)
curl -i http://localhost:3000/api/health/supabase -H "x-cron-secret: invalido"
```

### Configuración en Vercel
Configura estas variables por ambiente:
- **Development**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o anon), `CRON_SECRET` (opcional, recomendado).
- **Preview**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o anon), `CRON_SECRET`.
- **Production**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o anon), `CRON_SECRET`.

### Cron configurado (GitHub Actions)
Para evitar la limitación de Vercel Hobby (máximo 1 ejecución/día), el repositorio usa GitHub Actions con ejecución cada 30 minutos:
- Workflow: `.github/workflows/supabase-keepalive.yml`
- Schedule: `*/30 * * * *`

Secrets requeridos en GitHub (repo settings → Secrets and variables → Actions):
- `KEEPALIVE_URL` (ejemplo: `https://ritualstudio.com.mx/api/health/supabase`)
- `CRON_SECRET` (opcional, pero recomendado si el endpoint está protegido)

El workflow también permite ejecución manual (`workflow_dispatch`) para pruebas operativas.

Si prefieres monitor externo, usa:
```bash
curl -X GET "https://ritualstudio.com.mx/api/health/supabase" \
  -H "x-cron-secret: <CRON_SECRET>"
```
