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

## PR: Configurar WhatsApp al número 5520904940
- Fecha: 2026-04-19
- Objetivo: Asegurar que el botón "Contáctanos" abra WhatsApp hacia el número solicitado por negocio sin depender de configuración externa inicial.

### Lo aprendido
- Para números de México, es común recibir el dato en formato local de 10 dígitos; `wa.me` requiere formato internacional para abrir correctamente en app/web.
- Mantener un fallback funcional en código reduce fricción operativa cuando aún no se configuran variables de entorno en despliegue.
- Normalizar con una regla acotada (10 dígitos => prefijo `52`) resuelve el caso actual sin complicar el flujo.

### Decisiones técnicas
- Se fijó `5520904940` como valor por defecto del número de WhatsApp.
- Se implementó una función de normalización que elimina caracteres no numéricos y agrega `52` cuando detecta formato local de 10 dígitos.
- Se conservó `NEXT_PUBLIC_WHATSAPP_NUMBER` para permitir reemplazo futuro sin cambio de código.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint sin errores y transformación correcta del número local a formato `wa.me` esperado.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual de URL generada: `5520904940` → `https://wa.me/525520904940?...`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documentó explícitamente el número configurado y la normalización para formato internacional.

## PR: Estructura de carpetas para imágenes del sitio
- Fecha: 2026-04-19
- Objetivo: Crear una estructura escalable en `public/images` para organizar carga de assets por sección y uso comercial/editorial del sitio.

### Lo aprendido
- Definir jerarquía de imágenes por contexto de negocio (ventas, branding, SEO, contenido institucional) reduce desorden al crecer el catálogo.
- Mantener subcarpetas por tipo de uso (hero, thumbs, detalles, montajes) acelera integración en componentes sin renombrados constantes.
- Versionar carpetas vacías con `.gitkeep` evita perder la estructura acordada en Git.

### Decisiones técnicas
- Se creó `public/images` como raíz única para servir archivos estáticos con rutas claras en Next.js.
- Se dividieron carpetas por páginas/áreas clave: `home`, `arreglos`, `nosotros`, `eventos`, `custom`, `branding`, `blog`, `testimonios`, `seo` y `placeholders`.
- Se añadieron subcarpetas específicas para casos de uso frecuentes en un sitio de florería (catálogo, temporada, equipo, montajes, og/share/favicons).

### Pruebas
- Tipo: Validación manual estructurada + prueba automatizada de calidad.
- Resultado: La jerarquía quedó creada y versionada; lint del proyecto se mantiene sin errores.
- Evidencia:
  - `find public/images -type d` muestra todas las carpetas esperadas.
  - `npm run lint` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye árbol recomendado para que el equipo suba imágenes con convención consistente.

## PR: Marketplace con scroll, categorías y detalle por producto
- Fecha: 2026-04-20
- Objetivo: Crear una experiencia base de marketplace para explorar el catálogo por scroll, con categorización visible y una ficha de detalle por producto al hacer clic.

### Lo aprendido
- Un dataset centralizado para productos evita inconsistencias entre la vista de listado y la vista de detalle cuando el catálogo crece.
- Las anclas por categoría en la misma página (chips + `id`) dan una navegación rápida sin agregar complejidad de estado en frontend.
- Separar “preview corto” y “detalle completo” de cada producto mejora la jerarquía de información y reduce saturación del listado principal.

### Decisiones técnicas
- Se creó `src/data/marketplace-products.ts` como fuente única con tipado para productos y helpers de acceso por `slug`.
- Se implementó `/marketplace` con render por categorías y CTA `Ver detalle` hacia `/marketplace/[slug]`.
- Se agregó `generateStaticParams` en la ruta dinámica para dejar predefinidos los slugs del catálogo en build.
- Se añadió el enlace `Marketplace` en la navegación principal para accesibilidad inmediata desde cualquier página.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint del proyecto sin errores; flujo de navegación verificado a nivel de estructura (listado por categoría y ruta de detalle por slug).
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual del flujo: `/marketplace` → clic en `Ver detalle` → `/marketplace/[slug]`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incorpora nuevas rutas y resumen del cambio de marketplace para operación y mantenimiento.

