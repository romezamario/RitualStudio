# Payments with Mercado Pago

## Purpose
Documentar integración de pagos con tarjeta y sincronización vía webhook.

## Endpoints in Use
- `POST /api/mercadopago/create-order`
- `POST /api/mercadopago/webhook`
- `POST /api/mercadopago/webhook/prod`
- `POST /api/mercadopago/webhook/test`
- `GET /api/mercadopago/order-summary` (lectura de resumen)
- Endpoint complementario de autenticación: `POST /api/auth/claim-orders` para asociar compras de invitado al usuario autenticado con correo confirmado y auditoría de claim.

## `create-order` Contract (Current)
Payload esperado (resumen):
- `token`: token de tarjeta generado por Brick.
- `payment_method_id`: método de pago de Mercado Pago.
- `transaction_amount`: monto visible en checkout (referencia; backend recalcula y decide monto final).
- `installments`: entero `1..24`.
- `customer_email`: correo del comprador (obligatorio).
- `receipt_email`: correo alterno opcional para comprobante.
- `items`: líneas mixtas del carrito.
  - Producto: `{ kind: "product", slug, quantity }`
  - Curso: `{ kind: "course", slug, quantity, course_session_id }`
- `course_participants` (si hay cursos): mapa/lista por `course_session_id` con exactamente `quantity` nombres por línea.

Respuesta (resumen):
- `external_reference` de la orden local.
- `order_id` interno.
- `payment_status` normalizado (`approved`, `pending`, `rejected`, `error`).
- `redirect`/metadata operativa para UI de éxito.

## Create Order Flow
1. Frontend envía token del Brick + datos de pago y carrito.
2. Backend valida:
   - payload obligatorio,
   - email(s),
   - cuotas,
   - slugs/cantidades,
   - cálculo de monto con catálogo backend (productos + cursos),
   - monto mínimo permitido,
   - participantes por sesión (`course_participants`) con conteo exacto vs `quantity`, nombres no vacíos/mínimo y sin duplicados exactos.
3. Backend crea orden local (`orders`) antes de cobrar, asigna `external_reference` e intenta asociar `orders.user_id` si existe sesión autenticada en checkout.
4. Si hay cursos, backend ejecuta RPC transaccional en Postgres para:
   - validar sesión activa/cupo restante con lock (`FOR UPDATE`) y evitar sobreventa por concurrencia;
   - incrementar `course_sessions.reserved_spots`;
   - persistir `order_course_items` y `course_participants`.
5. Backend llama `POST /v1/payments` de Mercado Pago con `X-Idempotency-Key`.
   - Para crear/consultar pagos (`/v1/payments`, `/v1/payments/{id}`) se usa el SDK oficial `mercadopago/sdk-nodejs` en server-side.
  - Para listados (`/v1/payments/search`) se usa HTTP directo para evitar warnings deprecados del SDK en runtime (Node DEP0169).
   - Si el SDK no está disponible en runtime, `mpApiFetch` conserva fallback HTTP directo para evitar caída total del checkout/webhook.
   - En esa llamada se envía `notification_url` para que Mercado Pago publique eventos de pago al webhook del proyecto.
   - También se envía `additional_info.items[]` con `id`, `title`, `description`, `category_id`, `quantity` y `unit_price` por línea para mejorar score de aprobación y detalle antifraude.
6. Backend actualiza orden/pago en Supabase con respuesta de Mercado Pago.

## Checkout Embebido (Card Payment Brick)
- El script `https://sdk.mercadopago.com/js/v2` se carga una sola vez por sesión en el cliente.
- Al volver a `/checkout` después de una compra, el frontend intenta montar el Brick otra vez si `window.MercadoPago` ya está disponible (sin depender de un segundo `onLoad`).
- El desmontaje del Brick se realiza al salir de la pantalla para evitar controladores duplicados en navegaciones posteriores.
- Si el usuario está autenticado, el checkout muestra el correo prellenado en un campo de solo lectura antes del Brick para que el dato visible coincida con el email enviado en `payer.email`.
- Si hay líneas `kind=course`, checkout renderiza sección **Participantes** y bloquea el envío al Brick hasta capturar `quantity` nombres por sesión.
- El payload del checkout envía `course_participants` por `course_session_id` (también embebido por línea) para reforzar trazabilidad de validación.

## Webhook Validation Flow
- Se valida firma por entorno:
  - `/api/mercadopago/webhook/prod` y `/api/mercadopago/webhook` usan `MP_WEBHOOK_SECRET_PROD`.
  - `/api/mercadopago/webhook/test` usa `MP_WEBHOOK_SECRET_TEST`.
