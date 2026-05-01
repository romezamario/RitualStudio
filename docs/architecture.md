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
- Inicialización de checkout client-side con public key de Mercado Pago resuelta por `payments_mode` (`MP_PUBLIC_KEY_PROD` o `MP_PUBLIC_KEY_TEST`).
- Gestión de estado UI (ej. carrito, navegación, formularios).

### Backend (Next.js Route Handlers)
- Crear órdenes/pagos con token privado de Mercado Pago.
- Validar payload de pago y precios con catálogo backend.
- Procesar webhook de Mercado Pago.
- Persistir órdenes/pagos en Supabase con service role.
- Ejecutar acciones sensibles (upload de imagen admin, etc.).

## Main Flows (Summary)
1. Usuario navega catálogo de productos (`/marketplace`) o catálogo de cursos (`/cursos`) y agrega ítems al carrito.
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
- Módulo de cuenta `/mi-cuenta/pedidos` renderizado server-side: usa token de sesión (`sb-access-token`) para consultas REST con RLS y aplica validación defensiva adicional filtrando por `orders.user_id = auth user`.
- El dashboard `/mi-cuenta` incluye tarjeta de perfil con CTA a `/mi-cuenta/perfil` para centralizar la edición de datos personales (nombre/teléfono) en una ruta dedicada.
- La ruta `/mi-cuenta/perfil` opera con flujo App/API/Supabase: formulario cliente -> `PATCH /api/auth/profile` -> actualización de `auth.users` (email) y `public.profiles` (`full_name`, `phone`) bajo sesión autenticada.
- El endpoint de perfil ejecuta validación de campos permitidos y bloqueo explícito de `role`, mientras RLS en Supabase refuerza que cada usuario solo edite su propia fila en `profiles`.
- El historial de pedidos consolida `orders` + `payments` + `order_course_items`/`course_participants` para mostrar resumen por orden y detalle de líneas compradas.

## Course Commerce Components
Nuevos componentes de dominio para venta y operación de cursos:
- `courses`: entidad catálogo de cursos (datos editoriales/comerciales base).
- `course_sessions`: agenda de sesiones por curso con control de cupo (`capacity`, `reserved_spots`).
- `order_course_items`: líneas de orden para cursos, puente entre `orders` y sesión/curso comprado.
- `course_participants`: participantes capturados por línea de curso para operación y experiencia post-compra.

Relación funcional:
1. `courses` 1:N `course_sessions`.
2. `orders` 1:N `order_course_items`.
3. `order_course_items` 1:N `course_participants`.
4. `order_course_items` referencia `course_sessions` y `courses` para trazabilidad histórica aunque cambie contenido editorial del curso.

## Storage
- Imágenes de producto en bucket de Supabase configurado por variable de entorno.
- Imágenes de cursos administradas con carga directa desde backend (sin exponer service role en frontend).
- Antes del upload, el navegador procesa imágenes (resize proporcional con lado mayor máximo de 2000px + export preferente WEBP con fallback JPEG/PNG).
- Cada upload exitoso persiste metadatos operativos en `public.product_image_uploads` (`width`, `height`, `size_bytes`, `mime_type`, `original_filename`, `storage_path`) para trazabilidad.
- Operaciones de escritura al storage solo por backend autenticado.
- Contrato de variantes de imagen activo: `thumb` (320x240), `card` (720x540), `detail` (1440x1080) y `original` (solo acciones explícitas fuera del flujo normal).
- Mapeo por pantalla: listados usan `thumb`, cards/admin preview usan `card`, PDP usa `detail`; `original` no se solicita durante navegación estándar.

## Deployment Model
- Rama principal para producción (`main`, salvo configuración contraria).
- Preview deployments por Pull Request.
- Variables de entorno separadas por ambiente.

## Documentation Governance
Si se modifica arquitectura, actualizar este archivo y enlazar el cambio en README.


## Payment Mode Runtime
- `public.app_settings` mantiene `payments_mode` (`test`/`prod`) como fuente de verdad runtime.
- `/admin/pagos` permite a superusuario conmutar el modo sin redeploy.
- `create-order` usa el modo activo para elegir token y `notification_url` de Mercado Pago.