## PR: Carrito de compras y compra directa en marketplace
- Fecha: 2026-04-20
- Objetivo: Permitir que usuarios agreguen productos al carrito desde marketplace/detalle, compren directamente por producto y consulten un carrito consolidado.

### Lo aprendido
- Para una experiencia comercial rápida en Next.js, un carrito basado en `localStorage` + contexto cliente cubre el flujo de selección sin bloquear por backend de pagos en una primera versión.
- Mantener una utilidad central para construir enlaces de WhatsApp evita duplicar lógica de sanitización/formato de número entre header, compra directa y checkout del carrito.
- Exponer el acceso a carrito en la navegación mejora descubribilidad y evita que el usuario pierda visibilidad de los productos seleccionados.

### Decisiones técnicas
- Se implementó `CartProvider` con hook `useCart` para concentrar operaciones `add/remove/clear` y contador total.
- Se creó `ProductPurchaseActions` reutilizable para no duplicar botones de compra en listado y detalle de producto.
- Se añadió la ruta `/carrito` con resumen y CTA final por WhatsApp con productos concatenados en el mensaje.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint del proyecto sin errores; flujo de carrito y compra directa validado a nivel de comportamiento esperado en componentes.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual del flujo: `/marketplace` → `Agregar al carrito` → `/carrito` → `Quitar` / `Vaciar carrito` / `Comprar por WhatsApp`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documenta alcance actual del carrito (persistencia local, sin pasarela de pago) y el uso de WhatsApp como checkout asistido.

## PR: Login base con Supabase Auth
- Fecha: 2026-04-20
- Objetivo: Implementar el primer flujo de autenticación (login/registro) conectado a Supabase para habilitar la base del sistema de usuarios y roles del sitio.

### Lo aprendido
- Aun sin instalar SDK adicional, se puede integrar un login funcional de Supabase consumiendo directamente sus endpoints de Auth desde frontend con la `anon key`.
- Para una primera iteración, separar la lógica de autenticación en una utilidad (`supabase-client.ts`) evita duplicar requests y simplifica futuros cambios hacia manejo de sesión/refresh token.
- Incluir en UI mensajes de error/éxito acelera validación operativa cuando el equipo configura variables en Vercel.

### Decisiones técnicas
- Se creó la ruta `/login` como pantalla inicial de autenticación con dos modos: `Iniciar sesión` y `Crear cuenta`.
- Se usaron los endpoints `POST /auth/v1/token?grant_type=password` y `POST /auth/v1/signup` de Supabase Auth en lugar de depender de paquetes externos (bloqueados por política de registry en este entorno).
- Se añadió enlace `Login` al menú principal para que el acceso esté disponible desde cualquier página.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint del proyecto pasa y el formulario queda operativo a nivel de flujo UI (modos, campos requeridos y feedback).
- Evidencia:
  - `npm run lint` OK.
  - `npm install @supabase/supabase-js` falla con `E403 Forbidden` en este entorno, por lo que se aplicó integración vía endpoints HTTP de Supabase Auth.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documenta que esta iteración cubre login base y registro; próxima fase recomendada: persistencia de sesión, guard de rutas y modelo de roles para admin/superadmin/cliente.

## PR: Robustez de registro/login con Supabase (headers + validación de URL)
- Fecha: 2026-04-20
- Objetivo: Corregir el error al registrar usuario cuando la conexión a Supabase falla por configuración de URL o request incompleto, y mostrar mensajes más accionables.

### Lo aprendido
- En llamadas directas a Supabase Auth desde frontend, enviar también `Authorization: Bearer <anon_key>` junto con `apikey` reduce fallas de autorización/intermediarios en algunos entornos.
- Normalizar `NEXT_PUBLIC_SUPABASE_URL` (trim + quitar slash final) evita endpoints mal formados como dobles barras o URLs inválidas.
- Conviene manejar explícitamente errores de red (`Failed to fetch`) y parseo de respuesta para no ocultar la causa real al usuario.

