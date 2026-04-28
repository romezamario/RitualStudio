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

## Roles
- Roles soportados: `user`, `admin`.
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
- escritura administrativa para gestión de cursos y sesiones mediante `public.is_admin()`;
- trigger `set_updated_at` aplicado en tablas con columna `updated_at`.

## Promotion to Admin
La promoción inicial de admin se hace desde SQL por operador autorizado.
No debe existir elevación de rol desde frontend.

## Security Rules
- Nunca usar `SUPABASE_SERVICE_ROLE_KEY` en cliente.
- Validar autorización en servidor para cualquier acción sensible.
- Mantener RLS activo en tablas con datos de negocio.

## Pending / TODO
- Documentar matriz de permisos por pantalla/endpoint.
- Definir reglas de auditoría para cambios de rol.
