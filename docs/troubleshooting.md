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

### Inconsistencia de cupo (course_sessions.reserved_spots) vs estado de pago
**Síntoma:** la orden quedó `rejected/cancelled/expired` pero cupo sigue reservado, o pago `approved` y no hay trazabilidad de confirmación.

**Playbook manual de reconciliación:**
1. Identificar la orden local por `orders.mercado_pago_order_id`.
2. Revisar `payment_events` más recientes de esa orden y validar en `payload`:
   - `webhook_processing.processed`,
   - `audit.reconciliations`,
   - `duplicate_notifications`.
3. Verificar líneas en `order_course_items` y metadata:
   - `capacity_released`,
   - `capacity_released_reason`,
   - `capacity_confirmed`.
4. Consultar estado final real en Mercado Pago (`approved`, `rejected`, `cancelled`, `expired`).
5. Si el estado final **no aprobado**, ejecutar RPC:
   - `select public.release_course_capacity_for_order('<order_id_uuid>', 'manual-reconciliation');`
6. Si el estado final es **approved**, no decrementar `reserved_spots`; solo asegurar metadata de confirmación (`capacity_confirmed=true`) en `order_course_items`.
7. Registrar incidente operativo (fecha/hora, `order_id`, estado MP, acción aplicada y evidencia de query) para trazabilidad.

**Notas de seguridad:**
- La liberación es idempotente (no debe decrementar dos veces si `capacity_released=true`).
- No confiar en estado de frontend; reconciliar siempre contra backend/webhook + API MP.

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

### Tarjetas de cursos muestran imagen rota
**Síntoma:** en `/cursos` aparece el ícono de imagen rota cuando un curso no tiene `image_url` cargada.

**Causa frecuente:** `image_url` vacío (`""`) termina construyendo una URL de render de Storage inválida en vez de usar fallback local.

**Revisión rápida:**
- Confirmar en `courses.image_url` si el valor viene vacío/null.
- Verificar que el frontend use fallback local (`/images/logo.png`) cuando `image_url` no tenga contenido.

### En admin de cursos no se guarda la imagen al seleccionar archivo
**Nota de validación actual:** el backend acepta imágenes hasta 8MB y, si pesan más de 2MB, devuelve aviso de optimización automática para catálogo.
**Síntoma:** en `/admin/cursos`, después de seleccionar imagen y guardar, el curso sigue sin `image_url`.

**Causa frecuente:** el archivo no cumple las reglas del endpoint de carga (se reutiliza el mismo endpoint de productos).

**Revisión rápida:**
- Verificar formato permitido: `JPG`, `PNG`, `WEBP` o `AVIF` (HEIC/HEIF no se aceptan).
- Confirmar tamaño máximo (`<= 4MB`; para `PNG`, recomendado `<= 2MB`).
- Revisar la respuesta de `POST /api/admin/products/upload-image` y confirmar que llegue `data.image`.
- Validar que en la actualización del curso (`POST/PUT /api/admin/courses*`) se envíe `imageUrl` con el path recibido.

---

## Documentation Drift

### El cambio funciona pero docs no reflejan comportamiento
**Acción obligatoria:**
1. Actualizar archivos en `/docs` según impacto.
2. Ajustar resumen en `README.md`.
3. Mantener `AGENTS.md` solo con reglas operativas.