### Decisiones técnicas
- Se centralizó la lógica de auth en un helper `requestSupabaseAuth` para compartir headers, parseo de respuesta y manejo de errores entre login y signup.
- Se agregó validación de formato URL en `getSupabaseConfig` para fallar con mensaje claro cuando la variable está mal configurada.
- Se mantuvo el contrato de retorno `{ error: string | null }` para no romper el formulario actual.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado: Lint del proyecto sin errores; TypeScript de la utilidad de Supabase sin errores de compilación.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se añadió guía de troubleshooting para el error de conectividad con Supabase en login/registro.

## PR: Compatibilidad con publishable key y formato flexible de URL en Supabase
- Fecha: 2026-04-20
- Objetivo: Evitar errores de configuración al usar la nomenclatura actual de Supabase (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) y tolerar URLs pegadas con sufijos de endpoint.

### Lo aprendido
- Supabase está promoviendo `publishable key` en guías recientes, por lo que mantener solo `ANON_KEY` en código genera fricción innecesaria al configurar entornos nuevos.
- Un error común es pegar la URL con `/auth/v1` o `/rest/v1`; normalizar esos sufijos en cliente reduce tickets de “URL inválida”.
- Mensajes de error con ejemplo concreto de formato aceleran resolución operativa en Vercel/local.

### Decisiones técnicas
- Se definió prioridad de lectura: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y fallback a `NEXT_PUBLIC_SUPABASE_ANON_KEY` para compatibilidad retroactiva.
- Se amplió la normalización de `NEXT_PUBLIC_SUPABASE_URL` para remover `/`, `/auth/v1` y `/rest/v1` al final antes de validar.
- Se actualizó el mensaje de configuración faltante para incluir explícitamente ambos nombres de variable soportados.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado: Lint y chequeo de tipos sin errores.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README documenta variables recomendadas y el patrón exacto de URL esperado para Supabase.

## PR: Mensajes de error accionables en registro de Supabase
- Fecha: 2026-04-20
- Objetivo: Evitar el mensaje genérico "No fue posible crear la cuenta." al registrar usuarios y mostrar contexto útil para diagnóstico.

### Lo aprendido
- Supabase puede responder errores de signup en distintos campos (`error_description`, `msg`, `error`, `message`, `details`, `hint`) y limitar el parseo a pocos campos degrada la trazabilidad del problema.
- Agregar el código HTTP al mensaje acelera soporte operativo porque separa claramente errores de validación (4xx) de incidentes del proveedor (5xx).
- Mensajes específicos para límites de tasa (429) y errores internos (5xx) reducen ambigüedad frente a un fallback único.

### Decisiones técnicas
- Se agregó un parser de payload de error para priorizar múltiples claves soportadas por respuestas de Supabase Auth.
- Se añadieron mensajes dedicados para `429` y `5xx`, manteniendo fallback para los demás códigos no exitosos.
- Se actualizó el mensaje de variables faltantes en UI para reflejar la convención actual (`PUBLISHABLE_KEY`) con fallback a `ANON_KEY`.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado: Lint y chequeo de tipos sin errores.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye sección de troubleshooting de signup con lectura de códigos HTTP frecuentes.

## PR: Aviso de privacidad para registro de datos personales (México)
- Fecha: 2026-04-20
- Objetivo: Implementar una página de aviso de privacidad para el tratamiento de datos personales de clientes (nombre, teléfono y correo) en procesos posteriores al login, conforme al marco mexicano aplicable.

### Lo aprendido
- Publicar el aviso de privacidad como ruta de primer nivel mejora trazabilidad legal y facilita compartirlo en onboarding/soporte.
- Estructurar el texto por bloques funcionales (responsable, finalidades, ARCO, transferencias, seguridad) hace más mantenible el contenido frente a futuras actualizaciones regulatorias.
- Mantener visible el acceso desde navegación principal reduce fricción para cumplimiento de transparencia.

### Decisiones técnicas
- Se creó la ruta dedicada `/aviso-de-privacidad` en App Router para centralizar el contenido legal.
- Se usó `SiteShell` y componentes visuales existentes (`studio-card`) para conservar consistencia editorial del sitio.
- Se agregó enlace directo `Aviso de privacidad` en menú principal para accesibilidad transversal.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint del proyecto sin errores y navegación funcional hacia el aviso desde el header.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual de secciones legales y de navegación a `/aviso-de-privacidad`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incorpora la nueva ruta legal y su alcance de cumplimiento para datos personales en la app.

