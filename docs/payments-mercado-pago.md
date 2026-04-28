# Payments with Mercado Pago

## Purpose
Documentar integración de pagos con tarjeta y sincronización vía webhook.

## Endpoints in Use
- `POST /api/mercadopago/create-order`
- `POST /api/mercadopago/webhook`
- `GET /api/mercadopago/order-summary` (lectura de resumen)

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
6. Backend actualiza orden/pago en Supabase con respuesta de Mercado Pago.

## Checkout Embebido (Card Payment Brick)
- El script `https://sdk.mercadopago.com/js/v2` se carga una sola vez por sesión en el cliente.
- Al volver a `/checkout` después de una compra, el frontend intenta montar el Brick otra vez si `window.MercadoPago` ya está disponible (sin depender de un segundo `onLoad`).
- El desmontaje del Brick se realiza al salir de la pantalla para evitar controladores duplicados en navegaciones posteriores.
- Si el usuario está autenticado, el checkout muestra el correo prellenado en un campo de solo lectura antes del Brick para que el dato visible coincida con el email enviado en `payer.email`.
- Si hay líneas `kind=course`, checkout renderiza sección **Participantes** y bloquea el envío al Brick hasta capturar `quantity` nombres por sesión.
- El payload del checkout envía `course_participants` por `course_session_id` (también embebido por línea) para reforzar trazabilidad de validación.

## Webhook Validation Flow
- Se valida firma usando `MP_WEBHOOK_SECRET`.
- Se consideran headers de firma + `request-id` + `data.id`.
- Existe fallback de validación por hash de `rawBody` para robustez.
- Si no valida firma, el evento se rechaza lógicamente (ver logs y troubleshooting).

## Persistence Strategy
- Tabla `orders`: referencia externa, estado, total, metadata y raw response.
- Tabla `payments`: id de pago MP, método, estado, monto y raw response.
- Tabla `payment_events`: auditoría operativa del webhook en `payload` (firma validada, snapshots MP, reconciliación de cupos y resultado de procesamiento).
- `orders.metadata` incluye `mixed_items_summary` (productos + cursos + participantes) para trazabilidad de checkout mixto.
- Para líneas de curso, la persistencia de `order_course_items` y `course_participants` se realiza en una operación transaccional vía RPC.
- Estrategia de upsert en webhook para idempotencia y convergencia de estado.
- Política de liberación de cupo:
  - en `create-order`, si MP responde `rejected` o `cancelled`, se ejecuta RPC de liberación inmediata;
  - en webhook, si llega estado final `rejected`/`cancelled`/`expired`, se vuelve a ejecutar liberación idempotente;
  - en webhook, si llega `approved`, se marca confirmación operativa en metadata de `order_course_items` para trazabilidad de reserva definitiva;
  - la liberación marca metadata (`capacity_released`) para evitar doble decremento.
- Dedupe de notificaciones webhook:
  - se usa `event_key` como llave de idempotencia;
  - si llega la misma notificación repetida y ya está `processed=true`, se evita reprocesar y solo se incrementa contador de duplicados en `payment_events.payload`.

## Critical Security Rules
- `MP_ACCESS_TOKEN` solo backend.
- `NEXT_PUBLIC_MP_PUBLIC_KEY` solo para inicialización del checkout client-side.
- Estado final de pago lo determina backend/webhook, nunca solo frontend.
- No aceptar monto final calculado en cliente.

## Pending / TODO
- Documentar job automático de reconciliación para órdenes pendientes sin confirmación webhook en ventana esperada.
- Definir política de reintentos y alertamiento de fallas webhook.
