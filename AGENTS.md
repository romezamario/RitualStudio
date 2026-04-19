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

## PR: Fix de build en Vercel por plugin PostCSS faltante
- Fecha: 2026-04-18
- Objetivo: Desbloquear `npm run build` en Vercel eliminando la dependencia de un plugin PostCSS no disponible en el entorno de instalación actual.

### Lo aprendido
- Cuando `postcss.config.mjs` referencia un plugin no instalado (en este caso `@tailwindcss/postcss`), Next.js falla en fase de webpack antes de compilar páginas.
- Mantener un fallback CSS sin dependencia de PostCSS permite priorizar disponibilidad del deploy aunque se pierdan utilidades de Tailwind temporalmente.
- Para evitar regresiones de diseño, conviene planificar un PR posterior que reinstale pipeline Tailwind completo en un entorno con acceso al registry.

### Decisiones técnicas
- Se reemplazó la configuración de PostCSS para no cargar plugins externos durante build.
- Se removió `@import "tailwindcss";` de `globals.css` para evitar procesamiento CSS dependiente de Tailwind/PostCSS.
- Se mantuvieron estilos base custom existentes para preservar legibilidad funcional del sitio.

### Pruebas
- Tipo: Validación manual estructurada + checks de sintaxis.
- Resultado: Configuración PostCSS queda libre de imports de plugins no instalados; archivos actualizados sin errores de parseo.
- Evidencia:
  - `node --check postcss.config.mjs` OK.
  - `npm run build` no se pudo ejecutar en este entorno porque no están instaladas dependencias (`next: not found`).

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documenta mitigación temporal y siguiente paso recomendado para restaurar Tailwind completo cuando se habilite instalación de paquetes.

## PR: Rediseño editorial inspirado en averycoxdesign.com/home
- Fecha: 2026-04-18
- Objetivo: Rediseñar la experiencia visual de Ritual Studio con una dirección artística más editorial manteniendo el enfoque comercial en venta de arreglos florales.

### Lo aprendido
- Una dirección visual cálida (paleta beige/café), combinada con tipografía serif dominante, transmite mejor la percepción de estudio premium que una interfaz oscura genérica.
- Al no depender de Tailwind en build actual, centralizar estilos en `globals.css` permite cambios amplios de UI con menor fricción técnica.
- Un shell único con CTA persistente mejora continuidad de navegación y reduce inconsistencias entre páginas de servicio.

### Decisiones técnicas
- Se refactorizó `SiteShell` para incorporar cabecera tipo cápsula, navegación contextual y hero reusable.
- Se crearon clases CSS reutilizables (`studio-card`, `feature-grid`, `split-panel`, `studio-form`) para alinear todas las vistas bajo un único sistema visual.
- Se ajustó el copy principal de cada ruta para reforzar narrativa de estudio floral editorial y no tienda masiva.

### Pruebas
- Tipo: Validación estructurada + checks de configuración (limitada por dependencias no instaladas).
- Resultado: Los checks de sintaxis sobre configuración pasaron; no fue posible ejecutar lint/build de Next.js por falta de binario `next` en el entorno.
- Evidencia:
  - `npm run lint` falla con `next: not found`.
  - `node --check postcss.config.mjs` OK.
  - `node --check eslint.config.mjs` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se agregó sección específica del rediseño en README y trazabilidad completa de decisiones en este archivo.

## PR: Ajuste de paleta visual basado en identidad de Ritual Studio
- Fecha: 2026-04-18
- Objetivo: Alinear la interfaz del sitio con la paleta de 4 tonos del brandboard compartido (rosa niebla, arena, gris humo y carbón) para lograr una composición más armónica y coherente con el logo.

### Lo aprendido
- Traducir una paleta de branding a variables CSS globales facilita mantener consistencia visual en todas las rutas sin tocar cada página por separado.
- Incluir muestras visibles de color en el header ayuda a reforzar el sistema gráfico sin recargar la interfaz.
- El contraste en tonos neutros funciona mejor cuando botones y bordes usan niveles distintos de la misma familia cromática.

### Decisiones técnicas
- Se reemplazó la base cromática anterior por tokens CSS derivados de la imagen de los 4 círculos para controlar fondo, paneles, textos y acentos.
- Se ajustó el componente `SiteShell` para incorporar lockup textual de marca (`Ritual Studio / by Sol`) y una mini guía visual de paleta en navegación.
- Se mantuvo la estructura de páginas existente para limitar el alcance al lenguaje visual y evitar cambios funcionales innecesarios.

### Pruebas
- Tipo: Validación manual estructurada + checks de sintaxis.
- Resultado: Los archivos de configuración revisados pasan sintaxis; lint de Next.js no ejecuta por ausencia del binario `next` en el entorno.
- Evidencia:
  - `npm run lint` falla con `next: not found`.
  - `node --check postcss.config.mjs` OK.
  - `node --check eslint.config.mjs` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documentó que el cambio es visual y se dejó trazabilidad de limitaciones de pruebas por dependencias no instaladas.