- Se consideran headers de firma + `request-id` + `data.id`.
- Para construir el `manifest` de validación (`id:{data.id};request-id:{x-request-id};ts:{ts};`), `data.id` se normaliza a lowercase cuando contiene caracteres alfanuméricos, alineando el cálculo HMAC con la validación esperada por Mercado Pago.
- En auditoría (`payment_events.payload.signature`) se guardan ambos valores de `data.id`: original y normalizado, para trazabilidad y debugging.
- Existe fallback de validación por hash de `rawBody` para robustez.
- En eventos `payment` aprobados, el envío de comprobante reintenta una segunda lectura corta de la orden (250ms) antes de omitir el email para tolerar consistencia eventual entre upserts y lectura. Si aún no existe, se registra como `info` operativo (no `warning`) para reducir ruido en observabilidad.
- Para el comprobante post-pago por Resend, backend depende de `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (con `EMAIL_FROM` como fallback legacy opcional de compatibilidad).
- El comprobante incluye bloques enriquecidos visibles por defecto (resumen rápido + siguiente paso) y CTA condicionales para: revisar compras (`/mi-cuenta/pedidos`), visitar el sitio y links de redes sociales si se configuraron variables `EMAIL_*` correspondientes.
- La URL base para CTAs se resuelve priorizando `SITE_URL` (server-side) y como fallback `NEXT_PUBLIC_SITE_URL`, para evitar correos con formato legacy cuando falta configuración pública en runtime backend.
- Si no valida firma:
  - Se registra auditoría mínima en `payment_events` (`signature`, `webhook_processing` y `audit.ignored_reason="invalid_signature"`).
  - Se responde **HTTP 401** y se corta la ejecución antes de consultar APIs de MP o reconciliar pagos/cupos.

## Persistence Strategy
- Tabla `orders`: referencia externa, estado, total, metadata y raw response.
- `orders.payment_confirmation_email_sent_at` (nullable) funciona como marca principal anti-duplicado para confirmación por email; si ya tiene valor, el webhook omite el envío y solo actualiza bitácora en metadata.
- `orders.metadata.email_confirmation` se mantiene como bitácora extendida (attempts, last_attempt_at, errores/proveedor), pero la decisión idempotente de envío se basa primero en la columna persistente.
- Cuando el envío resulta `ok` (incluye `skipped` controlado del proveedor), se persisten en la misma actualización tanto `metadata.email_confirmation` como `payment_confirmation_email_sent_at=now()`.
- Tabla `payments`: id de pago MP, método (`payment_method`), tipo de método (`payment_method_type`), estado, monto y raw response.
- En webhook, al hacer upsert de `payments`, se debe mantener `order_id` (UUID interno) resolviendo primero la orden por `mercado_pago_order_id`; esto asegura que vistas de cuenta (que consultan `payments` por `order_id`) puedan mostrar el método de pago incluso cuando la actualización proviene solo del webhook.
- Tabla `payment_events`: auditoría operativa del webhook en `payload` (firma validada, snapshots MP, reconciliación de cupos y resultado de procesamiento).
- Tabla `order_claim_events`: auditoría de vinculación de órdenes de invitado a cuenta autenticada (quién, cómo y cuándo).
- `orders.metadata` incluye `mixed_items_summary` (productos + cursos + participantes) para trazabilidad de checkout mixto.
- Para líneas de curso, la persistencia de `order_course_items` y `course_participants` se realiza en una operación transaccional vía RPC.
- Estrategia de upsert en webhook para idempotencia y convergencia de estado.
- Política de liberación de cupo:
  - en `create-order`, si MP responde `rejected` o `cancelled`, se ejecuta RPC de liberación inmediata;
  - en webhook, si llega estado final `rejected`/`cancelled`/`expired`, se vuelve a ejecutar liberación idempotente por seguridad (aunque create-order ya haya liberado);
  - en webhook, si llega `approved`, se marca confirmación operativa en metadata de `order_course_items` para trazabilidad de reserva definitiva;
  - la liberación marca metadata (`capacity_released`) para evitar doble decremento.
- Dedupe de notificaciones webhook:
  - se usa `event_key` como llave de idempotencia;
  - `event_key` normaliza `data.id` en lowercase (si contiene caracteres alfanuméricos) para evitar duplicados por diferencias de mayúsculas/minúsculas;
  - si llega la misma notificación repetida y ya está `processed=true`, se evita reprocesar y solo se incrementa contador de duplicados en `payment_events.payload`.

## Payment State Model & Reconciliation
- Estado de UI y negocio convergen a 4 estados: `approved`, `pending`, `rejected`, `error`.
- Fuente de verdad final: webhook + consulta backend a Mercado Pago (no frontend).
- En `mi-cuenta/pedidos`, el estado visible al usuario se consolida con prioridad de `payments.status` y fallback a `orders.status` para reflejar antes las acreditaciones cuando el webhook actualiza pagos primero.
- Reconciliación de órdenes:
  - órdenes `pending` sin confirmación en ventana esperada se re-evalúan por proceso de reconciliación;
  - si el estado final converge a rechazo/cancelación/expiración, se asegura liberación de cupo idempotente;
  - si converge a `approved`, se conserva reserva como cupo consumido y se mantiene trazabilidad en `payment_events`.
- Objetivo operativo: evitar tanto sobreventa (falta de reserva) como subutilización de cupo (falta de liberación).

## Critical Security Rules
- `MP_ACCESS_TOKEN_PROD` solo backend.
- `MP_ACCESS_TOKEN_TEST` solo backend (exclusivo para endpoint de pruebas del webhook).
- `MP_NOTIFICATION_URL_PROD` y `MP_NOTIFICATION_URL_TEST` solo backend; definen el endpoint absoluto que se envía como `notification_url` según entorno.
- `MP_NOTIFICATION_URL` se mantiene como fallback legacy opcional para retrocompatibilidad.
- La public key del checkout client-side también se resuelve por `payments_mode`: `MP_PUBLIC_KEY_PROD` en `prod` y `MP_PUBLIC_KEY_TEST` en `test`.
- Estado final de pago lo determina backend/webhook, nunca solo frontend.
- No aceptar monto final calculado en cliente.


## Política de reintentos del webhook (operativa actual)
- **Objetivo**: combinar idempotencia (`event_key`) con recuperación confiable según criticidad.
- **Criterio 1 — Falla crítica de infraestructura/auditoría mínima**: se responde **HTTP 5xx** para que Mercado Pago reintente.
  - Ejemplo: no se puede crear/actualizar `payment_events` al inicio (sin rastro auditable del evento).
  - `payment_events.payload.webhook_processing.status = "waiting_mp_retry"` cuando exista registro previo; si ni siquiera se pudo persistir el evento inicial, el 5xx igualmente fuerza retry de MP.
- **Criterio 2 — Falla transitoria de procesamiento interno**: se responde **HTTP 200** y se activa reproceso interno asíncrono.
  - Ejemplos: timeout/intermitencia al consultar MP o al reconciliar entidades internas luego de persistir evento.
  - Estado: `payment_events.payload.webhook_processing.status = "pending_internal_retry"`.
  - Señales operativas: `retry_policy = "internal-retry-200"`, `retry_after_seconds`, y `operational_alert.required=true`.
- **Criterio 3 — Falla no reintetable por MP**: se responde sin retry externo.
  - Ejemplos:
    - JSON inválido → **HTTP 200** (`ignored: invalid-json`).
    - Firma inválida → **HTTP 401** con auditoría mínima persistida.
  - Estado: `payment_events.payload.webhook_processing.status = "failed_non_retryable"`.

Estados de `webhook_processing` usados por el sistema:
- `completed`: procesamiento finalizado correctamente.
- `pending_internal_retry`: requiere reproceso interno garantizado (cola/job async).
- `waiting_mp_retry`: se devolvió 5xx para que MP reintente.
- `failed_non_retryable`: falla definitiva que no mejora con retry de MP.

## Pending / TODO
- Documentar job automático de reconciliación para órdenes pendientes sin confirmación webhook en ventana esperada.


## Modo de pago y verificación conmutable (superusuario)
- El checkout resuelve modo activo desde `public.app_settings` (`payments_mode`).
- `payments_mode=test` usa `MP_ACCESS_TOKEN_TEST`, `MP_NOTIFICATION_URL_TEST`, `MP_WEBHOOK_SECRET_TEST` y `MP_PUBLIC_KEY_TEST`.
- En `payments_mode=test`, `create-order` etiqueta cada cobro con prefijo `[TEST]` en `description` y genera `external_reference` con segmento `ritual-test-*`. En `payments_mode=prod` no se agrega prefijo visible al usuario en la descripción del pago.
- En `payments_mode=test`, si `create-order` enfrenta un error interno (`5xx`) después de crear la orden local, se activa un fallback para pruebas: la orden se conserva con `status="approved"` y metadata `fallback_reason="test_mode_500_bypass"` (incluye `fallback_simulated_success=true` y `fallback_payment_id`) para permitir que checkout continúe al flujo de éxito y validar procesos posteriores (como correo) sin bloquear QA por fallas transitorias de registro.
- Durante ese bypass de `payments_mode=test`, `create-order` intenta enviar inmediatamente el comprobante por email con `fallback_payment_id`. Si falla el proveedor o faltan datos, deja `metadata.email_confirmation.status="pending_email_retry"` + `next_retry_at` para que el endpoint interno de reproceso complete el envío sin intervención manual.
- `payments_mode=prod` usa `MP_ACCESS_TOKEN_PROD`, `MP_NOTIFICATION_URL_PROD`, `MP_WEBHOOK_SECRET_PROD` y `MP_PUBLIC_KEY_PROD`.
- Solo superusuario (correo incluido en `SUPERUSER_EMAILS`) puede cambiar modo desde `/admin/pagos`.
- En `/admin/pagos`, la sección de verificación incluye al final un listado paginado de pagos recientes (bloques de 10) ordenado de más reciente a más antiguo vía `/v1/payments/search` de Mercado Pago.
- El historial visible en `/admin/pagos` muestra únicamente pagos cuya `external_reference` inicia con `ritual`, ocultando cobros sin referencia de Ritual Studio.


## Guardas de entorno y seguridad
- Antes de crear pagos se ejecuta una validación de entorno que compara public key y access token para evitar mezcla `TEST`/`APP_USR`.
- Si la configuración es inválida, el backend responde `500` y no ejecuta llamadas a la API de Mercado Pago.
- El checkout cliente valida formato de public key antes de montar Brick y emite warnings de diagnóstico sin exponer secretos.

## Reproceso interno de emails de confirmación (consistencia eventual)

Para evitar pérdida de confirmación cuando el webhook acredita el pago antes de que la orden tenga metadata completa (`items`, email o referencia), el sistema **no revierte** el pago y agenda reintento de email.

- En webhook (`trySendPurchaseEmail`), si faltan datos de envío:
  - `orders.metadata.email_confirmation.status = "pending_email_retry"`
  - `orders.metadata.email_confirmation.next_retry_at = <ISO timestamp>`
  - `orders.metadata.email_confirmation.last_attempt_at`, `attempts`, `error`
- El pago permanece `approved`; este flujo no debe mutar `orders.status` fuera de la sincronización de pago.

### Endpoint interno

- `POST /api/internal/mercadopago/retry-purchase-email`
- Autenticación: `Authorization: Bearer <MP_EMAIL_RETRY_SECRET>`.
- Selecciona órdenes `approved` con:
  - `payment_confirmation_email_sent_at IS NULL`
  - `metadata.email_confirmation.status = pending_email_retry`
  - `metadata.email_confirmation.next_retry_at <= now()`
- Reintenta `sendPurchaseConfirmationEmail` con backoff exponencial y límite de intentos.
- Registra en metadata:
  - `attempts`
  - `last_attempt_at`
  - `last_error`/`error`
  - `next_retry_at`
  - `status` (`pending_email_retry`, `sent`, `failed_final`, `skipped`)

### Política de reintentos (email)

- Base: 5 minutos.
- Backoff: exponencial hasta 6 horas por intento.
- Máximo: 5 intentos.
- Al alcanzar el máximo: `status = failed_final` y sin nueva programación.

- Se agrega operación administrativa `GET/PATCH /api/admin/orders` para lectura y actualización manual de estado logístico en pedidos de productos.
- Notificaciones operativas por email: al transicionar a `en_reparto` se notifica entrega durante el día; al transicionar a `entregado` se confirma entrega final.

## Verificación operativa de credenciales de prueba (auditado: 2026-05-03)

Resultado de revisión del código:

- El backend elige credenciales por `payments_mode`: en `test` usa `MP_ACCESS_TOKEN_TEST` y en `prod` usa `MP_ACCESS_TOKEN_PROD`.
- El frontend de checkout también separa llaves públicas por modo (`MP_PUBLIC_KEY_TEST` / `MP_PUBLIC_KEY_PROD`).
- Antes de llamar a API de Mercado Pago en `create-order`, se valida que public key y access token pertenezcan al mismo entorno (`TEST-` o `APP_USR-`).
- Las llamadas a API usan `Authorization: Bearer <token>` por header (no query param).
- El token se sanea para remover prefijo `Bearer` accidental en variables de entorno, evitando errores de configuración.

Checklist para confirmar uso correcto en pruebas:

1. Configurar `payments_mode=test` en la fuente activa del modo de pago.
2. Cargar `MP_PUBLIC_KEY_TEST` y `MP_ACCESS_TOKEN_TEST` con prefijo `TEST-`.
3. Verificar `MP_NOTIFICATION_URL_TEST` apuntando a `/api/mercadopago/webhook/test`.
4. Confirmar `MP_WEBHOOK_SECRET_TEST` configurado para firma del endpoint de pruebas.
5. Evitar mezclar variables `*_PROD` con `payments_mode=test` (el backend ya lo bloquea con validación de entorno).
