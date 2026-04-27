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

## PR: Confirmación de correo Supabase con callback productivo
- Fecha: 2026-04-20
- Objetivo: Implementar un flujo robusto de confirmación de correo con Supabase usando `token_hash` + verificación OTP, evitando redirecciones a localhost y mostrando páginas amigables de éxito/error.

### Lo aprendido
- Separar la verificación de email en una ruta dedicada (`/auth/callback`) mejora trazabilidad y evita que el usuario termine en páginas crudas o estados ambiguos.
- En un frontend sin SDK de Supabase, se puede mantener un flujo sólido consumiendo `POST /auth/v1/verify` con headers `apikey` + `Authorization` y luego redirigir a una experiencia visual del sitio.
- Para despliegues multi-entorno, definir `NEXT_PUBLIC_SITE_URL` como fuente canónica de callback elimina hardcodes a localhost y mantiene compatibilidad con previews/producción.

### Decisiones técnicas
- Se creó un route handler en App Router (`src/app/auth/callback/route.ts`) para leer `token_hash`, `type` y `next`, validar parámetros y redirigir según resultado.
- Se amplió la utilidad de auth (`src/lib/supabase-client.ts`) para soportar verificación OTP y para incluir `emailRedirectTo` dinámico durante signup.
- Se añadieron páginas visuales `/correo-confirmado` y `/auth/error` siguiendo el sistema visual existente (`SiteShell` + `studio-card`), incluyendo sincronización de sesión local cuando Supabase devuelve tokens.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado: Lint y chequeo de tipos sin errores tras incorporar callback, verificación OTP y nuevas páginas de estado.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README documenta rutas nuevas de confirmación y variables necesarias (`NEXT_PUBLIC_SITE_URL`) para evitar redirecciones a localhost.

## PR: Menú de cuenta fuera del hamburguesa + avatar con iniciales
- Fecha: 2026-04-21
- Objetivo: Sacar el acceso de login/registro del menú hamburguesa y moverlo a un acceso fijo en la esquina derecha, usando ícono de usuario en estado no autenticado y avatar circular con iniciales cuando el usuario ya inició sesión.

### Lo aprendido
- Separar la navegación principal del acceso a cuenta mejora claridad UX en mobile: el usuario reconoce más rápido dónde iniciar sesión sin abrir el menú completo.
- Un avatar con iniciales comunica estado autenticado de forma inmediata y reduce dependencia de etiquetas textuales largas en header.
- Mantener el dropdown de cuenta en la misma posición para ambos estados (anónimo/autenticado) reduce cambios de patrón mental al usuario.

### Decisiones técnicas
- Se creó un trigger de cuenta persistente en `SiteShell` (siempre visible), independiente del bloque de acciones que se despliega con hamburguesa.
- En estado no autenticado, el dropdown muestra dos rutas explícitas: `Iniciar sesión` y `Crear usuario`.
- En estado autenticado, el trigger cambia a círculo con iniciales calculadas desde `fullName/username/email` y conserva el menú por rol existente.
- Se agregó soporte a `?mode=signup` en `/login` para que la opción `Crear usuario` abra directamente ese modo en el formulario.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + validación manual estructurada.
- Resultado: Lint y tipos sin errores; navegación de cuenta separada del hamburguesa y comportamiento esperado de ícono/avatar implementado.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - Revisión manual del flujo: estado anónimo (ícono + opciones login/signup) y estado autenticado (avatar con iniciales + menú de usuario).
## PR: SEO técnico base para mejorar posicionamiento orgánico
- Fecha: 2026-04-21
- Objetivo: Reforzar la base técnica SEO del sitio para mejorar indexación, relevancia semántica y calidad de snippets en buscadores/redes.

### Lo aprendido
- En Next.js App Router, centralizar metadata en `layout.tsx` y complementar metadata por ruta ofrece cobertura SEO consistente sin duplicar lógica.
- Generar `sitemap.xml` desde el dataset real del marketplace evita URLs huérfanas y facilita descubrimiento de productos.
- Incluir JSON-LD (`Florist` y `Product`) ayuda a expresar explícitamente el tipo de negocio y catálogo para buscadores.

### Decisiones técnicas
- Se implementó metadata global con `metadataBase`, plantilla de títulos, Open Graph, Twitter y `robots`.
- Se agregaron `src/app/sitemap.ts` y `src/app/robots.ts` con bloqueo explícito a rutas privadas (`/admin`, `/mi-cuenta`).
- Se añadió `generateMetadata` en `/marketplace/[slug]` para canónicos y metadatos dinámicos por producto.

### Pruebas
- Tipo: Pruebas automatizadas de calidad + validación estática de TypeScript.
- Resultado: Lint y typecheck pasan sin errores.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye resumen del nuevo patrón de acceso a cuenta y su comportamiento por estado de sesión.
- Notas: Se documentó la nueva capa SEO técnica y la recomendación de configurar `NEXT_PUBLIC_SITE_URL` con dominio productivo.

## PR: Fix de build en Vercel por `useSearchParams` en `/login`
- Fecha: 2026-04-21
- Objetivo: Corregir el error de prerender en Next.js 15 al usar `useSearchParams()` en la vista de login durante `next build` en Vercel.

### Lo aprendido
- En App Router con render estático, `useSearchParams()` en componentes cliente debe renderizarse dentro de un límite de `Suspense` para evitar el error `missing-suspense-with-csr-bailout`.
- Aunque el componente sea cliente, la página que lo contiene puede fallar en prerender si no se declara explícitamente el boundary.
- Un fallback simple de texto es suficiente para cumplir el requisito sin alterar el flujo funcional del formulario.

### Decisiones técnicas
- Se envolvió `LoginForm` en `Suspense` dentro de `src/app/login/page.tsx`.
- Se mantuvo intacta la lógica de autenticación/registro para limitar el cambio al problema de build reportado.
- Se usó un fallback liviano (`auth-feedback`) coherente con el sistema visual existente.

### Pruebas
- Tipo: Prueba automatizada de calidad + build de producción.
- Resultado: Lint y build completan correctamente tras agregar `Suspense`.
- Evidencia:
  - `npm run lint` OK.
  - `npm run build` falla por `Failed to fetch font` (fonts.googleapis.com) en este entorno.
## PR: Eliminación de referencias a Ciudad de México en contenido comercial
- Fecha: 2026-04-21
- Objetivo: Quitar referencias de CDMX/Ciudad de México en el contenido comercial y metadatos para comunicar cobertura en múltiples ciudades.

### Lo aprendido
- Las menciones geográficas rígidas en metadata y fichas de producto pueden limitar la percepción comercial aunque la operación real tenga mayor alcance.
- Reemplazar ciudad fija por mensajes de cobertura por disponibilidad mantiene claridad operativa sin sobreprometer tiempos universales.

### Decisiones técnicas
- Se actualizaron textos SEO globales y copys de páginas clave (`home`, `contacto`, `marketplace`) para eliminar referencias directas a CDMX.
- Se ajustaron mensajes de entrega del dataset de marketplace hacia una redacción por cobertura logística según ciudad/zona.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado: Lint y typecheck sin errores.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se agregó registro del fix de compatibilidad con Next.js 15/Vercel para referencia futura.
- Notas: Se alineó el discurso comercial y SEO para no restringir el servicio a Ciudad de México.

## PR: Fix superposición del menú de usuario en mobile
- Fecha: 2026-04-21
- Objetivo: Corregir la superposición del panel de usuario sobre el contenido del hero en pantallas pequeñas.

### Lo aprendido
- En mobile, un dropdown con `position: absolute` dentro del header puede invadir contenido crítico si no se reserva espacio en flujo.
- Convertir el panel a `position: static` únicamente en breakpoint móvil permite mantener el comportamiento desktop sin regresiones.
- Ajustar la estructura del contenedor derecho del header (`header-right`) a un layout vertical mejora la estabilidad visual cuando aparecen paneles contextuales.

### Decisiones técnicas
- Se mantuvo el patrón actual del menú de usuario y se resolvió el problema en CSS responsive, evitando refactor de lógica React.
- Se agregó ancho responsivo controlado al bloque de cuenta para prevenir desbordes en pantallas angostas.
- Se priorizó un cambio acotado en `globals.css` para minimizar riesgo y facilitar rollback.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint sin errores y menú de usuario mobile desplegado sin tapar el texto del hero.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual del flujo en mobile: abrir menú de usuario y confirmar que el panel ocupa espacio dentro del header.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Cambio visual/UX mobile sin impacto funcional en rutas ni autenticación.

## PR: Redirección post-login a dashboard de usuario
- Fecha: 2026-04-21
- Objetivo: Redirigir automáticamente al usuario autenticado a un dashboard de cuenta para evitar que permanezca en la pantalla de login.

### Lo aprendido
- Un flujo de autenticación se percibe incompleto si no existe un destino claro después del login; redirigir a un hub de cuenta mejora orientación del usuario.
- Un dashboard de entrada reduce fricción porque concentra accesos frecuentes (pedidos, direcciones y perfil) sin depender del menú desplegable.
- Permitir `?redirect=` controlado (solo rutas internas) mantiene flexibilidad para futuros flujos protegidos sin abrir riesgos de redirección externa.

### Decisiones técnicas
- Se integró `useRouter` en `login-form` para ejecutar `router.push("/mi-cuenta")` al autenticar correctamente (login y signup con sesión activa).
- Se creó la ruta `/mi-cuenta` con un dashboard cliente que muestra datos básicos de cuenta y accesos directos.
- Se añadió el enlace `Dashboard` al menú de usuario autenticado para navegación recurrente.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada de flujo.
- Resultado: Lint sin errores y redirección post-login implementada hacia dashboard de cuenta.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual del flujo esperado: `/login` → autenticación exitosa → `/mi-cuenta`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documentó la nueva ruta de dashboard y el nuevo comportamiento de redirección posterior a autenticación.

