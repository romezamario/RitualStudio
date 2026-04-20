# RitualStudio

Starter oficial del sitio de **Ritual Studio**, un estudio floral premium enfocado en arreglos diseñados a la medida.

## Estado actual del sitio

### Stack base
- Next.js (App Router) + TypeScript.
- CSS global custom (sin dependencia activa de Tailwind en build).
- ESLint con configuración de Next.js.
- Estructura con `src/` y alias `@/*`.

### Módulos/páginas iniciales
- ` / ` Inicio con propuesta de valor y CTAs.
- ` /marketplace ` Marketplace con exploración por scroll y categorización por tipo de producto.
- ` /marketplace/[slug] ` Página de detalle por producto con ficha ampliada.
- ` /arreglos ` Colección inicial de arreglos signature.
- ` /custom ` Flujo base de briefing para diseño a medida.
- ` /eventos ` Servicio para bodas y activaciones.
- ` /nosotros ` Narrativa de marca.
- ` /contacto ` Canales de contacto.


## Estructura recomendada para imágenes

Las imágenes del sitio ahora se organizan en `public/images` para facilitar carga, reemplazo y mantenimiento por tipo de contenido:

```
public/images/
  home/
    hero/
    highlights/
    testimonials/
    banners/
  arreglos/
    catalogo/
    temporada/
    detalles/
    thumbs/
  nosotros/
    equipo/
    taller/
    proceso/
    historia/
  eventos/
    bodas/
    corporativos/
    sociales/
    montajes/
  custom/
    inspiracion/
    briefs/
    referencias-clientes/
  branding/
    logo/
    iconos/
    paleta/
  blog/
    covers/
    galerias/
  testimonios/
    clientes/
    casos-exito/
  seo/
    og/
    share/
    favicons/
  placeholders/
```

> Todas las carpetas incluyen `.gitkeep` para versionar la estructura aunque aún no haya assets cargados.

## Flujo GitHub → Vercel
1. Conectar repositorio en Vercel (New Project).
2. Verificar que detecte framework **Next.js**.
3. Definir rama `main` para producción.
4. Usar PRs para obtener previews automáticas.
5. Configurar dominio custom cuando el branding esté aprobado.

## Cómo correr localmente

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Pruebas y validaciones mínimas
- `npm run lint`
- `npm run build`

> Si el entorno no tiene acceso a npm registry, registrar la evidencia como limitación de entorno y validar estructura de archivos/configuración.

## Nota técnica (build en Vercel)
Se aplicó una mitigación para desbloquear el build cuando falla la carga de plugins de PostCSS (`@tailwindcss/postcss`) en instalación remota:
- `postcss.config.mjs` quedó sin plugins externos.
- `src/app/globals.css` dejó de importar `tailwindcss` directamente.

Esto evita el error de webpack por `Require stack ... css/plugins.js` durante `npm run build`. Como siguiente paso, cuando el entorno permita instalar dependencias sin restricciones, se recomienda restaurar pipeline Tailwind completo (plugin PostCSS + import de Tailwind) en un PR dedicado.

## Cambios recientes de diseño
- Se rediseñó la interfaz completa con dirección visual editorial, inspirada en estudios de diseño floral contemporáneo como referencia estética.
- Se reemplazó el layout anterior por un shell con navegación tipo cápsula, fondos cálidos y jerarquía tipográfica más sofisticada.
- Se unificó el sistema visual en componentes de tarjeta, paneles y formularios para mantener consistencia entre todas las rutas del sitio.
- Se incorporó una galería moodboard con imágenes de referencia floral (Unsplash) para acelerar revisión visual con cliente antes de sesión fotográfica final.

## Historial de cambios

## PR: Starter Next.js para florería elevada
### ¿Qué cambia?
- Se crea la base técnica del sitio con Next.js + TypeScript + Tailwind.
- Se incorporan páginas iniciales para lanzamiento rápido en Vercel.
- Se define shell reutilizable con navegación superior.

### ¿Cómo se probó?
- Validación manual estructural de rutas y archivos generados.
- Verificación sintáctica de archivos de configuración ejecutable con Node.
- Se intentó bootstrap automático con `create-next-app`, bloqueado por política del registry en entorno.

