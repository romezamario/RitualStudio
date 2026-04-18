# AGENTS.md

## Propósito
Este archivo documenta **lo aprendido en cada cambio del sitio** y define una guía operativa para que cada Pull Request (PR) deje trazabilidad técnica y funcional.

---

## Reglas obligatorias para cada cambio

1. **Siempre generar pruebas**
   - Cada cambio debe incluir al menos una validación comprobable:
     - Pruebas automatizadas (unitarias/integración/e2e), o
     - Evidencia de pruebas manuales estructuradas cuando no aplique automatización.
   - Ningún cambio se considera completo sin sección de pruebas.

2. **Siempre actualizar `AGENTS.md`**
   - Registrar qué se aprendió durante el cambio.
   - Registrar decisiones técnicas, riesgos y próximos pasos.

3. **Siempre actualizar `README.md`**
   - Documentar cambios funcionales/técnicos incorporados al sitio.
   - Incluir instrucciones de uso o mantenimiento cuando corresponda.

---

## Estructura evolutiva de este archivo

> Esta estructura debe crecer con cada PR.

### 1) Resumen del cambio
- **PR/ID:**
- **Fecha:**
- **Autor:**
- **Objetivo del cambio:**

### 2) Lo aprendido
- **Aprendizaje principal:**
- **Aprendizajes secundarios:**
- **Qué no funcionó y por qué:**

### 3) Decisiones técnicas
- **Decisiones tomadas:**
- **Alternativas evaluadas:**
- **Razón de la decisión final:**

### 4) Riesgos y mitigaciones
- **Riesgos identificados:**
- **Mitigaciones aplicadas:**
- **Pendientes:**

### 5) Evidencia de pruebas
- **Tipo de prueba:**
- **Resultado esperado:**
- **Resultado obtenido:**
- **Evidencia (logs/capturas/enlaces):**

### 6) Impacto en documentación
- **Se actualizó README:** Sí / No
- **Se actualizó AGENTS:** Sí / No
- **Notas de documentación:**

---

## Plantilla de registro por PR (copiar y completar)

```md
## PR: <id-o-título>
- Fecha:
- Objetivo:

### Lo aprendido
- 

### Decisiones técnicas
- 

### Pruebas
- Tipo:
- Resultado:
- Evidencia:

### Documentación
- README actualizado: Sí/No
- AGENTS actualizado: Sí/No
- Notas:
```

---

## Definición de “Done” (DoD)
Un PR se considera terminado solo si:
- [ ] Incluye pruebas ejecutadas y reportadas.
- [ ] Incluye actualización en `AGENTS.md`.
- [ ] Incluye actualización en `README.md`.
- [ ] Explica claramente el aprendizaje y el impacto del cambio.

---

## PR: Starter Next.js para florería elevada
- Fecha: 2026-04-18
- Objetivo: Iniciar la base del sitio en Next.js con arquitectura lista para desplegar en Vercel desde GitHub.

### Lo aprendido
- Una base con App Router y páginas de servicio desde el inicio acelera validación comercial sin entrar de inmediato a ecommerce completo.
- En este entorno, `create-next-app` puede fallar por políticas del registry; conviene tener un fallback manual de scaffolding.
- Definir desde el inicio navegación y tono editorial ayuda a mantener coherencia de marca “premium”.

### Decisiones técnicas
- Se eligió Next.js + TypeScript + Tailwind para alineación nativa con Vercel y velocidad de iteración.
- Se creó un `SiteShell` reutilizable para evitar duplicación entre páginas iniciales.
- Se priorizó un starter orientado a captación de leads (página `/custom`) en vez de checkout completo.

### Pruebas
- Tipo: Validación manual estructurada + checks de sintaxis en configuración.
- Resultado: Estructura base creada y archivos de configuración válidos; instalación automática bloqueada por política de npm del entorno.
- Evidencia:
  - Error `E403 Forbidden` al ejecutar `npx create-next-app@latest ...`.
  - `node --check eslint.config.mjs` OK.
  - `node --check postcss.config.mjs` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Queda pendiente correr `npm install && npm run lint && npm run build` en un entorno con acceso al registry.