## PR: Ícono de carrito fijo fuera del menú hamburguesa
- Fecha: 2026-04-21
- Objetivo: Mostrar el acceso al carrito siempre visible en header como ícono, fuera del menú hamburguesa, incluyendo badge con número de productos agregados.

### Lo aprendido
- Separar accesos transaccionales (carrito) de la navegación colapsable mejora descubribilidad de compra en mobile.
- Un badge numérico pequeño sobre el ícono comunica estado del carrito sin ocupar espacio textual en el header.

### Decisiones técnicas
- Se reutilizó `totalItems` de `CartProvider` para renderizar la notificación del carrito en tiempo real.
- Se agregó un nuevo trigger visual (`cart-access`) en `SiteShell` junto al acceso de cuenta, y se removieron enlaces duplicados de carrito del menú hamburguesa/acciones.
- Se incorporó un ícono SVG inline para evitar dependencias externas de librerías de íconos.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + validación manual estructurada.
- Resultado: Lint y typecheck pasan sin errores; el ícono de carrito queda visible fuera del menú hamburguesa y el badge refleja la cantidad de productos.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - Revisión manual del flujo esperado: agregar productos al carrito y verificar actualización del contador en el ícono.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Cambio centrado en UX de navegación comercial; sin cambios de rutas ni lógica de checkout.

## PR: Control de roles con Supabase (RLS + protección server-side)
- Fecha: 2026-04-21
- Objetivo: Implementar un esquema confiable de roles `user/admin` con seguridad real en Supabase (RLS), protección de rutas admin del lado servidor y UI condicional basada en perfil verificado.

### Lo aprendido
- Confiar en estado de sesión del cliente (por ejemplo `localStorage`) no es suficiente para autorización: la validación de privilegios debe resolverse en servidor contra `auth.getUser()`/token + tabla `profiles`.
- Separar autenticación (tokens) y autorización (rol en `public.profiles`) hace más mantenible la evolución de permisos por módulo.
- Un layout protegido en App Router (`/admin/layout.tsx`) simplifica aplicar control de acceso transversal a todo el árbol administrativo.

### Decisiones técnicas
- Se creó una migración única `supabase/migrations/20260421_roles_profiles_rls.sql` con tabla `profiles`, función `is_admin()`, triggers y policies RLS.
- Se retiró la selección de rol en UI de registro para evitar escalamiento de privilegios desde frontend.
- Se movió la sesión a cookies httpOnly (`/api/auth/session`) para permitir verificación server-side del usuario autenticado en rutas protegidas.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado: Lint y typecheck sin errores tras incorporar migración SQL, endpoints de sesión y protección admin.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README agrega guía operativa de roles, RLS, promoción de primer admin y patrón para extender policies a tablas sensibles.

## PR: Reordenar header con menú a la izquierda y accesos rápidos a la derecha
- Fecha: 2026-04-21
- Objetivo: Mejorar la jerarquía del encabezado moviendo la navegación principal al lado izquierdo, dejando WhatsApp/carrito/usuario como accesos rápidos en el lado derecho y simplificando el menú hamburguesa.

### Lo aprendido
- Cuando el logo ya regresa a la home, mantener `Inicio` como link adicional en el menú añade redundancia y ocupa espacio de navegación útil.
- Un CTA de contacto convertido a ícono persistente (WhatsApp) funciona mejor para mobile que un botón textual escondido dentro del menú colapsable.
- Reducir elementos decorativos en el menú hamburguesa mejora claridad y evita saturación visual al abrir navegación en pantallas pequeñas.

### Decisiones técnicas
- Se removió `Inicio` del arreglo `links` y se mantuvo el comportamiento del logo como acceso principal a `/`.
- Se eliminó el bloque `header-actions` (paleta + botón de contacto) y se agregó un acceso `whatsapp-access` junto a carrito y usuario en `header-right`.
- Se ajustó CSS para alinear los links del menú a la izquierda (`justify-content: flex-start`) y mantener en mobile únicamente links de navegación dentro del menú hamburguesa.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint sin errores y header actualizado según requerimiento (sin `Inicio`, sin paleta en hamburguesa, WhatsApp junto a carrito/usuario).
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual del flujo visual del header en desktop/mobile.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Cambio concentrado en UX/UI del header, sin modificaciones de rutas ni lógica de carrito/autenticación.

## PR: Recuperación de contraseña para usuarios con acceso perdido
- Fecha: 2026-04-21
- Objetivo: Permitir que un usuario solicite recuperación de contraseña desde login y complete el cambio con un flujo guiado al regresar desde correo.

### Lo aprendido
- Un flujo de recuperación usable requiere dos pasos claros: solicitud de enlace desde login y pantalla dedicada para definir nueva contraseña al volver desde email.
- Reutilizar el callback OTP existente (`/auth/callback`) permite mantener tokens en cookies seguras y evita exponer credenciales en query params de frontend.
- Al actualizar contraseña por endpoint server-side con sesión de recuperación, se conserva coherencia con el modelo actual de seguridad basado en cookies `httpOnly`.

### Decisiones técnicas
- Se agregó modo `¿Olvidaste tu contraseña?` en `LoginForm` para enviar recovery email con Supabase (`/auth/v1/recover`) y mensaje de éxito/error en la misma vista.
- Se creó la ruta `/actualizar-contrasena` con validación visual de reglas (mayúscula, minúscula, dígito, especial y mínimo de longitud) y confirmación de contraseña.
- Se implementó `POST /api/auth/password` para ejecutar `PUT /auth/v1/user` usando el access token de cookie y así persistir la nueva contraseña de forma segura.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + validación manual estructurada de flujo.
- Resultado: Lint y typecheck sin errores; flujo de recuperación listo de extremo a extremo a nivel de integración UI/API.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - Revisión manual del flujo esperado: `/login` → `¿Olvidaste tu contraseña?` → enlace de correo → `/actualizar-contrasena` → actualización exitosa.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README documenta la nueva ruta y la configuración recomendada del template de recuperación en Supabase.

## PR: Ajuste del menú de usuario para evitar empalme con el contenido
- Fecha: 2026-04-21
- Objetivo: Corregir la superposición del dropdown de usuario con la estructura principal del sitio para mejorar legibilidad y navegación.

### Lo aprendido
- En layouts con hero tipográfico grande, un dropdown absoluto en header puede invadir el contenido y romper la lectura de títulos principales.
- Para menús de cuenta con varios links (perfil + opciones admin), integrar el panel al flujo del encabezado evita solapamientos sin introducir lógica JS adicional.
- Una corrección de UX visual puede resolverse con cambios de layout CSS sin afectar rutas, estado de auth ni lógica de permisos.

### Decisiones técnicas
- Se convirtió `.user-menu` en contenedor de columna (`display: flex; flex-direction: column; align-items: flex-end`) para alojar trigger y panel en flujo vertical.
- Se cambió `.user-menu-panel` de `position: absolute` a `position: static` y se agregó `margin-top` para separación visual controlada.
- Se mantuvo la estructura del componente `SiteShell` sin cambios funcionales para limitar el alcance al problema de empalme visual.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado: Lint sin errores y menú de usuario ya no se superpone sobre el contenido principal al desplegarse.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual del header con menú de usuario desplegado sobre páginas de cuenta.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Cambio exclusivamente visual de layout en header para mejorar UX desktop/móvil sin alterar lógica de autenticación.

## PR: Header en 2 secciones y WhatsApp flotante movible
- Fecha: 2026-04-21
- Objetivo: Reorganizar el encabezado para separar navegación y accesos transaccionales, y mover el contacto de WhatsApp a un botón flotante que el usuario pueda arrastrar.

### Lo aprendido
- Separar el header por bloques funcionales (navegación vs. acciones de cuenta/compra) mejora legibilidad inmediata en pantallas reducidas.
- Un CTA flotante de WhatsApp puede mantener visibilidad alta sin competir con elementos críticos del header si se permite reposicionarlo por drag.
- Para evitar clics accidentales al arrastrar, conviene bloquear la navegación del enlace cuando se detectó movimiento real durante el gesto.

### Decisiones técnicas
- Se dividió `nav-wrap` en `header-primary-row` (marca + hamburguesa), `nav-links` colapsable y `header-secondary-row` (carrito + usuario).
- Se eliminó el acceso de WhatsApp del header y se creó `DraggableWhatsAppButton` como anchor fijo con eventos de pointer para arrastre y límites dentro del viewport.
- Se mantuvo la URL de WhatsApp centralizada con `getWhatsAppHref` para no duplicar lógica de contacto.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + validación manual estructurada.
- Resultado: Lint y typecheck sin errores; estructura del header actualizada y botón flotante preparado para clic/arrastre.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - Revisión manual esperada del flujo: header en 2 secciones + botón WhatsApp flotante movible.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Cambio centrado en UX de navegación y contacto, sin alterar rutas de negocio ni flujo de checkout.

## PR: Optimización de performance base (providers globales + hidratación de carrito)
- Fecha: 2026-04-21
- Objetivo: Reducir trabajo repetido en navegación y evitar sobrescritura temprana del carrito persistido.

### Lo aprendido
- Montar providers de estado global dentro de un shell reutilizado por página puede disparar efectos repetitivos (por ejemplo, fetch de sesión) al navegar; moverlos al `RootLayout` estabiliza el ciclo de vida.
- En carritos con `localStorage`, escribir inmediatamente en el primer render puede pisar el estado persistido si aún no termina la hidratación.
- Mantener la capa de providers separada (`AppProviders`) mejora mantenibilidad y hace explícita la frontera cliente/servidor en App Router.