## PR: Menú hamburguesa para navegación mobile
- Fecha: 2026-04-18
- Objetivo: Mejorar la experiencia de navegación en pantallas pequeñas reemplazando el menú horizontal saturado por un patrón hamburguesa más limpio y usable.

### Lo aprendido
- En este diseño editorial, forzar navegación completa en una sola línea en mobile rompe legibilidad y compite con el branding del header.
- Mantener el botón CTA dentro del panel desplegable reduce ruido visual inicial sin perder conversión.
- Cerrar el menú al navegar evita estados abiertos accidentales entre rutas y mejora la sensación de control.

### Decisiones técnicas
- Se convirtió `SiteShell` en Client Component para manejar el estado `isMenuOpen` del menú hamburguesa.
- Se implementó botón accesible con `aria-expanded`, `aria-controls` y etiquetas dinámicas abrir/cerrar.
- Se resolvió el comportamiento responsive en `globals.css`: menú y acciones ocultas por defecto en mobile y visibles al activar estado `is-open`.

### Pruebas
- Tipo: Pruebas automatizadas de calidad + validación manual estructurada.
- Resultado: `npm run lint` pasa; `npm run build` falla por bloqueo de red al descargar fuentes de Google Fonts en este entorno. Además se validó lógicamente el flujo abrir/cerrar/click en links para cierre de menú.
- Evidencia:
  - `npm run lint` OK.
  - `npm run build` falla con `Failed to fetch font 'Inter'` y `Failed to fetch font 'Playfair Display'` desde `fonts.googleapis.com`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Cambio enfocado en UX mobile, sin alterar contenido ni rutas de negocio.

## PR: Imágenes de ejemplo para diseño del sitio web
- Fecha: 2026-04-18
- Objetivo: Incorporar referencias visuales reales al sitio para facilitar validación estética y narrativa del diseño floral editorial.

### Lo aprendido
- Mostrar imágenes de referencia directamente en el producto acelera la conversación de diseño con cliente y reduce ambigüedad frente a descripciones solo textuales.
- Integrar `next/image` evita warnings de rendimiento de `next lint` y prepara mejor la transición a assets definitivos.
- Es útil separar explícitamente "moodboard temporal" de catálogo final para que el equipo no confunda referencias con contenido definitivo.

### Decisiones técnicas
- Se agregaron imágenes de Unsplash como referencias temporales en Home y en las tarjetas de `/arreglos`.
- Se usó `next/image` (en vez de `<img>`) para mantener optimización nativa y evitar alertas de calidad.
- Se conservaron estilos editoriales existentes y se añadieron clases (`reference-gallery`, `reference-grid`, `reference-item`, `card-image`) para encapsular el nuevo bloque visual.

### Pruebas
- Tipo: Pruebas automatizadas de calidad + build de producción con limitación de red.
- Resultado: `npm run lint` pasa sin errores; `npm run build` vuelve a fallar por imposibilidad de descargar Google Fonts desde `fonts.googleapis.com` en este entorno.
- Evidencia:
  - `npm run lint` OK.
  - `npm run build` falla con `Failed to fetch font 'Inter'` y `Failed to fetch font 'Playfair Display'`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documenta que las imágenes actuales son de referencia para diseño y pueden reemplazarse por fotografía propia en una iteración posterior.

## PR: Botón de WhatsApp configurable
- Fecha: 2026-04-19
- Objetivo: Agregar un botón "Contáctanos" que abra WhatsApp y dejar el número configurable para cambios rápidos sin tocar código.

### Lo aprendido
- Un CTA único en cabecera hacia WhatsApp simplifica la intención de contacto y reduce fricción para leads móviles.
- Usar variables `NEXT_PUBLIC_*` permite configuración operativa desde entorno (Vercel/local) sin redeploy de cambios de código por cada cambio de número.
- Conviene sanitizar el número para tolerar formatos con espacios, guiones o paréntesis al construir `wa.me`.

### Decisiones técnicas
- Se reemplazó el botón secundario del header por un anchor externo a `https://wa.me/<numero>` con `target="_blank"` y `rel="noopener noreferrer"`.
- Se definió `NEXT_PUBLIC_WHATSAPP_NUMBER` como fuente principal del número y fallback temporal para evitar romper build sin variable.
- Se agregó `NEXT_PUBLIC_WHATSAPP_MESSAGE` para mensaje prellenado configurable.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint sin errores y generación correcta del enlace de WhatsApp con número saneado y mensaje URL-encoded.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual de construcción de URL `https://wa.me/...?...` en el botón del header.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye guía de variables de entorno para cambiar número y mensaje sin tocar código.
