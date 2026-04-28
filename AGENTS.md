# AGENTS.md

Guía operativa para agentes (Codex) en **Ritual Studio**.

## Project Context
- Proyecto: sitio web de Ritual Studio (estudio floral premium).
- Objetivo del software: catálogo/marketplace, checkout con Mercado Pago, autenticación con Supabase y operación admin.
- Entorno principal: Next.js desplegado en Vercel, repositorio en GitHub.

## Tech Stack
- **Frontend/App**: Next.js (App Router) + React + TypeScript.
- **Estilos**: CSS global en `src/app/globals.css`.
- **Auth/Data**: Supabase (Auth + Postgres + RLS + Storage).
- **Pagos**: Mercado Pago (checkout y webhook).
- **Correo transaccional**: Resend (opcional, vía backend).
- **Deploy**: Vercel.

## Scope of This File
Este archivo contiene **solo reglas operativas** para agentes.
- Documentación funcional/arquitectura detallada: `/docs/*`.
- Onboarding humano: `README.md`.

## Non-Negotiable Security Rules
1. Nunca exponer secretos en código, PR, README o `/docs`.
2. Nunca usar `SUPABASE_SERVICE_ROLE_KEY` en frontend ni Client Components.
3. Validaciones críticas (montos, estado de pago, permisos) deben vivir en backend/API.
4. Pagos se confirman por backend y webhook, no por estado del frontend.
5. No confiar en datos sensibles enviados por cliente sin validación server-side.
6. No modificar settings productivos (Vercel/Supabase/Mercado Pago) sin validación explícita del equipo.
7. Mantener separación frontend/backend en cualquier integración nueva.

## Development Conventions
- Mantener cambios pequeños, legibles y orientados a producción.
- Preferir utilidades existentes en `src/lib/*` antes de duplicar lógica.
- No romper rutas públicas existentes sin plan de migración.
- Si un cambio altera contratos de API o comportamiento visible, documentarlo en `/docs` y resumirlo en `README.md`.
- No introducir dependencias nuevas sin justificación y documentación.

## What Codex Can Modify
- Código de aplicación (`src/app`, `src/components`, `src/lib`, `src/data`).
- Documentación (`README.md`, `AGENTS.md`, `/docs/*.md`).
- Configuración no sensible del repo.
- Migraciones SQL en `supabase/migrations` cuando el cambio lo requiera.

## What Codex Must Not Modify Without Validation
- Secrets o credenciales reales.
- Configuración productiva en Vercel/Supabase/Mercado Pago fuera del código versionado.
- Políticas RLS críticas sin documentar impacto y plan de rollback.
- Flujos de pago en producción sin estrategia de validación por webhook.

## Integration Rules

### Supabase
- Usar llaves públicas (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o fallback anon) solo en frontend/SSR público.
- Usar `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en rutas backend seguras.
- RLS debe permanecer habilitado en tablas sensibles.
- Cambios de auth/roles/perfiles deben actualizar `/docs/supabase-auth-and-roles.md`.

### Mercado Pago
- `MP_ACCESS_TOKEN` solo en backend.
- `NEXT_PUBLIC_MP_PUBLIC_KEY` puede usarse en frontend para inicializar checkout.
- Verificar estado final mediante webhook + persistencia en backend.
- Cambios de pagos/webhooks deben actualizar `/docs/payments-mercado-pago.md`.

### Vercel
- Variables de entorno definidas por ambiente (Preview/Production) sin hardcode.
- No asumir valores en build; usar validación defensiva y mensajes accionables.
- Cambios de despliegue/arquitectura deben actualizar `/docs/architecture.md`.

### Secrets
- Nunca registrar tokens completos en logs.
- Ejemplos de variables en docs deben ser placeholders, nunca valores reales.

## Documentation Governance Rules
- Cada cambio funcional, estructural o de integración debe reflejarse en los archivos `.md` correspondientes.
- Si se modifica:
  - lógica de negocio → actualizar `/docs/business-rules.md`
  - pagos → actualizar `/docs/payments-mercado-pago.md`
  - autenticación o roles → actualizar `/docs/supabase-auth-and-roles.md`
  - variables de entorno → actualizar `/docs/environment-variables.md`
  - arquitectura → actualizar `/docs/architecture.md`
- No se deben hacer cambios de código sin validar si impactan documentación.
- README.md debe mantenerse como resumen, no duplicar contenido de `/docs`.
- AGENTS.md no debe crecer innecesariamente; solo reglas operativas.
- Si un cambio no está documentado, se considera incompleto.

**La documentación es parte del entregable. Ningún cambio se considera completo si no está documentado.**

## Minimum Validation Before Closing a Change
1. Ejecutar al menos una validación técnica (ej. `npm run lint`).
2. Verificar que `README.md` y `/docs/*.md` reflejen el cambio.
3. Si hay limitación de entorno, dejar evidencia explícita en PR.

## Change Management Checklist (per PR)
- [ ] El cambio está acotado y no mezcla refactors no relacionados.
- [ ] Se ejecutó al menos una validación técnica local.
- [ ] Se revisó impacto en rutas API, auth, pagos y roles.
- [ ] Se actualizó documentación en `/docs` según impacto real.
- [ ] `README.md` quedó como resumen (sin duplicar detalle de `/docs`).
- [ ] No se expusieron secretos ni llaves privadas.

## Quick Mapping: Change → Docs
- Nuevas rutas/patrones de arquitectura: `docs/architecture.md`.
- Cambios de flujo comercial/carrito/checkout: `docs/business-rules.md`.
- Cambios de Mercado Pago (create-order/webhook): `docs/payments-mercado-pago.md`.
- Cambios de login/registro/perfiles/RLS: `docs/supabase-auth-and-roles.md`.
- Nuevas variables o cambios de propósito: `docs/environment-variables.md`.
- Errores nuevos o playbooks operativos: `docs/troubleshooting.md`.

## Quality Bar
- Priorizar claridad sobre complejidad.
- Priorizar seguridad sobre conveniencia.
- Priorizar trazabilidad (código + documentación + evidencia de pruebas).