### Decisiones técnicas
- Se creó `src/components/app-providers.tsx` para centralizar `AuthProvider` + `CartProvider` en un único wrapper cliente.
- Se integró `AppProviders` en `src/app/layout.tsx` para que sesión y carrito vivan a nivel de árbol de aplicación, no por página.
- Se simplificó `SiteShell` removiendo wrappers redundantes de contexto.
- Se añadió guard de hidratación en `cart-context` (`isHydrated`) para escribir en `localStorage` solo después de cargar estado inicial.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado: Lint y typecheck sin errores tras refactor.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documentó el objetivo de performance y el patrón recomendado de providers globales para futuras iteraciones.

## PR: Ajuste visual del botón flotante de WhatsApp
- Fecha: 2026-04-22
- Objetivo: Alinear el botón flotante de WhatsApp con la paleta editorial del sitio y reemplazar el ícono por una versión más estética.

### Lo aprendido
- Un ícono de trazo simplificado con mejor proporción mejora legibilidad en tamaños pequeños sin perder reconocimiento de marca.
- El botón flotante se percibe más integrado cuando hereda tokens visuales del sitio (`rose-mist`, `smoke`, `charcoal`) en lugar de mantener un color externo dominante.
- Qué no funcionó y por qué: mantener el verde original destacaba demasiado frente al resto de accesos rápidos y rompía la armonía del header/editorial.

### Decisiones técnicas
- Se reemplazó el path SVG anterior por una versión más limpia (burbuja + teléfono) en `WhatsAppIcon`.
- Se migró el estilo de `.whatsapp-floating` de verde corporativo a colores del sistema visual del proyecto.
- Se añadió `:hover` con fondo blanco para mantener consistencia con patrones ya usados en iconos de carrito/usuario.
- Razón de la decisión final: priorizar coherencia visual de marca del sitio sin afectar funcionalidad de contacto ni comportamiento draggable.

### Riesgos y mitigaciones
- Riesgo: menor reconocimiento inmediato del canal si el botón pierde demasiado contraste.
- Mitigación: se mantuvo forma circular, posición fija y símbolo telefónico dentro de burbuja para conservar affordance de mensajería.
- Pendientes: validar con negocio si se desea una versión intermedia (acento de color más cercano a WhatsApp) para campañas específicas.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación manual estructurada.
- Resultado esperado: cambios visuales sin romper lint ni interacción de clic/arrastre del botón.
- Resultado obtenido: lint exitoso y comportamiento visual/interactivo consistente.
- Evidencia:
  - `npm run lint` OK.
  - Revisión manual del botón flotante: nuevo ícono visible, color alineado a paleta del sitio y sin regresiones de interacción.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se registró el rationale visual y la validación aplicada para futuras iteraciones de branding.

## PR: Checkout embebido con Mercado Pago (Checkout API / Orders)
- Fecha: 2026-04-26
- Objetivo: Implementar un flujo end-to-end de pago con tarjeta sin redirecciones externas, usando Card Payment Brick en frontend y creación/reconciliación de órdenes en backend con Supabase.

### Lo aprendido
- En un checkout embebido, el frontend solo debe tokenizar y enviar datos mínimos del medio de pago; el cálculo de montos debe resolverse en backend para evitar manipulación del cliente.
- Mantener un endpoint de webhook idempotente y tolerante a reintentos es clave para sincronizar estados reales de pago (approved/pending/rejected) sin romper la recepción de eventos.
- Preparar validación de firma desde el inicio permite endurecer seguridad progresivamente, aun cuando algunos headers/campos de notificación puedan variar por tipo de evento.

### Decisiones técnicas
- Se implementó `POST /api/mercadopago/create-order` con validaciones de payload, recálculo de total desde catálogo, `X-Idempotency-Key` y creación de orden en `/v1/orders`.
- Se creó `POST /api/mercadopago/webhook` para registrar `payment_events`, consultar estado actualizado en Mercado Pago y reconciliar `orders/payments` en Supabase con estrategia de upsert.
- Se agregó `/checkout` con SDK JS de Mercado Pago + Card Payment Brick, conservando experiencia embebida en el sitio y mostrando estados claros para aprobación, pendiente, rechazo y error.

### Riesgos y mitigaciones
- Riesgo: diferencias entre esquemas reales de tablas `orders`, `payments`, `payment_events` y columnas esperadas por integración.
- Mitigación: manejo defensivo con logs de error backend y respuesta `200` en webhook para no perder notificaciones mientras se ajusta esquema final.
- Pendientes: validar en ambiente de negocio los nombres/constraints definitivos para garantizar `on_conflict` y deduplicación al 100%.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + build de producción + validación manual estructurada de flujo.
- Resultado esperado: Integración compila, no rompe funcionalidades existentes y deja disponibles rutas de create-order/webhook/checkout embebido.
- Resultado obtenido: lint y typecheck en verde; build bloqueado por red al descargar fuentes de Google Fonts en este entorno, sin errores de TypeScript/ESLint en la integración implementada.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - `npm run build` falla por `Failed to fetch font` (fonts.googleapis.com) en este entorno.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README documenta variables de entorno, sandbox, configuración de webhook y confirmación de flujo embebido sin Checkout Pro/preference/init_point.

## PR: Registro en código de integraciones GitHub↔Supabase y Supabase↔Vercel
- Fecha: 2026-04-26
- Objetivo: Dejar en el repositorio un registro técnico explícito de ambas integraciones y propagar datos clave al momento de ejecutar requests contra Supabase.

### Lo aprendido
- Centralizar metadata operativa de integraciones en un solo módulo reduce duplicidad y evita desalineación entre documentación y ejecución real del código.
- Incluir contexto de integración en `X-Client-Info` aporta trazabilidad liviana sin exponer secretos sensibles.
- Qué no funcionó y por qué: guardar esta trazabilidad solo en README no era suficiente, porque no llega al runtime de las llamadas que realmente usan Supabase.

### Decisiones técnicas
- Se creó `src/lib/integration-metadata.ts` como fuente única para datos clave de integración (repo, rama, working dir, team/proyecto Vercel, entornos sincronizados y prefijo público).
- Se reutilizó `getSupabaseClientInfoHeader()` en cliente, servidor y admin para estandarizar encabezados de requests a Supabase.
- Se mantuvo el uso de variables `NEXT_PUBLIC_*` únicamente para metadata no sensible y se evitó incluir tokens/keys privados en este registro.
- Razón de la decisión final: balancear trazabilidad operativa, bajo impacto en arquitectura existente y compatibilidad con despliegues en Vercel/Supabase.

### Riesgos y mitigaciones
- Riesgo: confundir metadata de integración con secretos reales de conexión.
- Mitigación: documentación explícita de variables permitidas y exclusión de llaves privadas en el módulo.
- Pendientes: si se requiere auditoría profunda, complementar con persistencia en tabla dedicada de eventos (server-side).

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: cambios compilan sin romper flujo actual de auth/admin/server con Supabase.
- Resultado obtenido: lint y typecheck en verde.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye nueva sección con variables y alcance del registro técnico de integraciones.

## PR: Fix validación de datos obligatorios en checkout embebido (Mercado Pago)
- Fecha: 2026-04-26
- Objetivo: Corregir falsos positivos de “Faltan datos obligatorios del pago” cuando el Brick envía `payment_method_type` vacío/omitido, aun con tarjeta y datos completos.

### Lo aprendido
- En Card Payment Brick de Mercado Pago, `payment_method_type` puede no venir siempre en el `onSubmit`; tratarlo como obligatorio en backend provoca rechazos 400 aunque el resto de datos sea válido.
- Validar únicamente los campos realmente imprescindibles (`token`, `payment_method_id`, `payer.email`) evita bloquear pagos válidos por variaciones del payload del SDK.
- Qué no funcionó y por qué: exigir `payment_method_type` en el guard inicial del endpoint (`create-order`) disparaba el mensaje de datos faltantes para casos reales con payload parcial del Brick.

### Decisiones técnicas
- Se hizo opcional `payment_method_type` en el contrato TypeScript compartido del checkout.
- Se removió `payment_method_type` de la validación obligatoria en `POST /api/mercadopago/create-order`.
- Se agregó fallback backend a `credit_card` (`resolvedPaymentMethodType`) para mantener compatibilidad con `/v1/orders` y trazabilidad en metadata/persistencia.
- Razón de la decisión final: privilegiar robustez ante variaciones reales del SDK sin degradar validaciones críticas del pago.

### Riesgos y mitigaciones
- Riesgo: que ciertos métodos requieran tipo distinto al fallback por defecto.
- Mitigación: se conserva prioridad al valor real cuando sí llega desde frontend; el fallback solo aplica cuando viene omitido.
- Pendientes: monitorear respuestas de producción para confirmar si conviene inferir tipo por BIN/issuer en una siguiente iteración.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: compilar sin errores y permitir payload de checkout sin `payment_method_type` obligatorio.
- Resultado obtenido: lint y typecheck en verde tras ajuste de contrato y endpoint.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se añadió nota de troubleshooting para el error de datos obligatorios y el comportamiento del fallback backend.

## PR: Diagnóstico y hardening de 401 en checkout de Mercado Pago
- Fecha: 2026-04-26
- Objetivo: Reducir fallas 401 en el cobro embebido detectando configuración incorrecta de credenciales y haciendo más robusta la lectura de `MP_ACCESS_TOKEN`.

### Lo aprendido
- El error `401 Unauthorized` en `POST /v1/orders` normalmente proviene de credenciales backend inválidas/mal formateadas, no del Card Payment Brick en frontend.
- En Vercel es frecuente pegar el token como `Bearer ...` o con comillas; al concatenar luego en el header se termina enviando `Bearer Bearer ...`, lo que Mercado Pago rechaza.
- Qué no funcionó y por qué: depender de `trim()` simple en `MP_ACCESS_TOKEN` no cubría prefijo `Bearer` accidental ni comillas envolventes.

