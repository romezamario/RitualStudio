# Troubleshooting

## Build/Lint

### Error: `next: not found`
**Causa frecuente:** dependencias no instaladas en entorno actual.

**Acciones:**
1. Ejecutar `npm install`.
2. Reintentar `npm run lint` / `npm run build`.

---

## Supabase Auth

### Error de conexión al login/registro
**Síntoma:** mensajes de `Failed to fetch` o no conecta a Supabase.

**Revisión rápida:**
- `NEXT_PUBLIC_SUPABASE_URL` con formato correcto (URL base, sin endpoint extra).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o fallback anon) definido.
- Entorno con conectividad saliente.

### Callback de confirmación o recuperación no funciona
**Revisión rápida:**
- `NEXT_PUBLIC_SITE_URL` configurado correctamente por ambiente.
- Templates de email en Supabase apuntando a `/auth/callback`.

---

## Mercado Pago

### `401 Unauthorized` al crear pago
**Revisión rápida:**
- `MP_ACCESS_TOKEN` válido y sin prefijo `Bearer`.
- Coincidencia de entorno entre `MP_ACCESS_TOKEN` y `NEXT_PUBLIC_MP_PUBLIC_KEY`.

### El frontend muestra estado distinto al real
**Regla:** tomar como fuente final el estado consolidado por backend/webhook.

### Webhook sin efecto en órdenes
**Revisión rápida:**
- `MP_WEBHOOK_SECRET` configurado.
- Endpoint público accesible.
- Revisar logs del route handler y respuestas HTTP.

---

## Supabase Admin / Storage

### Error al guardar productos/órdenes desde backend
**Revisión rápida:**
- `SUPABASE_SERVICE_ROLE_KEY` presente en entorno server.
- Migraciones requeridas aplicadas (tablas/policies esperadas).

### Bucket de imágenes no disponible
**Revisión rápida:**
- `SUPABASE_PRODUCT_IMAGES_BUCKET` configurado.
- Bucket existente en Supabase Storage y políticas acordes.

---

## Documentation Drift

### El cambio funciona pero docs no reflejan comportamiento
**Acción obligatoria:**
1. Actualizar archivos en `/docs` según impacto.
2. Ajustar resumen en `README.md`.
3. Mantener `AGENTS.md` solo con reglas operativas.