### Impacto
- El proyecto queda listo para instalar dependencias, ejecutar local y conectar despliegue continuo en Vercel.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Fix de build en Vercel por plugin PostCSS faltante
### ¿Qué cambia?
- Se elimina la referencia a plugin PostCSS externo en `postcss.config.mjs`.
- Se quita el import de Tailwind en `globals.css` para evitar dependencia de pipeline PostCSS/Tailwind en build.
- Se mantiene el CSS custom para preservar legibilidad y continuidad operativa.

### ¿Cómo se probó?
- `node --check postcss.config.mjs`.
- Revisión manual de consistencia de estilos globales.
- Intento de `npm run build` bloqueado por ausencia de dependencias instaladas en este entorno.

### Impacto
- Se elimina el bloqueo de compilación causado por resolución de plugin PostCSS no disponible.
- Se deja documentado el camino de restauración de Tailwind completo para un siguiente PR.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Rediseño editorial inspirado en referencia externa
### ¿Qué cambia?
- Se renueva la interfaz completa del sitio con estética editorial cálida y minimalista.
- Se actualiza el `SiteShell` para incluir navegación refinada, CTA persistente y hero con mayor jerarquía visual.
- Se rediseñan todas las páginas de servicio con nuevos bloques de contenido consistentes.

### ¿Cómo se probó?
- `npm run lint` para validar TypeScript/JSX y reglas de Next.js.
- `npm run build` para verificar compilación de producción.

### Impacto
- Se mejora la percepción premium de la marca y la coherencia visual entre rutas clave de conversión.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Ajuste de paleta visual según identidad Ritual Studio
### ¿Qué cambia?
- Se actualizó el sistema de color global para reflejar la paleta oficial de cuatro tonos mostrada en el brandboard: rosa niebla, arena suave, gris humo y carbón.
- Se refinó la cabecera con lockup de marca (`Ritual Studio` + `by Sol`) y muestra de swatches para reforzar consistencia gráfica.
- Se armonizaron tarjetas, botones, formularios, fondos y líneas con la nueva familia cromática para una estética más editorial y coherente con el logo compartido.

### ¿Cómo se probó?
- `npm run lint` (limitado por entorno: `next: not found`).
- `node --check postcss.config.mjs`.
- `node --check eslint.config.mjs`.

### Impacto
- Mejora la coherencia visual del sitio con la identidad de marca recibida, sin alterar rutas ni flujo funcional.
- Deja base preparada para incorporar assets de logo/galería final cuando estén disponibles como archivos en el repositorio.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Menú hamburguesa para experiencia mobile
### ¿Qué cambia?
- Se convirtió la navegación del `SiteShell` en un menú hamburguesa para pantallas pequeñas, manteniendo navegación completa en desktop.
- Se añadió un botón accesible con estado abierto/cerrado (`aria-expanded`, `aria-controls`) y animación de icono.
- En mobile, los links y CTA quedan ocultos por defecto y se despliegan bajo demanda para mejorar legibilidad del header.

### ¿Cómo se probó?
- `npm run lint`.
- `npm run build` (falló por bloqueo de red al descargar fuentes de Google Fonts).
- Revisión manual de comportamiento esperado del estado del menú (abrir/cerrar + cierre al tocar links).

### Impacto
- El encabezado en mobile deja de verse saturado y mejora la jerarquía visual sin perder accesos clave.
- Se preserva la estética editorial en desktop sin cambios de layout principal.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Imágenes de ejemplo para dirección visual del sitio
### ¿Qué cambia?
- Se añadió una sección "Moodboard inicial" en la home con tres imágenes de referencia para orientar el look & feel editorial.
- Se enriqueció la página `/arreglos` con preview visual por tarjeta para que cada propuesta tenga contexto fotográfico inmediato.
- Se mantuvo integración con `next/image` y `remotePatterns` de `images.unsplash.com` para optimización y compatibilidad de build.

### ¿Cómo se probó?
- `npm run lint`.
- `npm run build` (falló por restricción de red del entorno al descargar Google Fonts).