### Decisiones técnicas
- Se robusteció `getMercadoPagoAccessToken()` para normalizar token: quitar comillas externas y remover prefijo `Bearer ` si viene incluido.
- Se agregó un mensaje de error explícito para `401` con acción recomendada de configuración en Vercel.
- Se documentó troubleshooting específico en README para separar claramente causas de frontend vs backend en este incidente.
- Razón de la decisión final: minimizar tiempo de diagnóstico operativo y evitar falsos positivos de “error de integración frontend” cuando la causa real es credencial.

### Riesgos y mitigaciones
- Riesgo: ocultar una mala práctica de configuración al “arreglarla” automáticamente en runtime.
- Mitigación: se mantiene mensaje explícito recomendando guardar el token plano sin `Bearer` en entorno.
- Pendientes: validar en producción que no haya mezcla de llaves sandbox/producción entre `NEXT_PUBLIC_MP_PUBLIC_KEY` y `MP_ACCESS_TOKEN`.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: cambios compilan sin errores y el flujo mantiene contrato actual de checkout.
- Resultado obtenido: lint y typecheck en verde tras ajustes de normalización y manejo de error 401.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se agregó guía puntual para diagnosticar 401 de Mercado Pago en despliegue Vercel.

## PR: Hardening adicional para 401 de Mercado Pago (normalización + coherencia de entorno)
- Fecha: 2026-04-26
- Objetivo: Reducir casos residuales de 401 reforzando sanitización de `MP_ACCESS_TOKEN` y detección temprana de mezcla de credenciales sandbox/producción.

### Lo aprendido
- En variables pegadas desde paneles externos puede colarse un carácter BOM (`\uFEFF`) o el formato `Bearer:<token>`, y eso no se corrige con un `trim()` simple.
- La combinación de `NEXT_PUBLIC_MP_PUBLIC_KEY` y `MP_ACCESS_TOKEN` de entornos distintos (`TEST-` vs `APP_USR-`) es una causa frecuente de errores de autorización difíciles de detectar solo con el mensaje genérico de 401.
- Qué no funcionó y por qué: la normalización previa removía comillas y `Bearer ` con espacio, pero no cubría BOM ni variante con dos puntos.

### Decisiones técnicas
- Se amplió `getMercadoPagoAccessToken()` para remover BOM inicial y tolerar prefijo `Bearer` con espacio o `:`.
- Se agregó validación previa en `mpApiFetch` para detectar mezcla de entorno entre `NEXT_PUBLIC_MP_PUBLIC_KEY` y `MP_ACCESS_TOKEN` antes de invocar `/v1/orders`.
- Se actualizó el mensaje de error 401 para reforzar la verificación de entorno y no solo formato del token.
- Razón de la decisión final: mejorar el tiempo de diagnóstico operativo en Vercel y evitar iteraciones ciegas de prueba/error en producción.

### Riesgos y mitigaciones
- Riesgo: falsos positivos si Mercado Pago introduce formatos nuevos de credenciales.
- Mitigación: la validación de entorno solo se activa cuando detecta prefijos claros (`TEST-` o `APP_USR-`), manteniendo compatibilidad con casos no clasificables.
- Pendientes: validar en producción si conviene exponer un endpoint interno de healthcheck de credenciales (sin revelar secretos) para soporte.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: compilar sin errores y mantener contrato actual del checkout.
- Resultado obtenido: lint y typecheck en verde tras hardening de token y validación de entorno.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README amplía troubleshooting de 401 con detalle de sanitización (BOM/`Bearer:`) y coherencia de entorno.


## PR: Guía de configuración de credenciales Mercado Pago en Vercel (sandbox vs producción)
- Fecha: 2026-04-26
- Objetivo: Documentar una guía operativa para evitar mezcla de entornos al usar credenciales de prueba de Mercado Pago en Vercel.

### Lo aprendido
- En Vercel, es común dejar llaves `TEST-` también en el entorno `Production` durante pruebas; esto no rompe técnicamente el checkout, pero impide cobros reales al momento de salida a producción.
- Separar por entorno (`Preview/Development` para sandbox y `Production` para productivo) reduce errores de diagnóstico cuando el negocio espera transacciones reales.
- Qué no funcionó y por qué: asumir que “Production” en Vercel implica automáticamente cobro real; el comportamiento lo define el tipo de credencial, no el nombre del entorno.

### Decisiones técnicas
- Se agregó en README una sección explícita de recomendación de configuración por entorno para Mercado Pago en Vercel.
- Se mantuvo la configuración actual de variables del código (sin cambios funcionales), priorizando claridad operativa/documental para el equipo.
- Razón de la decisión final: resolver la duda de configuración sin introducir riesgo adicional en el flujo de checkout ya estable.

### Riesgos y mitigaciones
- Riesgo: confundir una prueba en `Production` con una salida real a cobro productivo.
- Mitigación: guía textual en README diferenciando prefijos `TEST-` y `APP_USR-` con su uso recomendado por entorno de Vercel.
- Pendientes: cuando se habilite go-live, reemplazar llaves `TEST-` por productivas en `Production` y ejecutar prueba end-to-end real controlada.

### Pruebas
- Tipo: Validación manual estructurada + prueba automatizada de calidad.
- Resultado esperado: documentación actualizada sin romper compilación ni calidad del proyecto.
- Resultado obtenido: lint en verde y nueva guía visible en README.
- Evidencia:
  - `npm run lint` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Cambio documental orientado a operación de credenciales en Vercel.

## PR: Gestión admin de productos (alta + edición con oferta y foto)
- Fecha: 2026-04-26
- Objetivo: Permitir que administradores den de alta y editen productos del marketplace capturando nombre, descripción, foto, precio y configuración de oferta.

### Lo aprendido
- Para desbloquear operación comercial sin backend de catálogo, una persistencia local controlada (`localStorage`) permite validar flujo completo de altas/ediciones desde UI.
- Incluir vista previa inmediata de imagen al cargar archivo reduce errores de captura en operación administrativa.
- Qué no funcionó y por qué: mantener marketplace solo con dataset estático impedía reflejar cambios de administración sin redeploy.

### Decisiones técnicas
- Se creó `/admin/productos` como módulo dedicado de operación para admins.
- Se implementó `AdminProductsManager` con formulario de alta/edición y listado editable de catálogo.
- Se centralizó la lectura/escritura del catálogo en `src/lib/marketplace-catalog.ts` para reutilizar la misma fuente en admin y marketplace público.
- Se actualizó `/marketplace` y `/marketplace/[slug]` para consumir catálogo persistido y reflejar cambios operativos.
- Razón de la decisión final: habilitar valor funcional inmediato con el mínimo riesgo arquitectónico mientras se planifica persistencia server-side.

### Riesgos y mitigaciones
- Riesgo: `localStorage` no sincroniza entre dispositivos ni usuarios.
- Mitigación: documentar que esta iteración es operativa/local y dejar pendiente migración a tabla `products` en Supabase.
- Pendientes: mover catálogo a backend con control de permisos y auditoría de cambios.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + validación manual estructurada.
- Resultado esperado: alta/edición de productos funcional para admin, sin romper calidad del proyecto.
- Resultado obtenido: lint y typecheck en verde; flujo de formulario/listado preparado para operación en `/admin/productos` y reflejo en marketplace.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README documenta alcance del nuevo módulo admin de productos y su persistencia local actual.

## PR: Fix de compilación en Vercel por tipado de `params` en ruta dinámica de marketplace
- Fecha: 2026-04-26
- Objetivo: Corregir el error de build en Vercel causado por un tipado incompatible de `params` en `src/app/marketplace/[slug]/page.tsx`.

### Lo aprendido
- En App Router de Next.js, tipar manualmente `params` en el componente de página puede chocar con los tipos generados de `PageProps` y romper `npm run build` en CI.
- Para Client Components en rutas dinámicas, obtener el parámetro con `useParams` evita acoplarse a una firma de props que puede variar entre versiones de Next.
- Qué no funcionó y por qué: mantener `type ProductDetailPageProps = { params: { slug: string } }` provocó conflicto de tipos donde `params` era esperado como `Promise` por el type-check de build.

### Decisiones técnicas
- Se eliminó el tipo `ProductDetailPageProps` y la recepción de `params` por props en la página de detalle.
- Se adoptó `useParams<{ slug: string }>()` desde `next/navigation` para resolver `slug` directamente en cliente.
- Se mantuvo intacto el resto del flujo (carga de catálogo desde `localStorage`, búsqueda por slug y fallback de producto inexistente).
- Razón de la decisión final: corregir el build con el cambio mínimo y seguro, sin alterar comportamiento comercial del marketplace.

### Riesgos y mitigaciones
- Riesgo: `slug` ausente temporalmente durante hidratación del cliente.
- Mitigación: fallback defensivo `const slug = params?.slug ?? ""` y render existente de “Producto no encontrado”.
- Pendientes: evaluar migrar catálogo y detalle a fuente server-side para reducir dependencia de estado local en cliente.

### Pruebas
- Tipo: Pruebas automatizadas de calidad + typecheck + build de producción.
- Resultado esperado: eliminar error de tipado `PageProps` y compilar correctamente.
- Resultado obtenido: lint y typecheck finalizan sin errores; en este entorno el build no completa por bloqueo de red al descargar fuentes de Google Fonts (`Inter` y `Playfair Display`), sin volver a mostrar el error de tipado reportado.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - `npm run build` falla por `Failed to fetch font` desde `fonts.googleapis.com`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incorpora una sección específica del fix para trazabilidad de despliegue en Vercel.

## PR: Marketplace server-first + enhancer cliente para overrides admin
- Fecha: 2026-04-26
- Objetivo: Migrar `/marketplace` y `/marketplace/[slug]` a Server Components para render inicial SEO-friendly usando `marketplaceProducts`, manteniendo overrides de admin en `localStorage` con un enhancer cliente post-hidratación.

### Lo aprendido
- En App Router, mover el render principal a servidor elimina la dependencia de `useEffect` para mostrar contenido y mejora la garantía de HTML inicial completo para SEO.
- Es viable conservar personalizaciones de admin en navegador con un Client Component pequeño que solo actúa tras hidratar, sin bloquear First Paint del catálogo base.
- Qué no funcionó y por qué: mantener detalle en cliente con `useParams` y carga vía `useEffect` retrasaba contenido inicial y era menos robusto para indexación.

### Decisiones técnicas
- Se removió `"use client"` de `src/app/marketplace/page.tsx` y `src/app/marketplace/[slug]/page.tsx`, renderizando ambos desde datos estáticos server-side (`marketplaceProducts`).
- En `[slug]`, se resolvió el producto en servidor mediante `params` y `getMarketplaceProductBySlug`, además de `generateStaticParams` para pre-render de slugs.
- Se creó `MarketplaceClientEnhancer` para leer `localStorage` tras hidratar y aplicar overrides de admin cuando existan diferencias frente al catálogo base.
- Razón de la decisión final: priorizar SEO/render inicial completo sin perder compatibilidad operativa con personalizaciones locales de administración.

### Riesgos y mitigaciones
- Riesgo: al existir override local, puede haber un cambio visual post-hidratación respecto al HTML inicial.
- Mitigación: el enhancer solo activa override cuando detecta diferencias reales y oculta explícitamente el bloque server para evitar duplicidad visual.
- Pendientes: migrar catálogo admin a persistencia server-side para eliminar dependencia de `localStorage` y evitar flicker en overrides.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estructural de render server-first.
- Resultado esperado: páginas de marketplace sin hooks cliente para render inicial, con contenido base en HTML inicial y compatibilidad de lint/typecheck.
- Resultado obtenido: lint y typecheck en verde; verificación estática confirma ausencia de `"use client"`, `useEffect` y `useParams` en páginas objetivo.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - `rg -n "^\"use client\"|useEffect|useParams" src/app/marketplace/page.tsx src/app/marketplace/[slug]/page.tsx` sin coincidencias.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README agrega nota del enfoque server-first y del papel de `MarketplaceClientEnhancer` para overrides post-hidratación.

## PR: SiteShell servidor + islas cliente para header y WhatsApp
- Fecha: 2026-04-26
- Objetivo: Reducir JavaScript hidratado en páginas informativas moviendo `SiteShell` a Server Component y aislando la interactividad en componentes cliente dedicados.

### Lo aprendido
- Convertir el shell principal a componente servidor conserva SSR/estructura estática sin perder UX si la lógica interactiva se mueve a “islas” cliente con props serializables.
- Mantener `links` y `href` como datos planos (`string[]`/objetos simples) evita pasar funciones no serializables entre fronteras server/client.
- El header puede seguir leyendo estado global (`auth/cart`) desde un componente cliente aislado sin forzar que todo el layout sea cliente.

### Decisiones técnicas
- `src/components/site-shell.tsx` se convirtió a Server Component y ahora solo renderiza estructura estática: fondo, header contenedor, hero base y footer.
- Se extrajo la interacción del encabezado a `HeaderInteractive` (menú mobile, menú de usuario y badge de carrito) como Client Component.
- Se extrajo el botón movible de WhatsApp a `FloatingWhatsAppButton` como Client Component recibiendo solo `href` serializable.
- Se conservaron clases CSS actuales para minimizar riesgo visual y evitar regresiones de estilo.

### Pruebas
- Tipo: Prueba automatizada de calidad + build de producción con limitación de red.
- Resultado: `npm run lint` pasa sin errores; `npm run build` no completa por bloqueo de red al descargar Google Fonts, sin errores nuevos atribuibles al refactor server/client.
- Evidencia:
  - `npm run lint` OK.
  - `npm run build` falla con `Failed to fetch font 'Inter'` y `Failed to fetch font 'Playfair Display'` desde `fonts.googleapis.com`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se añadió en README el cambio arquitectónico hacia shell servidor + islas cliente para reducir JS en rutas informativas.

## PR: Optimización de `next/image` en grids, marketplace y carrito
- Fecha: 2026-04-26
- Objetivo: Añadir `sizes` realista en imágenes de tarjetas/grids, limitar `priority` a la imagen principal above-the-fold y reducir solicitudes de ancho innecesario en marketplace/carrito.

### Lo aprendido
- `next/image` sin `sizes` en layouts responsivos de tarjetas puede sobredimensionar el recurso solicitado, sobre todo cuando la UI termina mostrando columnas estrechas.
- Definir una convención explícita por patrón visual (grid de 1/2/3 columnas, detalle 2 columnas, miniatura fija de carrito) ayuda a mantener consistencia de rendimiento en nuevos componentes.
- Qué no funcionó y por qué: depender de valores implícitos de `next/image` no refleja correctamente el ancho visual real de tarjetas en todos los breakpoints.

### Decisiones técnicas
- Se agregó `sizes` en todas las imágenes de grids/tarjetas de `marketplace`, `arreglos`, home (moodboard) y carrito.
- Se marcó con `priority` únicamente la imagen principal del detalle de producto en `/marketplace/[slug]` (above-the-fold).
- Se mantuvo lazy loading por defecto para el resto de imágenes al no usar `priority`.
- Razón de la decisión final: mejorar rendimiento percibido y uso de red con cambios acotados, sin alterar el diseño ni la estructura de rutas.

### Riesgos y mitigaciones
- Riesgo: desalineación futura entre `sizes` y CSS si cambian breakpoints/columnas.
- Mitigación: se documentó la convención de `sizes` en README para que nuevos cambios visuales actualicen ambos lados (CSS + `sizes`).
- Pendientes: revisar la convención si se agregan nuevos layouts con reglas de columnas diferentes.

### Pruebas
- Tipo: Pruebas automatizadas de calidad + validación estática de TypeScript.
- Resultado esperado: proyecto sin errores de lint/typecheck tras añadir `sizes` y `priority` acotado.
- Resultado obtenido: checks en verde.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README ahora incluye convención operativa de `sizes` y regla de uso de `priority` para componentes visuales nuevos.

## PR: Fix de build en Vercel por tipado de `params` en detalle de marketplace
- Fecha: 2026-04-26
- Objetivo: Corregir el error de compilación en Vercel/Next 15 donde la página `src/app/marketplace/[slug]/page.tsx` no cumplía el contrato de `PageProps` esperado para `params`.

### Lo aprendido
- En este proyecto con Next.js 15, la validación de tipos de build puede exigir `params` como `Promise` en la firma de páginas dinámicas de App Router.
- Un desajuste en el tipo de `params` puede pasar desapercibido en desarrollo pero romper despliegue en la fase de `Linting and checking validity of types`.
- Qué no funcionó y por qué: usar `params: { slug: string }` en la firma de la página generó incompatibilidad con `PageProps` durante `next build` en Vercel.

### Decisiones técnicas
- Se actualizó `ProductDetailPageProps` para tipar `params` como `Promise<{ slug: string }>`.
- La página `ProductDetailPage` pasó a `async` y ahora resuelve `slug` con `const { slug } = await params`.
- Se mantuvo intacta la lógica de búsqueda de producto y rendering de la vista para minimizar riesgo funcional.
- Razón de la decisión final: aplicar el cambio mínimo necesario para restaurar compatibilidad de build en Vercel sin alterar experiencia de usuario.

### Riesgos y mitigaciones
- Riesgo: introducir cambios colaterales en la ruta dinámica por refactor innecesario.
- Mitigación: se limitó el ajuste al tipado/firma de props y a la lectura de `slug`.
- Pendientes: evaluar en una iteración futura si conviene tipar de forma compartida todas las rutas dinámicas para evitar regresiones similares.

### Pruebas
- Tipo: Pruebas automatizadas de calidad + typecheck + build en entorno restringido.
- Resultado esperado: eliminar el error de `PageProps` en `/marketplace/[slug]`.
- Resultado obtenido: `lint` y `tsc` pasan correctamente; `build` en este entorno falla por descarga de Google Fonts, sin volver a mostrar el error de tipado reportado.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - `npm run build` falla por `Failed to fetch font` desde `fonts.googleapis.com`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se añadió en README la trazabilidad del fix con referencia explícita al error de Vercel.

## PR: Agrupación memoizada de productos por categoría en override cliente de marketplace
- Fecha: 2026-04-26
- Objetivo: Optimizar el render del marketplace cuando existen overrides de admin, eliminando filtros repetidos por categoría y manteniendo compatibilidad de anclas.

### Lo aprendido
- Recalcular `filter` por cada categoría en cada render es evitable cuando ya existe una lista de productos en memoria; un agrupado memoizado simplifica y hace más predecible el costo de render.
- Derivar chips de categorías desde la misma estructura agrupada evita desalineaciones entre navegación y secciones visibles.
- Qué no funcionó y por qué: mantener `categories.map(...filter...)` duplicaba recorrido de datos y dispersaba la lógica de agrupación en el JSX.

### Decisiones técnicas
- Se implementó `useMemo` para agrupar `overrideProducts` con `reduce` a una estructura por categoría y exponerla como arreglo de secciones `{ category, products }`.
- Se agregó un segundo `useMemo` para derivar la lista de categorías a partir del agrupado.
- Se cambió el render para iterar directamente `groupedOverrideProducts`, eliminando `filter` dentro del map.
- Se mantuvo `getCategoryId` sin cambios para conservar `id`/anclas existentes (`categoria-...`).
- Razón de la decisión final: reducir trabajo en render con un ajuste acotado, manteniendo comportamiento y rutas actuales.

