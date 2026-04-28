# Business Rules

## Purpose
Reglas funcionales de negocio actuales del flujo comercial de Ritual Studio.

## Catalog & Product Rules
- El catálogo expone productos por `slug` como identificador funcional.
- El checkout no confía en precios enviados por frontend: recalcula usando catálogo backend.
- Cada línea de compra debe incluir `slug` válido y `quantity` entera.

## Cart & Checkout Rules
- El carrito usa ítems discriminados por `kind` (`product` o `course`) para unificar checkout sin mezclar contratos.
- Productos mantienen límite por línea de `1..10`; cursos usan límite de participantes por sesión de `1..6`.
- Para cursos, la clave de línea es compuesta (`slug + course_session_id`) para evitar colisiones entre sesiones del mismo curso.
- En frontend se muestra cupo como snapshot en tiempo real (refresh de sesiones), pero la validación definitiva de cupo/precio ocurre en backend al crear la orden.
- Para cursos, la reserva de cupo debe ejecutarse de forma transaccional para concurrencia (lock de sesión + incremento atómico de `reserved_spots`).
- Cantidad por producto permitida: mínimo 1, máximo 10.
- El checkout exige al menos un producto.
- El monto mínimo para pago con tarjeta en checkout: **$10 MXN**.
- Email del comprador es obligatorio y debe ser válido.
- Email alterno de comprobante es opcional, pero si se envía debe ser válido.
- Cuotas (`installments`) permitidas: 1 a 24.
- Si el carrito contiene cursos, checkout exige captura de nombres de participantes por sesión (`quantity` nombres por cada línea de curso).
- Validaciones de participantes (frontend y backend): nombres no vacíos, mínimo 2 caracteres y sin duplicados exactos por sesión.

## Order Lifecycle (Current)
- Al crear orden de pago se genera `external_reference` único.
- La orden local se crea antes del cobro y puede asociar `orders.user_id` cuando checkout tiene sesión autenticada.
- Se persisten orden y pago en Supabase usando `X-Idempotency-Key` por intento de cobro.
- El webhook vuelve a sincronizar/actualizar estado para consistencia operativa.
- Estados normalizados para UI: `approved`, `pending`, `rejected`, `error`.


## Courses & Sessions Rules
- `courses.slug` es único y funciona como identificador estable para catálogo de cursos.
- En administración, la imagen del curso se carga como archivo (upload directo) y no como URL manual.
- Cada sesión (`course_sessions`) pertenece a un curso y debe respetar `capacity > 0`.
- Los cupos reservados (`reserved_spots`) nunca pueden ser negativos.
- En administración, al editar una sesión no se permite bajar `capacity` por debajo de `reserved_spots` para evitar sobreventa.
- Las líneas de compra de cursos (`order_course_items`) requieren `quantity >= 1` y se vinculan a `orders`, `courses` y `course_sessions`.
- Participantes (`course_participants`) se registran por ítem de compra y heredan acceso por propiedad de la orden (`orders.user_id`).
- Si el pago queda `rejected` o `cancelled`, el sistema libera cupo reservado de forma idempotente (create-order/webhook y reconciliación).

## Account & Role Rules
- Roles vigentes: `user` y `admin`.
- Rutas `/admin/*` requieren sesión válida y rol admin.
- Si no hay sesión: redirección a login con redirect.
- Si hay sesión sin privilegios admin: redirección a `/unauthorized`.

## Operational Rule
Los cambios en lógica comercial deben reflejarse en este archivo.
