# Architecture

## Purpose
Descripción de arquitectura de alto nivel para Ritual Studio.

## High-Level Components
- **Next.js App Router**: páginas públicas, dashboards y endpoints API.
- **Supabase**: Auth, Postgres, RLS, almacenamiento de imágenes.
- **Mercado Pago**: procesamiento de tarjetas y notificaciones webhook.
- **Resend (opcional)**: envío de comprobantes de compra.
- **Vercel**: hosting y despliegues por ambiente.

## Runtime Boundaries

### Frontend (browser/client)
- Render de páginas y UX.
- Inicialización de checkout client-side con `NEXT_PUBLIC_MP_PUBLIC_KEY`.
- Gestión de estado UI (ej. carrito, navegación, formularios).

### Backend (Next.js Route Handlers)
- Crear órdenes/pagos con token privado de Mercado Pago.
- Validar payload de pago y precios con catálogo backend.
- Procesar webhook de Mercado Pago.
- Persistir órdenes/pagos en Supabase con service role.
- Ejecutar acciones sensibles (upload de imagen admin, etc.).

## Main Flows (Summary)
1. Usuario navega catálogo y agrega productos.
2. Checkout envía payload a backend (`/api/mercadopago/create-order`).
3. Backend valida productos/cantidades/monto y llama a Mercado Pago.
4. Backend persiste `orders` y `payments` en Supabase.
5. Webhook (`/api/mercadopago/webhook`) actualiza estado real de pago y refuerza consistencia.
6. (Opcional) se envía comprobante por email mediante proveedor configurado.

## Data & Access Model
- Roles base: `user`, `admin`.
- Tabla `public.profiles` vinculada a `auth.users`.
- Función `public.is_admin()` para políticas RLS.
- Rutas administrativas protegidas por validación server-side (`/admin/*`).
- Módulo administrativo de cursos (`/admin/cursos`) con endpoints backend para CRUD de cursos y sesiones (`/api/admin/courses/*`).

## Storage
- Imágenes de producto en bucket de Supabase configurado por variable de entorno.
- Operaciones de escritura al storage solo por backend autenticado.

## Deployment Model
- Rama principal para producción (`main`, salvo configuración contraria).
- Preview deployments por Pull Request.
- Variables de entorno separadas por ambiente.

## Documentation Governance
Si se modifica arquitectura, actualizar este archivo y enlazar el cambio en README.