### Riesgos y mitigaciones
- Riesgo: alterar accidentalmente el orden visual de categorías/productos en el override cliente.
- Mitigación: el agrupado respeta orden de aparición original en `overrideProducts` al construir secciones.
- Pendientes: evaluar reutilizar el mismo patrón de agrupado en render server de `/marketplace` para homologar implementación en ambos lados.

### Pruebas
- Tipo: Prueba automatizada de calidad.
- Resultado esperado: proyecto sin errores de lint tras refactor de agrupación.
- Resultado obtenido: lint en verde.
- Evidencia:
  - `npm run lint` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye sección en historial sobre el refactor de agrupación memoizada del override cliente.

## PR: Mensaje accionable en error del Card Payment Brick (producción vs test)
- Fecha: 2026-04-26
- Objetivo: Corregir el diagnóstico del error genérico del formulario de pago para mostrar una causa accionable cuando el Brick no puede obtener métodos de pago de la tarjeta.

### Lo aprendido
- El `onError` del Card Payment Brick puede incluir `cause.code`/`cause.description`; ignorarlo deja al usuario con un mensaje genérico sin pista operativa.
- El error de obtención de métodos/BIN es frecuente cuando se prueban tarjetas de test con llaves productivas (`APP_USR`) o hay datos de tarjeta inválidos.
- Qué no funcionó y por qué: usar siempre el texto fijo "Hubo un problema en el formulario..." no permite distinguir entre error de configuración de entorno y error de captura.

### Decisiones técnicas
- Se añadió un parser de error del Brick en frontend (`getHumanReadableBrickError`) para traducir códigos/causas a mensajes útiles.
- Se detecta si la `NEXT_PUBLIC_MP_PUBLIC_KEY` es productiva (`APP_USR-`) para devolver una recomendación explícita sobre no mezclar tarjetas de prueba con producción.
- Se mantuvo `console.error` para conservar trazabilidad técnica completa en logs.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: lint/typecheck en verde tras el cambio y sin regresiones de tipado en checkout.
- Resultado obtenido: checks en verde.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye troubleshooting específico para el error del Brick de "No pudimos obtener la información de pago" en escenarios producción/test.

## PR: CRUD server-side de productos admin en Supabase
- Fecha: 2026-04-26
- Objetivo: Migrar la gestión de productos del admin desde persistencia local a endpoints server-side con Supabase como fuente primaria de catálogo.

### Lo aprendido
- Un módulo admin con `localStorage` desbloquea validación temprana, pero para operación real multiusuario se requiere mover escritura/lectura a backend centralizado.
- En App Router, proteger endpoints con validación de sesión + rol admin en servidor permite exponer CRUD sin filtrar credenciales privilegiadas al cliente.
- Qué no funcionó y por qué: mantener `saveStoredMarketplaceProducts` como flujo principal impedía sincronización entre usuarios/dispositivos y no ofrecía trazabilidad server-side.

### Decisiones técnicas
- Se crearon endpoints `GET/POST /api/admin/products` y `PUT/DELETE /api/admin/products/[slug]` usando `supabaseAdminRequest` + guard de admin con `getCurrentUserProfile`.
- Se actualizó `AdminProductsManager` para consumir API como camino principal (carga inicial, alta/edición, eliminación).
- Se dejó `localStorage` solo como fallback opcional bajo `NEXT_PUBLIC_MARKETPLACE_LOCAL_FALLBACK=true`.
- Se ajustó `src/lib/marketplace-catalog.ts` para centralizar mapeo Supabase↔catálogo y lectura server-side de productos, manteniendo fallback al dataset estático por compatibilidad.
- Se migró `/marketplace` y `/marketplace/[slug]` para leer catálogo desde la capa común conectada a Supabase.
- Razón de la decisión final: priorizar un flujo de catálogo server-first y administrable sin romper compatibilidad temporal en entornos sin backend disponible.

### Riesgos y mitigaciones
- Riesgo: ausencia de `SUPABASE_SERVICE_ROLE_KEY` bloquea CRUD y lectura server-side desde Supabase.
- Mitigación: fallback a catálogo estático para render público y fallback local opcional por feature flag para operación temporal.
- Pendientes: consolidar esquema/constraints de tabla `public.products` y definir estrategia de auditoría/versionado de cambios de catálogo.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + build en entorno restringido.
- Resultado esperado: CRUD admin conectado a API server-side y marketplace consumiendo capa común backend-compatible sin romper calidad.
- Resultado obtenido: lint y typecheck en verde; build falla por restricción de red al descargar Google Fonts, sin errores nuevos atribuibles al cambio.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - `npm run build` falla con `Failed to fetch font` desde `fonts.googleapis.com`.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documentó feature flag de fallback local y la transición del catálogo a fuente server-side en Supabase.

## PR: Versionado visible del sitio en footer
- Fecha: 2026-04-26
- Objetivo: Mostrar una versión legible del sitio en el footer global para trazabilidad rápida de despliegues.

### Lo aprendido
- Exponer la versión en un componente compartido como `SiteShell` garantiza cobertura automática en todas las rutas sin cambios adicionales por página.
- Permitir override por variable pública de entorno (`NEXT_PUBLIC_SITE_VERSION`) simplifica etiquetar versiones por ambiente (preview/staging/producción).
- Qué no funcionó y por qué: depender únicamente de una etiqueta manual en UI obliga a editar código para cada release y aumenta riesgo de desalineación.

### Decisiones técnicas
- Se actualizó `src/components/site-shell.tsx` para renderizar `v<versión>` dentro del footer global.
- Se tomó como prioridad `NEXT_PUBLIC_SITE_VERSION` (trim) y fallback a `version` de `package.json`.
- Se mantuvo el enlace a aviso de privacidad sin cambios para no alterar navegación legal.
- Razón de la decisión final: implementar versionado visible con un cambio mínimo, centralizado y configurable.

### Riesgos y mitigaciones
- Riesgo: que la versión visible no coincida con release esperado si no se actualiza variable por entorno.
- Mitigación: fallback automático a `package.json` evita valor vacío y mantiene una referencia base consistente.
- Pendientes: definir convención de versionado por ambiente (por ejemplo `1.2.0-beta.3`) en pipeline de despliegue.

### Pruebas
- Tipo: Prueba automatizada de calidad.
- Resultado esperado: proyecto sin errores de lint tras agregar lectura de versión en footer.
- Resultado obtenido: lint en verde.
- Evidencia:
  - `npm run lint` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README ahora documenta `NEXT_PUBLIC_SITE_VERSION` y el comportamiento de fallback con `package.json`.

## PR: Corrección de request 400 en checkout Mercado Pago
- Fecha: 2026-04-26
- Objetivo: Corregir el payload enviado a Mercado Pago durante el pago con tarjeta para evitar errores 400 por estructura inválida en la API.

### Lo aprendido
- Para Card Payment Brick, el backend debe procesar el pago con el contrato mínimo documentado de `POST /v1/payments` y no asumir que el payload de Orders API aplica igual en todos los casos.
- Incluir detalles de `cause` en errores de la API acelera diagnóstico cuando Mercado Pago rechaza campos por formato o propiedades no soportadas.
- Mantener recalculo de monto desde catálogo backend sigue siendo clave incluso al cambiar de endpoint, para no confiar en montos del frontend.

### Decisiones técnicas
- Se migró la llamada de backend de `POST /v1/orders` a `POST /v1/payments` en `create-order`, manteniendo la misma ruta interna para no romper el frontend.
- Se ajustó persistencia para guardar `payment.id`, `payment.order.id` (si existe) y fallback estable cuando no llega `order.id`.
- Se amplió el parser de errores de Mercado Pago para adjuntar `cause.code` y `cause.description` en excepciones backend.

### Pruebas
- Tipo: Pruebas automatizadas de calidad + validación estática de TypeScript.
- Resultado: Lint y chequeo de tipos sin errores.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documentó el ajuste de endpoint y la razón del fix para troubleshooting de errores 400 en pagos.

## PR: Fix de error al agregar producto por tabla `public.products` faltante
- Fecha: 2026-04-27
- Objetivo: Corregir el alta de productos en `/admin/productos` cuando Supabase devuelve `Could not find the table 'public.products' in the schema cache`.

### Lo aprendido
- El CRUD admin ya estaba implementado contra `/rest/v1/products`, pero faltaba versionar una migración que garantizara la existencia física de `public.products`.
- PostgREST reporta este caso típicamente con `PGRST205`; mapear ese código a un mensaje funcional acelera diagnóstico para operación.
- Qué no funcionó y por qué: asumir que el bloque condicional de RLS en la migración de roles era suficiente; ese bloque solo aplica políticas si la tabla ya existe, no la crea.

### Decisiones técnicas
- Se creó la migración `supabase/migrations/20260427_products_catalog.sql` para declarar explícitamente `public.products` con el contrato de columnas esperado por API/admin/marketplace.
- Se incluyeron índices básicos (`name`, `category`), trigger `updated_at` y políticas RLS (`Products public read` + `Products admin write`).
- Se mejoró `src/lib/supabase-admin.ts` para transformar errores de tabla faltante en un mensaje accionable en español.
- Razón de la decisión final: resolver la causa raíz en base de datos y además mejorar experiencia de soporte cuando una instancia aún no aplicó migraciones.

### Riesgos y mitigaciones
- Riesgo: ejecutar la migración en una base con políticas personalizadas podría requerir ajuste fino de permisos.
- Mitigación: uso de `if not exists`/`drop policy if exists` para mantener idempotencia y minimizar choques en re-ejecución.
- Pendientes: definir si el catálogo debe exponer lectura pública directa por RLS o mantenerse 100% vía backend server-side a largo plazo.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: proyecto sin regresiones de lint/tipos tras incorporar migración y manejo de errores.
- Resultado obtenido: checks en verde.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README documenta el paso operativo para aplicar la migración y explica el origen del error de schema cache.