## PR: Footer global para acceso a aviso de privacidad
- Fecha: 2026-04-20
- Objetivo: Mover el acceso al aviso de privacidad desde el menú principal hacia un footer global para limpiar la navegación superior sin perder acceso legal.

### Lo aprendido
- Un enlace legal en footer mantiene cumplimiento y accesibilidad sin competir con rutas comerciales en el header.
- Centralizar el footer en `SiteShell` asegura consistencia automática en todas las rutas existentes y futuras.
- En mobile, el footer reduce ruido en el menú hamburguesa y mejora escaneo de opciones principales.

### Decisiones técnicas
- Se removió `Aviso de privacidad` del arreglo `links` del menú principal.
- Se añadió un `footer` global en `SiteShell` con enlace único a `/aviso-de-privacidad` y año dinámico.
- Se incorporaron estilos reutilizables (`site-footer`, `site-footer-inner`) con ajuste responsive en `globals.css`.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint sin errores y navegación legal disponible desde footer en todas las páginas.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual del flujo: header sin enlace legal + acceso a `/aviso-de-privacidad` desde footer.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README documenta explícitamente que el enlace de aviso de privacidad vive ahora en el footer global.

## PR: Validación de contraseña en vivo en crear usuario
- Fecha: 2026-04-20
- Objetivo: Validar en tiempo real que la contraseña de registro cumpla uso de mayúsculas, minúsculas, caracteres especiales y dígitos, con retroalimentación visual inmediata.

### Lo aprendido
- Mostrar criterios de contraseña en vivo reduce errores de registro y elimina ambigüedad frente a mensajes genéricos al enviar el formulario.
- Mantener la validación en frontend antes de llamar a Supabase evita requests innecesarios cuando la contraseña aún no cumple políticas mínimas.
- Reutilizar el mismo formulario para login/registro requiere condicionar claramente reglas UI para no introducir fricción en inicio de sesión.

### Decisiones técnicas
- Se añadieron validadores por regex para cuatro reglas independientes: mayúscula, minúscula, dígito y caracter especial.
- Se implementó una lista de reglas con estado visual dinámico (`✅`/`⬜`) visible solo en modo `Crear cuenta`.
- Se bloqueó el submit de `signup` cuando alguna regla no se cumple, mostrando un mensaje accionable.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + validación manual estructurada.
- Resultado: Lint y chequeo de tipos sin errores; flujo de retroalimentación de contraseña disponible en vivo en modo registro.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - Revisión manual de reglas dinámicas en `/login` al escribir contraseña en `Crear cuenta`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documenta la política visible mínima de contraseña para registro y su validación previa al submit.

## PR: Menú de usuario autenticado con opciones por rol
- Fecha: 2026-04-20
- Objetivo: Mostrar en el header una entrada de crear usuario/login y, tras autenticación, mantener visible el usuario con un menú de funciones diferenciadas para usuario normal y administrador.

### Lo aprendido
- Persistir un estado de sesión liviano en `localStorage` permite mantener visible el usuario autenticado entre recargas sin bloquear por una capa backend adicional en esta fase.
- Incluir el rol dentro del menú visible reduce ambigüedad operativa y deja clara la diferencia de accesos entre cuentas normales y administradoras.
- Centralizar el estado de autenticación en un contexto compartido simplifica sincronizar login, header y logout sin duplicar lógica.

### Decisiones técnicas
- Se creó `AuthProvider` + `useAuth` para almacenar y exponer usuario/rol autenticado en toda la UI que utiliza `SiteShell`.
- Se actualizó el formulario de login/signup para guardar sesión al autenticar y permitir selección de tipo de cuenta inicial en registro.
- Se añadió menú desplegable de usuario en la esquina superior derecha con rutas base por rol (`/mi-cuenta/pedidos`, `/admin/pedidos`, `/admin/usuarios`).

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + validación manual estructurada.
- Resultado: Lint y chequeo de tipos sin errores; build de producción bloqueado por restricción de red al descargar Google Fonts.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - `npm run build` falla con `Failed to fetch font 'Inter'` y `Failed to fetch font 'Playfair Display'` desde `fonts.googleapis.com`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documentó el comportamiento del menú autenticado y la separación inicial de funciones por rol para próximas iteraciones de permisos.

