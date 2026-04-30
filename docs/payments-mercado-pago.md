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
   - En esa llamada se envía `notification_url` para que Mercado Pago publique eventos de pago al webhook del proyecto.
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
- Existe fallback de validación por hash de `rawBody` para robustez.
- Si no valida firma, el evento se rechaza lógicamente (ver logs y troubleshooting).

## Persistence Strategy
- Tabla `orders`: referencia externa, estado, total, metadata y raw response.
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
- `MP_PUBLIC_KEY_PROD` solo para inicialización del checkout client-side.
- Estado final de pago lo determina backend/webhook, nunca solo frontend.
- No aceptar monto final calculado en cliente.

## Pending / TODO
- Documentar job automático de reconciliación para órdenes pendientes sin confirmación webhook en ventana esperada.
- Definir política de reintentos y alertamiento de fallas webhook.