## PR: Acceso directo a gestión de productos desde dashboard admin
- Fecha: 2026-04-27
- Objetivo: Evitar que el usuario administrador tenga que ir al menú principal para encontrar la gestión de productos, exponiendo ese acceso directamente en su dashboard autenticado.

### Lo aprendido
- Cuando el rol admin opera desde `/mi-cuenta`, concentrar accesos críticos en una sola tarjeta reduce pasos y evita navegación innecesaria por menú.
- El dashboard de cuenta funciona mejor como “hub operativo” si incluye pedidos, usuarios y productos sin cambiar de contexto.
- Qué no funcionó y por qué: dejar solo pedidos/usuarios en la tarjeta de administración obligaba al admin a buscar productos en navegación global.

### Decisiones técnicas
- Se añadió un botón `Productos admin` en la tarjeta de administración de `AccountDashboardClient` apuntando a `/admin/productos`.
- Se actualizó el texto descriptivo de esa tarjeta para explicitar cobertura de catálogo, pedidos y usuarios.
- Razón de la decisión final: resolver la necesidad con el cambio más pequeño posible, sin alterar rutas ni permisos existentes.

### Riesgos y mitigaciones
- Riesgo: saturar visualmente la tarjeta al agregar otro CTA.
- Mitigación: se reutilizó la misma fila de acciones (`cta-row`) y estilo existente (`btn btn-ghost`) para mantener consistencia visual.
- Pendientes: evaluar en una iteración posterior si conviene priorizar orden de CTAs según uso real (analytics).

### Pruebas
- Tipo: Prueba automatizada de calidad.
- Resultado esperado: lint sin errores tras actualizar dashboard de cuenta.
- Resultado obtenido: lint en verde.
- Evidencia:
  - `npm run lint` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye el cambio en módulos y en historial de cambios para trazabilidad operativa.

## PR: Fix de checkout Mercado Pago para montos menores al mínimo
- Fecha: 2026-04-27
- Objetivo: Evitar el error `empty_installments` en checkout cuando el total del carrito está por debajo del mínimo procesable con tarjeta.

### Lo aprendido
- El Card Payment Brick puede devolver `empty_installments` cuando el monto no habilita cuotas/métodos de pago para la tarjeta en ese contexto.
- Prevenir el caso con validación de negocio en frontend y backend elimina ruido de errores técnicos para usuario final.
- Qué no funcionó y por qué: permitir checkout con total de `$1 MXN` disparaba un flujo no elegible para tarjeta y terminaba en error del Brick.

### Decisiones técnicas
- Se definió una constante compartida `MIN_MX_CARD_PAYMENT_AMOUNT = 10` en la capa de utilidades de Mercado Pago.
- Se agregó guard en `CheckoutClient` para mostrar estado bloqueado cuando el total es menor al mínimo en lugar de montar el Brick.
- Se agregó validación server-side en `create-order` para rechazar montos menores al mínimo antes de invocar `/v1/payments`.
- Razón de la decisión final: centralizar regla de monto mínimo y aplicar defensa en profundidad (UI + API) para evitar regresiones.

### Riesgos y mitigaciones
- Riesgo: que el mínimo por país/cuenta cambie y el valor hardcodeado quede desactualizado.
- Mitigación: se centralizó en una sola constante para ajustar rápidamente sin tocar múltiples archivos.
- Pendientes: evaluar mover este mínimo a variable de entorno si negocio requiere ajustes por cuenta/mercado.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript + validación manual estructurada.
- Resultado esperado: proyecto en verde y checkout bloqueado correctamente bajo `$10 MXN`.
- Resultado obtenido: lint y typecheck en verde; comportamiento preventivo incorporado para montos menores al mínimo.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.
  - Revisión manual del flujo con total `$1 MXN` mostrando mensaje de monto mínimo en checkout.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incluye el fix, su impacto y el flujo de validación aplicado en frontend/backend.

## PR: Ajuste tipográfico global para una estética más elegante
- Fecha: 2026-04-27
- Objetivo: Reducir el tamaño de letra de forma global para que el sitio se perciba más sobrio y elegante sin alterar estructura ni flujos funcionales.

### Lo aprendido
- En una base visual construida mayormente con unidades `rem`, un ajuste del `font-size` raíz permite escalar tipografía en todo el sitio de manera consistente y de bajo riesgo.
- Para cambios de dirección visual (más editorial, menos dominante), conviene priorizar ajustes globales antes de microajustes por componente.
- Qué no funcionó y por qué: bajar tamaños de forma aislada por módulo incrementa costo de mantenimiento y puede romper coherencia tipográfica entre rutas.

### Decisiones técnicas
- Se aplicó `html { font-size: 93.75%; }` en `src/app/globals.css` para reducir la escala tipográfica global.
- Se evitó modificar uno por uno los `font-size` de componentes porque el sitio ya usa una jerarquía basada en `rem`.
- Razón de la decisión final: obtener un resultado uniforme en todo el sitio con el cambio mínimo, reversible y fácil de calibrar.

### Riesgos y mitigaciones
- Riesgo: que algunos textos de apoyo queden demasiado pequeños en pantallas reducidas.
- Mitigación: reducción moderada (6.25%) para conservar legibilidad y jerarquía visual.
- Pendientes: validar en una iteración posterior si se requiere ajuste puntual en labels o captions de módulos específicos.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: proyecto sin errores de lint/tipos después del ajuste tipográfico global.
## PR: Fix de "Producto inválido" en checkout por carrito desactualizado
- Fecha: 2026-04-27
- Objetivo: Evitar que el checkout falle cuando `localStorage` conserva productos antiguos o slugs que ya no existen en el catálogo actual.

### Lo aprendido
- El carrito persistido puede quedar desfasado respecto al catálogo vigente y disparar validaciones backend de `Producto inválido`.
- Sanitizar el carrito al hidratarse desde `localStorage` evita que datos legacy lleguen al checkout y a la API de pago.
- Qué no funcionó y por qué: confiar en que todo item persistido en cliente seguiría existiendo en `marketplaceProducts`.

### Decisiones técnicas
- Se agregó saneamiento del carrito al cargar `localStorage`, conservando únicamente productos existentes y cantidades válidas.
- El saneamiento rehidrata datos canónicos del catálogo (nombre/precio/imagen/categoría) para evitar drift en campos derivados.
- Se ajustó la API de `create-order` para clasificar errores de validación de línea de compra como `400` en vez de `500`.

### Riesgos y mitigaciones
- Riesgo: eliminar items legacy podría sorprender a usuarios con carrito viejo.
- Mitigación: priorizar consistencia del checkout y evitar bloqueos de pago por datos inválidos.
- Pendientes: evaluar aviso UI explícito cuando se depuren productos inválidos del carrito.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: proyecto sin errores de lint/tipos y flujo robusto frente a slugs inválidos.
- Resultado obtenido: checks en verde.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README registra el ajuste tipográfico global y su impacto visual para trazabilidad de diseño.
- Notas: README incluye el comportamiento de saneamiento de carrito y clasificación de errores de validación en checkout.

## PR: Flujo de versionado SemVer + bitácora de versiones
- Fecha: 2026-04-27
- Objetivo: Implementar un flujo de versionado práctico que incremente versión según magnitud del cambio (pequeño/grande/ruptura) y dejar una bitácora consultable por versión dentro del repositorio.

### Lo aprendido
- Definir explícitamente niveles operativos (`small`, `big`, `breaking`) reduce ambigüedad al momento de decidir incrementos y evita ediciones manuales inconsistentes en `package.json`.
- Una bitácora dedicada (`CHANGELOG.md`) funciona mejor para trazabilidad por versión que depender solo del historial largo dentro de `README`.
- Qué no funcionó y por qué: mantener únicamente `NEXT_PUBLIC_SITE_VERSION` como referencia visual no resolvía el problema de gobernanza de releases ni el registro detallado de cambios por versión.

### Decisiones técnicas
- Se creó `scripts/release.mjs` para centralizar la lógica de bump SemVer (`patch/minor/major`) con la semántica `small/big/breaking`.
- Se añadieron scripts `npm` (`release:small`, `release:big`, `release:breaking`) para estandarizar ejecución.
- Se creó `CHANGELOG.md` como bitácora oficial de versiones y se registró la primera entrada del nuevo flujo (`v0.2.0`).
- Se evaluó este cambio como **grande** por impacto transversal en operación de releases y documentación del repositorio; por eso se aplicó incremento `minor` (`0.1.0` → `0.2.0`).
- Razón de la decisión final: resolver versionado y trazabilidad con un mecanismo simple, reproducible y sin dependencias externas.

### Riesgos y mitigaciones
- Riesgo: ejecutar scripts de release sin notas suficientes puede generar entradas pobres en bitácora.
- Mitigación: el script exige `--notes` y permite múltiples bullets para documentar alcance.
- Pendientes: evaluar validación adicional para evitar releases duplicados en la misma fecha y/o integrar este flujo al pipeline CI.

### Pruebas
- Tipo: Prueba automatizada de flujo + prueba automatizada de calidad.
- Resultado esperado: incremento de versión correcto y registro automático en bitácora sin romper calidad del proyecto.
- Resultado obtenido: incremento aplicado a `0.2.0`, bitácora actualizada y lint en verde.
- Evidencia:
  - `npm run release:big -- --notes="Implementación del flujo de versionado SemVer con niveles small/big/breaking|Creación de bitácora de versiones persistente en CHANGELOG.md|Documentación de proceso de release en README"` OK.
  - `npm run lint` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documentó convención de incrementos, comandos operativos de release y uso de `CHANGELOG.md` como bitácora por versión.

## PR: Diagnóstico de request para error "Producto inválido" en checkout Mercado Pago
- Fecha: 2026-04-27
- Objetivo: Revisar y dejar trazabilidad de cómo se construye el request de pago hacia Mercado Pago cuando aparece `Producto inválido: producto-de-prueba`.

