# Business Rules

## Purpose
Reglas funcionales de negocio actuales del flujo comercial de Ritual Studio.

## Catalog & Product Rules
- El catálogo expone productos por `slug` como identificador funcional.
- El checkout no confía en precios enviados por frontend: recalcula usando catálogo backend.
- Cada línea de compra debe incluir `slug` válido y `quantity` entera.

## Cart & Checkout Rules
- Cantidad por producto permitida: mínimo 1, máximo 10.
- El checkout exige al menos un producto.
- El monto mínimo para pago con tarjeta en checkout: **$10 MXN**.
- Email del comprador es obligatorio y debe ser válido.
- Email alterno de comprobante es opcional, pero si se envía debe ser válido.
- Cuotas (`installments`) permitidas: 1 a 24.

## Order Lifecycle (Current)
- Al crear orden de pago se genera `external_reference` único.
- Se intenta persistir orden y pago en Supabase tras respuesta de Mercado Pago.
- El webhook vuelve a sincronizar/actualizar estado para consistencia operativa.
- Estados normalizados para UI: `approved`, `pending`, `rejected`, `error`.

## Account & Role Rules
- Roles vigentes: `user` y `admin`.
- Rutas `/admin/*` requieren sesión válida y rol admin.
- Si no hay sesión: redirección a login con redirect.
- Si hay sesión sin privilegios admin: redirección a `/unauthorized`.

## Operational Rule
Los cambios en lógica comercial deben reflejarse en este archivo.
