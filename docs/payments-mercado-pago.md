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
   - cálculo de monto con catálogo backend,
   - monto mínimo permitido.
3. Backend llama `POST /v1/payments` de Mercado Pago con idempotency key.
4. Backend persiste datos de orden/pago en Supabase (si hay conectividad y credenciales).

## Checkout Embebido (Card Payment Brick)
- El script `https://sdk.mercadopago.com/js/v2` se carga una sola vez por sesión en el cliente.
- Al volver a `/checkout` después de una compra, el frontend intenta montar el Brick otra vez si `window.MercadoPago` ya está disponible (sin depender de un segundo `onLoad`).
- El desmontaje del Brick se realiza al salir de la pantalla para evitar controladores duplicados en navegaciones posteriores.
- Si el usuario está autenticado, el checkout muestra el correo prellenado en un campo de solo lectura antes del Brick para que el dato visible coincida con el email enviado en `payer.email`.

## Webhook Validation Flow
- Se valida firma usando `MP_WEBHOOK_SECRET`.
- Se consideran headers de firma + `request-id` + `data.id`.
- Existe fallback de validación por hash de `rawBody` para robustez.
- Si no valida firma, el evento se rechaza lógicamente (ver logs y troubleshooting).

## Persistence Strategy
- Tabla `orders`: referencia externa, estado, total, metadata y raw response.
- Tabla `payments`: id de pago MP, método, estado, monto y raw response.
- Estrategia de upsert en webhook para idempotencia y convergencia de estado.

## Critical Security Rules
- `MP_ACCESS_TOKEN` solo backend.
- `NEXT_PUBLIC_MP_PUBLIC_KEY` solo para inicialización del checkout client-side.
- Estado final de pago lo determina backend/webhook, nunca solo frontend.
- No aceptar monto final calculado en cliente.

## Pending / TODO
- Definir formalmente política de reintentos y alertamiento de fallas webhook.
- Documentar playbook de conciliación manual por referencia externa.