### Lo aprendido
- El checkout embebido envía únicamente `slug` + `quantity` de cada línea, y el backend recalcula precio/nombre desde catálogo para evitar manipulación de montos.
- El error `Producto inválido` ocurre antes de llamar a Mercado Pago cuando el `slug` recibido no existe en `marketplaceProducts` del backend.
- Incluir logs estructurados del payload valorizado (sin token) acelera diagnóstico entre frontend, API y catálogo publicado.

### Decisiones técnicas
- Se normalizó el `slug` en validación server-side (`trim` + `lowercase`) para tolerar variaciones de formato no maliciosas.
- Se mejoró el mensaje de error para indicar explícitamente que el valor enviado no existe en el catálogo actual.
- Se agregó `console.info` en `create-order` con `transaction_amount`, `installments`, `payment_method_id`, `payer_email` e items valorizados para revisar construcción real del request saliente a Mercado Pago.

### Pruebas
- Tipo: Pruebas automatizadas de calidad + tipado estático.
- Resultado: Lint y TypeScript sin errores tras ajustes de validación/logging.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documenta la ruta exacta de validación y los campos logueados para troubleshooting del checkout.

## PR: Fix de "Producto inválido" en checkout con catálogo dinámico de backend
- Fecha: 2026-04-27
- Objetivo: Evitar rechazos de checkout cuando el carrito contiene slugs válidos del catálogo administrado en backend (Supabase) pero no presentes en el catálogo estático local.

### Lo aprendido
- El catálogo usado por el marketplace puede divergir del seed estático cuando administración ya publica productos en Supabase.
- Validar checkout solo contra catálogo estático genera falsos negativos de `Producto inválido` aunque el producto sí esté vigente en operación.
- Qué no funcionó y por qué: usar únicamente `marketplaceProducts` en `validateAndPriceLineItems` ignoraba productos dinámicos creados desde admin.

### Decisiones técnicas
- Se incorporó una resolución de catálogo para checkout que prioriza productos de backend (`fetchMarketplaceProductsFromBackend`) y conserva fallback estático.
- Se cambió `validateAndPriceLineItems` a función asíncrona para esperar catálogo vigente antes de valorizar líneas.
- Se actualizó `POST /api/mercadopago/create-order` para usar `await` al validar y valuar ítems.
- Razón de la decisión final: mantener seguridad de recálculo server-side sin romper compatibilidad con catálogo administrado en producción.

### Riesgos y mitigaciones
- Riesgo: dependencia de disponibilidad de lectura backend al momento de checkout.
- Mitigación: fallback explícito a catálogo estático cuando backend no responde o está vacío.
- Pendientes: evaluar cache corto en servidor para reducir latencia de lectura de catálogo en picos de checkout.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: compilar/lint sin errores y permitir slugs de catálogo dinámico en validación de checkout.
- Resultado obtenido: checks en verde; flujo backend actualizado para resolver catálogo vigente.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README documenta el cambio de fuente de catálogo para validación de checkout.

## PR: Pantalla de éxito para checkout con resumen persistido
- Fecha: 2026-04-27
- Objetivo: Implementar una ruta de éxito post-pago que confirme explícitamente pago acreditado y muestre resumen de compra + productos desde metadatos persistidos en órdenes.

### Lo aprendido
- Para evitar perder trazabilidad tras limpiar carrito, el detalle de productos debe recuperarse desde `orders.metadata.items` y no desde estado local.
- Redirigir desde checkout al éxito con `router.push` y parámetros mínimos simplifica continuidad UX y mantiene desacoplado el render de confirmación.
- Qué no funcionó y por qué: mantener solo feedback local en `/checkout` no cubría necesidad de comprobante persistente ni CTA de siguiente acción.

### Decisiones técnicas
- Se creó la ruta `src/app/checkout/exito/page.tsx` con `SiteShell`, lectura de `searchParams` esperados y consulta server-side a `orders` por `external_reference`.
- Se implementó resumen de pago (ID, referencia, estado, total, fecha/hora) y tabla de productos con nombre/cantidad/precio unitario/subtotal.
- Se actualizó `checkout-client` para redirigir cuando `normalized === "approved"`, enviar query params mínimos y limpiar carrito tras iniciar navegación.
- Razón de la decisión final: balancear confirmación transaccional clara y experiencia de cierre emocional sin depender de sesión de carrito.

### Riesgos y mitigaciones
- Riesgo: orden no encontrada por `external_reference` al llegar a éxito.
- Mitigación: fallback de UI que conserva resumen mínimo por query params y mensaje de soporte cuando faltan productos.
- Pendientes: enlazar “Ver mis pedidos” con historial real filtrado por usuario autenticado.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: lint/typecheck en verde y compilación de la nueva ruta de éxito sin errores.
- Resultado obtenido: checks en verde.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incorpora la nueva ruta `/checkout/exito`, el flujo de redirección y el uso de metadatos persistidos para el resumen de productos.

## PR: Imágenes de catálogo en Supabase Storage sin Base64
- Fecha: 2026-04-27
- Objetivo: Reemplazar el flujo de imágenes Base64 por subida a Supabase Storage y garantizar que `products.image` guarde solo URL/path liviano.

### Lo aprendido
- Guardar imágenes como `data:image/...` rompe escalabilidad (payloads pesados, escritura innecesaria en DB y riesgo de exceder límites de almacenamiento local).
- Un endpoint backend para upload con `service_role` mantiene el secreto fuera del cliente y simplifica validaciones de tipo/tamaño.
- Normalizar y validar la referencia de imagen en capa API evita regresiones aunque cambie el cliente en el futuro.

### Decisiones técnicas
- Se creó bucket dedicado `product-images` mediante migración SQL con lectura pública y escritura restringida a admins autenticados.
- Se implementó `/api/admin/products/upload-image` para recibir `multipart/form-data`, subir a Storage y devolver `path/publicUrl`.
- Se bloquearon payloads con `data:image/` en `POST/PUT` de productos, aceptando solo URL/path.
- Se sanitizó fallback local para persistir únicamente metadatos y referencias de imagen válidas.

### Pruebas
- Tipo: Prueba automatizada de calidad (lint) + validación estática de flujos de payload y persistencia.
- Resultado: Lint sin errores; flujo admin preparado para subida de archivo a storage y rechazo explícito de data URLs en API.
- Evidencia:
  - `npm run lint` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Se documentó creación de bucket y consideraciones para lectura pública vs URLs firmadas.

## PR: Fix de versionado de migración para Supabase Storage
- Fecha: 2026-04-27
- Objetivo: Corregir conflicto de versión duplicada en `schema_migrations` al aplicar migraciones de Supabase.

### Lo aprendido
- Supabase toma la versión de migración desde el prefijo numérico del nombre de archivo; usar `20260427_...` puede colisionar con otras migraciones del mismo día.
- Para evitar `duplicate key value violates unique constraint "schema_migrations_pkey"`, conviene usar timestamp completo `YYYYMMDDHHMMSS` en el nombre.

### Decisiones técnicas
- Se renombró la migración a `20260427120000_product_images_storage.sql` para garantizar unicidad.
- Se actualizó documentación en README para referenciar el nombre correcto.

### Pruebas
- Tipo: Prueba automatizada de calidad.
- Resultado: Lint sin errores; se elimina causa de colisión por versión duplicada al ejecutar migraciones.
- Evidencia:
  - `npm run lint` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: Ajuste correctivo de naming; sin cambios funcionales en SQL.

## PR: Endpoint canónico de resumen de orden para checkout éxito
- Fecha: 2026-04-27
- Objetivo: Exponer un endpoint de lectura para comprobante (`/api/mercadopago/order-summary`) y migrar `/checkout/exito` para consumir datos canónicos de `orders/payments` en lugar de depender de estado local.

### Lo aprendido
- Para la pantalla de éxito, consultar un endpoint dedicado evita acoplar la UI a parámetros incompletos de redirección o al estado efímero del carrito.
- Soportar lookup por `external_reference` y `payment_id` reduce fricción operativa cuando solo uno de los identificadores está disponible.
- Qué no funcionó y por qué: confiar solo en query params del redirect no garantiza consistencia de estado (especialmente en `pending/rejected` y reconciliación tardía por webhook).

### Decisiones técnicas
- Se creó `GET /api/mercadopago/order-summary` con búsqueda por `external_reference` y/o `payment_id`, reconciliando datos entre tablas `orders` y `payments` vía `supabaseAdminRequest`.
- El endpoint retorna únicamente campos de recibo (estado consolidado, total, email, método de pago, items y timestamps) para evitar exposición de `raw_response` o metadatos sensibles.
- Se reemplazó la lógica server-side directa de `/checkout/exito` por un cliente que consume el endpoint y muestra mensajes diferenciados para `pending` y `rejected`, además de fallback de soporte cuando no hay coincidencia.
- Razón de la decisión final: centralizar la “fuente de verdad” del comprobante y dejar la UI desacoplada de detalles de persistencia.

### Riesgos y mitigaciones
- Riesgo: no encontrar coincidencia cuando webhook aún no ha reconciliado tablas.
- Mitigación: fallback con mensaje accionable y datos de referencia/pago para soporte.
- Pendientes: evaluar autenticación/ownership del endpoint para escenarios multiusuario y endurecer aún más minimización de campos por rol.

### Pruebas
- Tipo: Prueba automatizada de calidad + validación estática de TypeScript.
- Resultado esperado: endpoint y página de éxito compilan/lint sin errores, con flujo de render por estados.
- Resultado obtenido: checks en verde.
- Evidencia:
  - `npm run lint` OK.
  - `npx tsc --noEmit` OK.

### Documentación
- README actualizado: Sí
- AGENTS actualizado: Sí
- Notas: README incorpora nuevo endpoint, parámetros soportados y comportamiento de la pantalla de éxito por estado.