## PR: Ajuste de navegación (quitar Arreglos del menú y renombrar Marketplace a Tienda)
- Fecha: 2026-04-20
- Objetivo: Simplificar la navegación principal eliminando la opción Arreglos del header y unificar el acceso al catálogo bajo la etiqueta Tienda.

### Lo aprendido
- Cuando el catálogo principal ya vive en `/marketplace`, mantener además `Arreglos` en menú genera redundancia de navegación y puede dividir la intención de compra.
- Renombrar solo la etiqueta del link (sin cambiar la ruta) permite un ajuste editorial rápido sin impacto técnico en rutas existentes.

### Decisiones técnicas
- Se actualizó el arreglo `links` de `SiteShell` para remover `Arreglos` y cambiar `Marketplace` por `Tienda`.
- Se mantuvo la ruta `/arreglos` publicada para compatibilidad con enlaces existentes y posible uso secundario fuera del menú principal.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint sin errores y navegación principal actualizada con `Tienda` como entrada de catálogo.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual de `src/components/site-shell.tsx` (arreglo `links`) confirmando ausencia de `Arreglos` y presencia de `Tienda`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documenta este ajuste como cambio editorial de navegación sin alteración de rutas internas.

## PR: Registro con campos de usuario y nombre completo
- Fecha: 2026-04-20
- Objetivo: Ampliar el formulario de crear cuenta para capturar también usuario y nombre completo, y conservar esos datos en la sesión visible del header.

### Lo aprendido
- Pedir `usuario` y `nombre completo` desde el alta reduce pasos posteriores de perfil y mejora contexto del menú autenticado.
- Supabase puede devolver metadata de usuario en distintas claves (`user_metadata` y `raw_user_meta_data`), por lo que conviene parsear ambas para robustez.
- Mantener estos campos opcionales en el modelo de sesión evita romper usuarios existentes que iniciaron sesión antes de este cambio.

### Decisiones técnicas
- Se agregaron los inputs `Usuario` y `Nombre completo` únicamente en modo `Crear cuenta`, con validación previa al submit.
- Se extendió `signUpWithPassword` para enviar metadata (`username` y `full_name`) en `options.data` hacia Supabase Auth.
- Se actualizó el contexto de autenticación para persistir `username/fullName` y priorizarlos como etiqueta visible del usuario en el menú del header.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado: Lint y chequeo de tipos sin errores tras la ampliación de formulario y tipos de sesión.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye este ajuste en historial para operación de registro con metadata básica de perfil.

## PR: Mejora de clic en menú de usuario + direcciones de entrega
- Fecha: 2026-04-20
- Objetivo: Hacer más usable el menú de usuario autenticado y habilitar el registro de direcciones de entrega para pedidos.

### Lo aprendido
- Aumentar altura y ancho de los links del dropdown de usuario mejora de forma inmediata la usabilidad táctil y reduce clics fallidos.
- Guardar direcciones por cuenta usando una clave de `localStorage` basada en email permite un MVP funcional sin bloquear por backend.
- Marcar una dirección principal dentro del mismo flujo ayuda a preparar una futura integración de checkout sin pedir selección repetida.

### Decisiones técnicas
- Se ajustaron estilos del menú de usuario (`user-menu-link` y `user-menu-logout`) para ampliar área clicable en desktop/mobile.
- Se creó la ruta `/mi-cuenta/direcciones` con un componente cliente dedicado para alta/listado/eliminación de direcciones.
- Se implementó persistencia local y acciones de dirección principal, manteniendo una estructura simple y compatible con iteraciones futuras.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + validación manual estructurada.
- Resultado: Lint y chequeo de tipos sin errores; menú de usuario con mejor interacción y flujo de direcciones operativo.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - Revisión manual: login → menú usuario → `Mis direcciones` → guardar dirección → marcar principal → eliminar.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se dejó documentada la nueva ruta de direcciones y el alcance actual (persistencia local por usuario).