### Impacto
- El sitio ahora cuenta con insumos visuales de ejemplo listos para iteraciones de UI y revisión con stakeholders.
- Queda clara la separación entre imágenes de referencia (temporales) y assets finales de marca/fotografía propia.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Botón de WhatsApp configurable en cabecera
### ¿Qué cambia?
- Se reemplazó el CTA secundario del header por un botón **"Contáctanos"** que abre conversación de WhatsApp.
- El número quedó configurable mediante variable de entorno pública `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- También se agregó `NEXT_PUBLIC_WHATSAPP_MESSAGE` para personalizar el mensaje prellenado.

### ¿Cómo se probó?
- `npm run lint`.
- Revisión manual del enlace generado (`https://wa.me/...`) y del comportamiento del botón en desktop/mobile.

### Impacto
- El sitio ahora tiene un canal directo de conversión por WhatsApp desde la navegación principal.
- Cambiar el número ya no requiere tocar código, solo actualizar variables de entorno.

### Configuración rápida
Crear/editar `.env.local`:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=5520904940
NEXT_PUBLIC_WHATSAPP_MESSAGE=Hola Ritual Studio, quiero cotizar un arreglo.
```

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí


## PR: Configuración de número fijo de WhatsApp (5520904940)
### ¿Qué cambia?
- Se configuró el CTA **"Contáctanos"** para usar por defecto el número `5520904940`.
- Se añadió normalización del número para WhatsApp: si se captura en formato local de 10 dígitos, el enlace agrega prefijo `52` automáticamente (`wa.me/52...`).
- Se mantiene soporte de `NEXT_PUBLIC_WHATSAPP_NUMBER` para sobreescribir el número sin tocar código.

### ¿Cómo se probó?
- `npm run lint`.
- Revisión manual de la transformación del número hacia formato WhatsApp (`5520904940` → `525520904940`).

### Impacto
- Al hacer clic en **Contáctanos**, se abre WhatsApp dirigido al número solicitado.
- Se reduce riesgo de enlaces inválidos por uso de número local sin prefijo de país.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí


## PR: Estructura de carpetas para gestión de imágenes
### ¿Qué cambia?
- Se creó una jerarquía de carpetas en `public/images` para separar assets por objetivo de negocio y secciones del sitio (home, arreglos, nosotros, eventos, etc.).
- Se añadieron subcarpetas para distintos usos de contenido (hero, catálogo, detalles, equipo, montajes, SEO, placeholders).
- Cada carpeta quedó versionada con `.gitkeep` para que el equipo pueda empezar a subir imágenes sin perder la estructura base en Git.

### ¿Cómo se probó?
- `find public/images -type d` para verificar creación completa de la jerarquía.
- `npm run lint` para validar que el proyecto mantiene calidad estática tras el cambio.

### Impacto
- Mejora el orden operativo para carga de imágenes y evita mezclar assets de ventas, branding y contenido editorial.
- Reduce fricción para escalar catálogo y piezas de marketing sin rehacer rutas de archivos.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Marketplace con categorías y detalle de producto
### ¿Qué cambia?
- Se creó la ruta `/marketplace` con un catálogo navegable por scroll, agrupado por categorías (`Ramos`, `Centros de mesa`, `Eventos`, `Regalos`).
- Se añadió navegación rápida por chips de categoría con anclas internas para saltar entre secciones del marketplace.
- Se implementó la ruta dinámica `/marketplace/[slug]` para mostrar detalle completo del producto (descripción, tamaño, flores, usos sugeridos y entrega).
- Se incorporó un dataset central (`src/data/marketplace-products.ts`) para evitar duplicación y facilitar mantenimiento del catálogo.
- Se agregó el enlace `Marketplace` a la navegación principal.

### ¿Cómo se probó?
- `npm run lint`.
- Revisión manual estructurada del flujo: listado por categorías → clic en “Ver detalle” → navegación al detalle de producto.

### Impacto
- El sitio pasa de un catálogo estático a una base de marketplace escalable con arquitectura lista para crecer en número de productos.
- Se mejora la experiencia de descubrimiento al permitir scroll continuo y segmentación clara por intención de compra.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí
