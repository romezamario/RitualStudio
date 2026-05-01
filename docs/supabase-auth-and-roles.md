# Supabase Auth and Roles

## Purpose
Guía de autenticación, sesiones, perfiles y autorización por rol.

## Auth Flows
- Login con email/contraseña contra endpoint de Supabase Auth.
- Registro con email/contraseña y metadata de perfil (username/full_name cuando aplica).
- Verificación de correo mediante callback con `token_hash`.
- Recuperación de contraseña con callback hacia `/actualizar-contrasena`.

## Session Model
- La app utiliza cookies de sesión para access/refresh token.
- Validación server-side de usuario mediante `/auth/v1/user`.
- Endpoint `GET /api/auth/me` disponible para hidratación de estado autenticado en UI.
- En `create-order` de Mercado Pago, si hay sesión válida durante checkout, la orden se persiste con `orders.user_id` para trazabilidad y acceso RLS de compras de curso.
- Endpoint `POST /api/auth/claim-orders` permite vincular compras hechas como invitado (`orders.user_id is null`) cuando el usuario inicia sesión con correo verificado; la acción usa `customer_email` como criterio y opcionalmente exige `external_reference` reciente del checkout success.
- El claim post-registro/login aplica también para órdenes mixtas con cursos: al reclamar `orders.user_id`, el acceso a `order_course_items` y `course_participants` queda habilitado por RLS para ese usuario.

## Roles
- Roles soportados: `user`, `admin`.
- Capacidad adicional: **superusuario operativo** por allowlist de correo (`SUPERUSER_EMAILS`) para tareas críticas (ej. cambiar `payments_mode`).
- `profiles.role` es la fuente de verdad de privilegios operativos.
- Rutas admin protegidas en layout server-side (`/admin/layout.tsx`).

## RLS & SQL Base
Migración principal de roles/perfiles:
- `supabase/migrations/20260421_roles_profiles_rls.sql`

Incluye:
- tabla `public.profiles`;
- trigger para `updated_at`;
- trigger para crear/sincronizar perfil al crear usuario auth;
- función `public.is_admin()`;
- policies de lectura/actualización propia y lectura/edición admin.


## RLS Extension: Courses
Migración de cursos/sesiones/compras de cursos:
- `supabase/migrations/20260428101500_courses_schema.sql`

Incluye:
- tablas `public.courses`, `public.course_sessions`, `public.order_course_items`, `public.course_participants`;
- RLS habilitado en las cuatro tablas;
- lectura propia de compras/participantes basada en `orders.user_id = auth.uid()`;
- escritura administrativa para gestión de cursos y sesiones mediante `public.is_admin()` (incluye alta, edición y baja lógica/física según endpoint);
- permisos admin para operar cursos/sesiones desde `/admin/cursos` y endpoints `api/admin/courses/*`;
- trigger `set_updated_at` aplicado en tablas con columna `updated_at`.

## Promotion to Admin
La promoción inicial de admin se hace desde SQL por operador autorizado.
No debe existir elevación de rol desde frontend.

## Security Rules
- Nunca usar `SUPABASE_SERVICE_ROLE_KEY` en cliente.
- Validar autorización en servidor para cualquier acción sensible.
- Mantener RLS activo en tablas con datos de negocio.

## Guest Purchase Claim (Post-checkout)
- Flujo soportado: compra como invitado → login/registro → vinculación automática de órdenes al historial.
- Requisitos de seguridad:
  - sesión autenticada válida;
  - correo del usuario **confirmado** (`email_confirmed_at`);
  - solo órdenes con `user_id is null` y `customer_email` coincidente (normalizado a minúsculas).
- Comprobación opcional adicional: si llega `external_reference`, el endpoint exige que exista una orden reciente (ventana de 24 h) con esa referencia para el mismo correo antes de ejecutar el claim.
- Trazabilidad: cada claim exitoso registra evento en `public.order_claim_events` (orden, usuario que reclamó, método y referencia).
- Garantía de no sobrescritura: nunca se reasignan órdenes ya vinculadas a otro usuario (`user_id` distinto de `null`).

## Pending / TODO
- Documentar matriz de permisos por pantalla/endpoint.
- Definir reglas de auditoría para cambios de rol.


## Perfil de usuario (self-service)
### Campos de perfil soportados
- `public.profiles` incluye `full_name` y `phone` como campos editables por el titular de la cuenta.
- `email` se expone en UI de “Mi perfil” y puede editarse **solo** por usuario autenticado sobre su propia cuenta.
- `role` permanece fuera del alcance del formulario self-service y no puede ser escalado desde frontend.

### Endpoint `PATCH /api/auth/profile`
Contrato funcional del endpoint autenticado para autogestión de perfil:
- Ruta: `PATCH /api/auth/profile`.
- Requiere sesión válida (cookie/token de Supabase).
- Campos permitidos: `full_name`, `phone` y `email` (cuando aplique cambio).
- Rechaza payload con claves no permitidas (incluyendo `role`).

Restricciones de seguridad aplicadas:
1. **Autorización por sesión**: solo opera para `auth.uid()` en contexto; no acepta `user_id` del cliente.
2. **Actualización de email controlada**: el cambio se ejecuta vía backend usando APIs seguras de Auth; nunca con credenciales privilegiadas en cliente.
3. **No elevación de privilegios**: cualquier intento de mutar `role` se bloquea con error de validación/autorización.
4. **Defensa en profundidad**: además de validación en endpoint, RLS en `profiles` restringe edición de fila propia.

### Comportamiento de `email` editable
- Si el usuario envía un `email` distinto al actual, el backend procesa el update sobre Auth y devuelve estado consistente para refrescar UI.
- Si `email` no cambia, el endpoint actualiza únicamente campos de `profiles` (`full_name`, `phone`).
- El frontend debe refrescar estado de autenticación (`refreshAuth`) tras respuesta exitosa para sincronizar header, dashboard y vista `/mi-cuenta/perfil`.

## Ajuste RLS para update de perfil propio
Migración aplicada:
- `supabase/migrations/20260430110000_profiles_contact_fields_and_rls_update.sql`

Garantías:
- solo `auth.uid() = profiles.id` puede editar su fila;
- se mantiene bloqueo de escalación de `role` para usuarios no admin;
- `updated_at` continúa gestionado por trigger existente `profiles_set_updated_at`.
