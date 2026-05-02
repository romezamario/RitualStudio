# Business Rules

## Purpose
Reglas funcionales de negocio actuales del flujo comercial de Ritual Studio.

## Home & Navigation Rules
- La home (`/`) funciona como wallpaper navegable con mosaico editorial y accesos directos a: tienda (`/marketplace`), experiencias (`/cursos`), diseño a medida (`/custom`), eventos (`/eventos`), nosotros (`/nosotros`) y contacto (`/contacto`).
- Cada tarjeta de la home debe mantener estética premium/elegante y legibilidad de texto sobre imagen mediante overlay.
- Los accesos visuales de la home no reemplazan la navegación global; la complementan como entrada rápida a áreas clave del sitio.

## Catalog & Product Rules
- El catálogo expone productos por `slug` como identificador funcional.
- El checkout no confía en precios enviados por frontend: recalcula usando catálogo backend.
- En PDP de productos y detalle de cursos, la acción **Comprar ahora** agrega la línea seleccionada al carrito y redirige directo a `/checkout` (sin pasar por WhatsApp).
- Cada línea de compra debe incluir `slug` válido y `quantity` entera.

## Cart & Checkout Rules
- El carrito usa ítems discriminados por `kind` (`product` o `course`) para unificar checkout sin mezclar contratos.
- Productos mantienen límite por línea de `1..10`; cursos usan límite de participantes por sesión de `1..6`.
- Para cursos, la clave de línea es compuesta (`slug + course_session_id`) para evitar colisiones entre sesiones del mismo curso.
- La compra mixta (productos + cursos en una misma orden) es válida y se procesa con un único intento de pago, pero con validaciones diferenciadas por tipo de línea.
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
- Regla de consistencia de participantes: el total de participantes capturados por `course_session_id` debe coincidir exactamente con `quantity` de cada línea de curso o la orden se rechaza antes de invocar a Mercado Pago.

## Order Lifecycle (Current)
- Al crear orden de pago se genera `external_reference` único.
- La orden local se crea de forma transaccional previa al cobro para reservar contexto (ítems, metadata y cupos), y puede asociar `orders.user_id` cuando checkout tiene sesión autenticada.
- Si la invocación al servicio de Mercado Pago falla (ej. `500`, `internal_server_error` o timeout), el backend libera cupos reservados y elimina la orden local para no persistir pedidos sin intento de cobro válido.
- Excepción controlada: en `payments_mode=test`, si el error ocurre tras crear la orden local y es `5xx`, se conserva una orden de fallback con estado simulado `approved` para permitir QA end-to-end del flujo post-checkout (pantalla de éxito y procesos de correo) sin depender de la respuesta final de MP.
- Cuando Mercado Pago responde correctamente, se persisten orden y pago en Supabase usando `X-Idempotency-Key` por intento de cobro.
- El webhook vuelve a sincronizar/actualizar estado para consistencia operativa.
- Estados normalizados para UI: `approved`, `pending`, `rejected`, `error`.
- Después de checkout exitoso sin sesión, la UI promueve registro/login y, tras autenticación, ejecuta vinculación automática de compras pendientes al historial de la cuenta.
- La vinculación de invitado solo procede con correo verificado y nunca sobrescribe órdenes ya asignadas (`orders.user_id` debe ser `null`).


## Courses & Sessions Rules
- `courses.slug` es único y funciona como identificador estable para catálogo de cursos.
- En `/cursos`, cada card expone CTA de **Ver detalle** hacia `/cursos/[slug]` para revisar la información del curso antes de comprar.
- Los cursos pueden tener oferta (`has_offer=true`): en ese caso se muestra `price` como precio vigente y `original_price` como precio anterior tachado/referencial; el precio de oferta siempre debe ser menor al precio base.
- En administración, la imagen del curso se carga como archivo (upload directo) y no como URL manual.
- En administración, la gestión de sesiones se realiza en una pantalla dedicada por curso (`/admin/cursos/[courseId]/sesiones`) para evitar mezclar formularios de cursos y sesiones en la misma vista.
- Cada sesión (`course_sessions`) pertenece a un curso y debe respetar `capacity > 0`.
- Los cupos reservados (`reserved_spots`) nunca pueden ser negativos.
- Cupo disponible de sesión: `available_spots = capacity - reserved_spots` y no puede resultar negativo en ninguna transición.
- En administración, al editar una sesión no se permite bajar `capacity` por debajo de `reserved_spots` para evitar sobreventa.
- Las líneas de compra de cursos (`order_course_items`) requieren `quantity >= 1` y se vinculan a `orders`, `courses` y `course_sessions`.
- Participantes (`course_participants`) se registran por ítem de compra y heredan acceso por propiedad de la orden (`orders.user_id`); cada registro pertenece a una sola línea de curso.
- La edición de cursos/sesiones desde admin requiere rol `admin`; usuarios `user` solo pueden consultar sus propias compras/participantes mediante RLS.
- Si el pago queda `rejected` o `cancelled`, el sistema libera cupo reservado de forma idempotente (create-order/webhook y reconciliación).

## Account & Role Rules
- Roles vigentes: `user` y `admin`.
- Rutas `/admin/*` requieren sesión válida y rol admin.
- Si no hay sesión: redirección a login con redirect.
- Si hay sesión sin privilegios admin: redirección a `/unauthorized`.
- La vista `/mi-cuenta/pedidos` solo debe exponer órdenes del usuario autenticado: se consulta server-side con token de sesión, RLS y filtro explícito por `orders.user_id`.
- `/mi-cuenta/pedidos` permite filtrar por estado y buscar por `external_reference`.
- El estado mostrado en `/mi-cuenta/pedidos` se consolida priorizando `payments.status` (último intento) y usando `orders.status` como respaldo para evitar desfases visuales temporales.
- Cada orden en `/mi-cuenta/pedidos` muestra resumen (referencia, fecha, estado, total, método de pago) y detalle de líneas:
- En el detalle de cada orden de `/mi-cuenta/pedidos` se expone CTA **Consultar pago** que redirige a `/checkout/exito?external_reference=<ref>` para mostrar el resultado de pago canónico de esa compra.
- Las fechas/horas visibles en la aplicación se renderizan en zona horaria fija de México (`America/Mexico_City`) para consistencia entre dispositivos en historial, checkout, cursos y administración.
  - productos desde `orders.metadata.mixed_items_summary.products`,
  - cursos/sesiones desde `order_course_items`,
  - participantes registrados desde `course_participants`.

## Operational Rule
Los cambios en lógica comercial deben reflejarse en este archivo.

- En administración, la carga de imágenes acepta hasta 8MB por archivo.
- En administración, antes de subir al backend, el navegador valida tipo/peso y procesa la imagen (resize proporcional hasta 2000px de lado mayor, export WEBP con calidad configurable y fallback JPEG/PNG).
- El backend conserva validaciones de seguridad de tipo/peso y rechaza mensajes con formato claro para UX.
- Cada imagen subida registra metadatos (`width`, `height`, `size_bytes`, `mime_type`, `original_filename`, `storage_path`) en `public.product_image_uploads`.
- En navegación normal del catálogo, las miniaturas/listados solicitan variantes ligeras (`thumb`) y la variante grande (`detail`) solo se pide al abrir la vista de detalle del producto/curso.
- La variante `original` queda reservada para acciones explícitas de descarga/revisión interna y no participa en cards, listados, carrito o PDP estándar.
