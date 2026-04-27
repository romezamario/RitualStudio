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
- ` /marketplace ` Tienda con exploración por scroll, categorización y acciones de compra (`Agregar al carrito` / `Comprar ahora`).
- ` /marketplace/[slug] ` Página de detalle por producto con ficha ampliada y acciones de carrito/compra directa.
- ` /carrito ` Vista de carrito de compras con resumen de productos agregados y checkout por WhatsApp.
- ` /arreglos ` Colección inicial de arreglos signature.
- ` /custom ` Flujo base de briefing para diseño a medida.
- ` /eventos ` Servicio para bodas y activaciones.
- ` /nosotros ` Narrativa de marca.
- ` /contacto ` Canales de contacto.
- ` /login ` Acceso con email/contraseña conectado a Supabase Auth (login + registro).
- ` /actualizar-contrasena ` Paso final de recuperación para definir nueva contraseña después del enlace enviado por correo.
- ` /mi-cuenta ` Dashboard del usuario autenticado con acceso centralizado a perfil, pedidos, direcciones y accesos administrativos (si aplica).
- ` /auth/callback ` Callback de confirmación de correo para Supabase (`token_hash` + `type`) con redirección amigable.
- ` /correo-confirmado ` Página de éxito visual para confirmación de correo.
- ` /auth/error ` Página de error amigable cuando el enlace de confirmación es inválido o expiró.
- ` /mi-cuenta/pedidos ` Vista base de seguimiento para pedidos del usuario autenticado.
- ` /mi-cuenta/direcciones ` Gestión de direcciones de entrega del usuario (guardar, marcar principal y eliminar).
- ` /admin/pedidos ` Vista operativa para gestión de pedidos (rol administrador).
- ` /admin/usuarios ` Vista operativa para gestión de usuarios y roles (rol administrador).
- ` /aviso-de-privacidad ` Aviso de privacidad para tratamiento de datos personales (nombre, teléfono, correo y datos de cuenta) conforme a regulación mexicana, enlazado desde el footer global.



## Control de roles con Supabase (RLS)

Se implementó control real de roles (`user` / `admin`) con seguridad en base de datos y protección server-side en App Router.

### Incluye
- Migración SQL en `supabase/migrations/20260421_roles_profiles_rls.sql` con:
  - tabla `public.profiles` enlazada a `auth.users`;
  - función `public.is_admin()` reusable;
  - trigger para `updated_at`;
  - trigger de alta automática de perfil al crear usuario en `auth.users`;
  - políticas RLS para lectura/actualización propia y lectura global para admins.
- Protección de rutas administrativas en `src/app/admin/layout.tsx`:
  - sin sesión -> redirección a `/login?redirect=/admin`;
  - con sesión pero sin rol admin -> redirección a `/unauthorized`.
- Utilidades server-side de auth/perfil en `src/lib/supabase/server.ts` usando validación confiable por token (`/auth/v1/user`) y lectura de `public.profiles`.
- Endpoint `GET /api/auth/me` para hidratar UI condicional basada en perfil real y no en estado local manipulable.

### Cómo crear el primer admin
1. Ejecuta la migración SQL en Supabase.
2. Registra un usuario normal en la app.
3. Ejecuta manualmente en SQL Editor (operador autorizado):

```sql
update public.profiles
set role = 'admin'
where email = 'correo@dominio.com';
```

> No uses `service_role` en frontend. Mantén llaves privilegiadas solo en backend seguro.

### Cómo extender a otras tablas
Usa `public.is_admin()` en policies RLS de tablas sensibles para permitir solo escrituras administrativas. La migración ya incluye un bloque ejemplo para `public.orders` y `public.products` que se aplica solo si existen.

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

## Convención `next/image` para grids y tarjetas (`sizes`)

Para evitar descargas de imágenes más grandes de lo necesario, usa siempre `sizes` alineado al layout CSS real:

- Grids/tarjetas de catálogo (`.feature-grid`, `.reference-grid`):  
  `sizes="(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 33vw"`
- Imagen principal de detalle de producto (`.product-detail`):  
  `sizes="(max-width: 900px) 100vw, 48vw"`
- Miniatura de carrito (`.cart-item` con columna fija de 180px):  
  `sizes="(max-width: 900px) 100vw, 180px"`

Regla operativa:
- Marca `priority` **solo** en la imagen principal above-the-fold de la vista (ej. hero/imagen principal de detalle).
- Mantén el resto de imágenes en carga lazy (comportamiento por defecto de `next/image`).

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

## Configuración de Supabase para confirmación de correo

Para que el flujo de confirmación funcione sin redirigir a `localhost`, configura estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu_publishable_key>
# opcional (fallback retrocompatible)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>
# recomendado para producción y previews
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
# opcional para mostrar una versión manual en footer
NEXT_PUBLIC_SITE_VERSION=0.1.0
```

Notas operativas:
- El template **Confirm sign up** de Supabase debe apuntar a `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`.
- El template **Reset password** de Supabase debe apuntar a `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/actualizar-contrasena`.
- El registro (`signUp`) ahora envía `emailRedirectTo` usando `NEXT_PUBLIC_SITE_URL` y, si no existe, usa el `origin` actual del navegador.
- La recuperación de contraseña (`recover`) también envía `emailRedirectTo` para aterrizar en `/actualizar-contrasena`.
- Si la confirmación crea sesión, el usuario se sincroniza automáticamente en la app al llegar a `/correo-confirmado`.
- El footer muestra la versión del sitio (`vX.Y.Z`): usa `NEXT_PUBLIC_SITE_VERSION` si está definida; si no, usa automáticamente la versión de `package.json`.

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

## PR: Versionado visible del sitio en footer
### ¿Qué cambia?
- Se agregó la visualización de versión del sitio en el footer global de `SiteShell`.
- La versión mostrada prioriza `NEXT_PUBLIC_SITE_VERSION` (si existe) y usa como fallback `version` desde `package.json`.
- El formato visible quedó como `© <año> Ritual Studio · v<versión>`.

### ¿Cómo se probó?
- `npm run lint`.

### Impacto
- Facilita identificar rápidamente la versión desplegada desde cualquier ruta del sitio.
- Permite sobreescribir versión por entorno sin tocar código, útil para releases y validación de QA.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Refactor de agrupación memoizada en marketplace client override
### ¿Qué cambia?
- Se refactorizó el render del override cliente de `/marketplace` para agrupar productos por categoría con `useMemo`, evitando recalcular filtros por cada categoría durante el render.
- La estructura agrupada se construye con `reduce` y luego se transforma a secciones (`{ category, products }`) para iteración directa.
- La barra de chips de categorías ahora se deriva de la misma estructura agrupada para mantener una sola fuente de verdad.
- Se conservaron los `id` de ancla (`categoria-...`) para compatibilidad total con los links de navegación existentes.

### ¿Cómo se probó?
- `npm run lint`.

### Impacto
- Menor trabajo en render del override cliente al eliminar `filter` dentro del `map` de categorías.
- Código más mantenible al centralizar el agrupado y reutilizarlo tanto en navegación por categorías como en secciones de productos.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Header en 2 secciones + WhatsApp flotante y movible
### ¿Qué cambia?
- Se separó el header en dos secciones claras:
  - **Sección 1:** nombre del sitio + botón de menú hamburguesa.
  - **Sección 2:** accesos rápidos de **carrito** y **usuario**.
- Se removió el botón de contacto de WhatsApp del header para evitar saturación visual.
- Se agregó un botón de **WhatsApp flotante** fijo en pantalla, con soporte de arrastre (drag) para que el usuario pueda moverlo si estorba en la visualización.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- Revisión manual esperada del flujo visual:
  - header dividido en dos bloques;
  - menú hamburguesa en bloque superior;
  - carrito/usuario en bloque inferior;
  - botón WhatsApp flotante que permite clic y también reposicionamiento por arrastre.

### Impacto
- Mejora la jerarquía visual del encabezado en mobile/desktop y reduce ruido en la navegación principal.
- Mantiene el canal de contacto por WhatsApp siempre disponible, pero ahora no bloquea contenido gracias al comportamiento movible.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Fix de tipado en `/marketplace/[slug]` para build de Vercel
### ¿Qué cambia?
- Se corrigió el tipado de la página dinámica de detalle de producto para alinearlo con App Router de Next.js y evitar el error de compilación en Vercel relacionado con `PageProps`.
- La ruta `src/app/marketplace/[slug]/page.tsx` dejó de recibir `params` por props tipadas manualmente y ahora obtiene el `slug` con `useParams` de `next/navigation`, manteniendo el componente como Client Component.
- Se conserva el comportamiento funcional existente: búsqueda del producto por `slug`, render de detalle y fallback de “Producto no encontrado”.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- `npm run build` (en este entorno falla por descarga de Google Fonts, sin reproducir el error de tipado reportado).

### Impacto
- Se elimina el error de TypeScript que detenía el despliegue:
  - `Type 'ProductDetailPageProps' does not satisfy the constraint 'PageProps'`
  - `Type '{ slug: string; }' is missing ... from type 'Promise<any>'`
- La firma de página queda compatible con App Router al resolver `slug` con `useParams` en cliente.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Ajuste del menú de usuario para evitar empalme con contenido
### ¿Qué cambia?
- Se ajustó el layout del bloque de cuenta en el header para que el panel de opciones de usuario forme parte del flujo del encabezado.
- El dropdown de usuario dejó de posicionarse en absoluto y ahora se renderiza en estático con separación vertical controlada.
- Se evitó el solapamiento del menú con el contenido principal (ej. títulos grandes del dashboard de cuenta).

### ¿Cómo se probó?
- `npm run lint`.
- Revisión manual del header al abrir el menú de usuario en vistas con hero/encabezado amplio.

### Impacto
- Mejora la legibilidad del contenido y la percepción de orden visual al abrir el menú de usuario.
- El ajuste no modifica rutas ni lógica de autenticación/autorización; es una corrección de UI/CSS.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Reordenar header (menú a la izquierda + accesos rápidos a la derecha)
### ¿Qué cambia?
- Se movieron las opciones de navegación para priorizar su alineación al lado izquierdo del header, junto al branding.
- Se retiró la opción `Inicio` del menú principal porque el logo `Ritual Studio` ya funciona como acceso a `/`.
- Se reemplazó el botón textual de contacto por un ícono de WhatsApp fijo en header y se agrupó con los íconos de carrito y usuario.
- Se eliminó la paleta de colores del menú hamburguesa para simplificar la navegación mobile.

### ¿Cómo se probó?
- `npm run lint`.
- Revisión manual del layout esperado en header:
  - navegación visible sin opción `Inicio`;
  - accesos rápidos (WhatsApp, carrito, usuario) alineados a la derecha;
  - menú hamburguesa sin paleta ni botón de contacto textual.

### Impacto
- Se mejora la jerarquía de navegación y se hace más claro el acceso transaccional en desktop y mobile.
- Se reduce ruido visual del menú mobile, manteniendo contacto por WhatsApp siempre accesible desde el header.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Recuperación de contraseña (forgot password + nueva contraseña)
### ¿Qué cambia?
- Se agregó la opción **¿Olvidaste tu contraseña?** en `/login` para enviar un enlace de recuperación a correo desde Supabase Auth.
- Se creó la pantalla `/actualizar-contrasena` para capturar y validar la nueva contraseña con reglas visibles en tiempo real.
- Se agregó `POST /api/auth/password` para actualizar la contraseña con sesión de recuperación validada en cookie segura (`httpOnly`) tras el callback.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- Revisión manual estructurada del flujo esperado:
  - `/login` → `¿Olvidaste tu contraseña?` → enviar correo;
  - enlace de recuperación → `/auth/callback?...type=recovery&next=/actualizar-contrasena`;
  - `/actualizar-contrasena` → guardar nueva contraseña.

### Impacto
- Mejora UX/autonomía del usuario al permitir recuperar acceso sin soporte manual.
- Mantiene seguridad al no exponer tokens en frontend y al actualizar contraseña vía endpoint server-side.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

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


## PR: Carrito de compras y compra directa desde marketplace
### ¿Qué cambia?
- Se agregó flujo de carrito para productos de marketplace con persistencia en `localStorage` (agregar, quitar y vaciar).
- Se implementaron acciones de compra en cada producto: **Agregar al carrito** y **Comprar ahora** (directo a WhatsApp).
- Se creó la ruta `/carrito` con listado de productos agregados y CTA para finalizar compra por WhatsApp.
- Se añadió acceso visible de **Ver carrito** en navegación para consultar productos desde cualquier pantalla.

### ¿Cómo se probó?
- `npm run lint`.
- Revisión manual de flujo esperado: `/marketplace` → agregar productos → `/carrito` → quitar/vaciar/comprar por WhatsApp.

### Impacto
- El sitio pasa de catálogo informativo a experiencia base de compra asistida, permitiendo intención transaccional inmediata.
- El equipo comercial obtiene un resumen rápido de productos seleccionados al recibir la solicitud por WhatsApp.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí


## PR: Login base con Supabase Auth
### ¿Qué cambia?
- Se creó la ruta `/login` con un formulario de acceso inicial para autenticación por correo y contraseña.
- El formulario soporta dos modos: **Iniciar sesión** y **Crear cuenta**.
- Se implementó una utilidad de autenticación en `src/lib/supabase-client.ts` para consumir endpoints de Supabase Auth (`/auth/v1/token` y `/auth/v1/signup`) usando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Se agregó el enlace `Login` en la navegación principal para acceso inmediato.

### ¿Cómo se probó?
- `npm run lint`.
- Validación manual estructurada del formulario: cambio de modo login/registro, validaciones requeridas y despliegue de mensajes de éxito/error.

### Impacto
- El proyecto ya tiene un punto de entrada real de autenticación para construir la siguiente fase: sesión persistente, protección de rutas, roles (`usuario`, `admin`, `superusuario`) y panel operativo.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Robustez de login/registro con Supabase
### ¿Qué cambia?
- Se reforzó la integración de Auth para `login` y `signup` enviando headers `apikey` + `Authorization: Bearer <anon_key>`.
- Se normaliza y valida `NEXT_PUBLIC_SUPABASE_URL` antes de construir endpoints (`trim`, remoción de `/` final y validación de formato URL).
- Se centralizó el manejo de errores de red/respuesta para devolver mensajes más claros al usuario cuando falla la conexión.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.

### Impacto
- Mejora la confiabilidad del flujo de registro/inicio de sesión y la diagnóstica de errores de configuración de Supabase.
- Reduce falsos mensajes genéricos cuando existe un problema específico en variables de entorno o URL inválida.

### Troubleshooting rápido (error de conexión con Supabase)
1. Verifica que `NEXT_PUBLIC_SUPABASE_URL` tenga formato completo, por ejemplo:
   - `https://<tu-proyecto>.supabase.co`
2. Verifica que exista `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (recomendado por Supabase) o, en su defecto, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Reinicia el servidor (`npm run dev`) tras cambiar `.env.local`.
4. Confirma conectividad saliente del entorno hacia `*.supabase.co`.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Compatibilidad con `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y normalización robusta de URL
### ¿Qué cambia?
- Se actualizó la utilidad de autenticación para aceptar como llave principal `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, manteniendo compatibilidad con `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Se endureció la normalización de `NEXT_PUBLIC_SUPABASE_URL` para tolerar errores comunes de configuración (por ejemplo usar `/auth/v1` o `/rest/v1` al final de la URL).
- Se mejoró el mensaje de error de formato inválido para indicar explícitamente el patrón correcto: `https://<project-ref>.supabase.co`.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.

### Impacto
- Reduce fricción al copiar credenciales desde Supabase, especialmente para equipos que ya usan nomenclatura `PUBLISHABLE_KEY`.
- Disminuye falsos negativos de configuración en login/registro causados por URLs incompletas o con sufijos de endpoint.

### Configuración recomendada de entorno (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu_publishable_key>
```

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Mensajes de error accionables al crear cuenta con Supabase
### ¿Qué cambia?
- Se mejoró el parseo de errores en `signup/login` para leer múltiples campos de respuesta de Supabase Auth (`error_description`, `msg`, `error`, `message`, `details`, `hint`).
- Se añadió el código HTTP al mensaje final para diagnóstico más rápido desde soporte/QA.
- Se agregaron mensajes específicos para escenarios frecuentes: `429` (muchos intentos) y `5xx` (error interno de Supabase).
- Se ajustó el mensaje de configuración faltante en UI para priorizar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con fallback a `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.

### Impacto
- El usuario deja de ver únicamente el genérico “No fue posible crear la cuenta.” y recibe contexto concreto para resolver configuración, validación o límites de uso.
- Se reduce tiempo de diagnóstico al incluir el estado HTTP directamente en el feedback mostrado por formulario.

### Troubleshooting rápido de registro
1. Si ves `HTTP 400` o `HTTP 422`, revisa formato de correo y política de contraseña del proyecto Supabase.
2. Si ves `HTTP 429`, espera unos segundos y reintenta (rate limit temporal).
3. Si ves `HTTP 500+`, suele ser incidente transitorio del proveedor; reintenta más tarde.
4. Si aparece error de conectividad, valida:
   - `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable_key>` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Aviso de privacidad para registro de datos personales (México)
### ¿Qué cambia?
- Se creó la ruta `/aviso-de-privacidad` con un aviso de privacidad integral para el manejo de datos de clientes en la app.
- El contenido cubre puntos clave para operación en México: responsable, tipos de datos, finalidades primarias/secundarias, limitación de uso, derechos ARCO, transferencias, cookies, seguridad y cambios al aviso.
- Se agregó el enlace `Aviso de privacidad` en la navegación principal para acceso visible desde cualquier pantalla.

### ¿Cómo se probó?
- `npm run lint`.
- Validación manual estructurada de contenido legal y navegación (`/aviso-de-privacidad` desde menú principal).

### Impacto
- El proyecto queda con una base legal operativa para transparentar el tratamiento de nombre, teléfono, correo electrónico y datos de cuenta posteriores al login.
- Se reduce riesgo de incumplimiento comunicacional al publicar en sitio un aviso de privacidad alineado al marco mexicano (LFPDPPP y su Reglamento).

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Footer global con liga a Aviso de privacidad
### ¿Qué cambia?
- Se removió el enlace `Aviso de privacidad` de la navegación principal para evitar saturación del menú.
- Se añadió un footer global en `SiteShell` con el enlace dedicado a `/aviso-de-privacidad`.
- Se mantuvo la ruta legal activa y accesible desde todas las páginas, ahora al final del sitio.

### ¿Cómo se probó?
- `npm run lint`.
- Validación manual estructurada del flujo de navegación: abrir cualquier página y confirmar acceso al aviso desde el footer.

### Impacto
- Se mejora la jerarquía del header para priorizar rutas comerciales, sin perder cumplimiento ni accesibilidad al aviso legal.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Validación de contraseña en vivo durante registro
### ¿Qué cambia?
- Se agregó validación en tiempo real en la pantalla de `/login` cuando el usuario está en modo **Crear cuenta**.
- Ahora se muestran 4 reglas de contraseña con estado en vivo: mayúscula, minúscula, dígito y caracter especial.
- El envío de registro se bloquea si no se cumplen todas las reglas, mostrando un mensaje claro para corregir.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- Validación manual del flujo de UI en `/login` alternando entre `Ya tengo cuenta` y `Crear cuenta`.

### Impacto
- Reduce intentos fallidos de registro por contraseñas débiles.
- Mejora la experiencia del usuario al dar feedback inmediato antes de enviar el formulario.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí


## PR: Menú de usuario autenticado con rutas por rol
### ¿Qué cambia?
- Se agregó un menú de usuario en la esquina superior derecha del header para mostrar el correo de la sesión activa y sus accesos disponibles.
- Antes de iniciar sesión se muestra la acción **Crear usuario / Iniciar sesión**; después del login se conserva la visibilidad del usuario con opción de cierre de sesión.
- Se diferenciaron opciones por rol: usuario normal (`/mi-cuenta/pedidos`) y administrador (además `/admin/pedidos` y `/admin/usuarios`).
- El registro ahora permite seleccionar tipo de cuenta inicial y persiste sesión básica en `localStorage` para mantener estado entre recargas.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- `npm run build` (falló por bloqueo de red al descargar Google Fonts).

### Impacto
- Se habilita un patrón de navegación autenticada listo para crecer hacia permisos reales por página y funcionalidades de pedidos.
- La UI ya comunica claramente qué usuario está activo y qué funciones tendrá según su rol.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí


## PR: Ajuste de navegación (Arreglos fuera de menú y Marketplace → Tienda)
### ¿Qué cambia?
- Se removió el enlace `Arreglos` del menú principal para simplificar la navegación comercial alrededor del catálogo transaccional.
- Se renombró la etiqueta del enlace `/marketplace` de `Marketplace` a `Tienda` en header (desktop y mobile, ya que comparten el mismo arreglo de links).

### ¿Cómo se probó?
- `npm run lint`.
- Revisión manual del arreglo `links` en `SiteShell` para confirmar que solo queda `Tienda` como acceso al catálogo desde navegación principal.

### Impacto
- La navegación prioriza un único punto de entrada al catálogo y elimina duplicidad conceptual entre `Arreglos` y `Marketplace`.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Registro con campos de usuario y nombre completo
### ¿Qué cambia?
- El modo **Crear cuenta** en `/login` ahora solicita también `Usuario` y `Nombre completo`, además de correo/contraseña.
- Se agregó validación previa para evitar enviar el registro si faltan esos dos campos.
- En signup, estos datos se envían como metadata a Supabase Auth (`username`, `full_name`) para dejar perfil básico desde el alta.
- La sesión local (`AuthContext`) ahora conserva `username/fullName` y el menú autenticado del header prioriza mostrar ese nombre en lugar de solo correo cuando esté disponible.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.

### Impacto
- El flujo de registro queda más completo para operación comercial y administración posterior de cuentas.
- Mejora la personalización visible del usuario autenticado sin introducir cambios de backend adicionales.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí


## PR: Mejoras de clic en menú de usuario + direcciones de entrega
### ¿Qué cambia?
- Se mejoró la zona clicable del menú de usuario autenticado para que cada opción tenga mayor alto, padding y ancho completo, mejorando usabilidad en desktop y mobile.
- Se agregó la ruta ` /mi-cuenta/direcciones ` para que clientes registren direcciones de entrega con datos completos (alias, contacto y ubicación).
- Se implementó persistencia local por usuario (clave por email en `localStorage`) con acciones para marcar dirección principal y eliminar direcciones.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- Validación manual estructurada:
  - Login → abrir menú de usuario → navegación a `Mis direcciones`.
  - Alta de dirección → marcar principal → eliminar dirección.

### Impacto
- Se reduce fricción en la navegación del menú de usuario al tener botones más fáciles de pulsar.
- Se habilita una base funcional para checkout asistido con direcciones persistentes del cliente en futuras iteraciones.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Menú de usuario por ícono y avatar con iniciales
### ¿Qué cambia?
- Se removió del menú hamburguesa el botón textual `Crear usuario / Iniciar sesión`.
- Se agregó un acceso de cuenta fijo en la esquina derecha del header:
  - Si no hay sesión: muestra ícono de usuario y, al hacer clic, abre opciones `Iniciar sesión` y `Crear usuario`.
  - Si hay sesión activa: muestra un círculo con iniciales del usuario y, al hacer clic, abre el menú de cuenta (pedidos, direcciones, opciones admin y cerrar sesión).
- Se agregó soporte a `?mode=signup` en `/login` para abrir directamente el formulario en modo crear cuenta.
## SEO técnico implementado (abril 2026)
- Metadata global reforzada en App Router: `title` con plantilla, `description`, `keywords`, `robots`, Open Graph y Twitter Cards.
- Canonical tags en Home, Marketplace y detalle dinámico por producto.
- Datos estructurados JSON-LD:
  - `Florist`/organización a nivel global.
  - `Product` en cada URL de detalle de marketplace.
- Archivos SEO automáticos:
  - `src/app/sitemap.ts` con rutas estáticas y productos del catálogo.
  - `src/app/robots.ts` permitiendo indexación pública y bloqueando áreas privadas (`/admin`, `/mi-cuenta`).

### Recomendaciones operativas SEO
- Configurar `NEXT_PUBLIC_SITE_URL` con el dominio final de producción para canónicos, `robots.txt` y `sitemap.xml` correctos.
- Reemplazar/crear imágenes OG definitivas en `public/images/seo/og/` para mejorar CTR en redes.

## PR: SEO técnico base (metadata, sitemap, robots y schema)
### ¿Qué cambia?
- Se fortalece la capa SEO global del sitio con metadata semántica completa para motores de búsqueda y redes sociales.
- Se agregan `sitemap.xml` y `robots.txt` dinámicos usando el catálogo del marketplace.
- Se añaden datos estructurados (`Florist` y `Product`) para mejorar elegibilidad de rich results.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- Validación manual estructurada:
  - Mobile: botón de cuenta visible al lado derecho y separado del menú hamburguesa.
  - Sin sesión: clic en ícono de usuario despliega `Iniciar sesión` y `Crear usuario`.
  - Con sesión: se visualiza avatar circular con iniciales y menú de usuario al hacer clic.

### Impacto
- El acceso de cuenta se vuelve más consistente y visible en mobile/desktop sin mezclarlo con la navegación principal.
- La señal visual de sesión activa mejora (avatar con iniciales), facilitando reconocer estado autenticado.

### Impacto
- Mejora la indexabilidad técnica del sitio y la calidad de snippets al compartir enlaces.
- Deja preparada la base SEO para escalar contenido (blog/categorías) sin rehacer infraestructura.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Fix de build en Vercel por `useSearchParams` en `/login`
### ¿Qué cambia?
- Se actualizó `src/app/login/page.tsx` para envolver `LoginForm` dentro de `Suspense`.
- Se añadió un fallback de carga liviano para el formulario de acceso.
- Se resolvió el error de prerender reportado por Next.js 15: `useSearchParams() should be wrapped in a suspense boundary`.

### ¿Cómo se probó?
- `npm run lint`.
- `npm run build`.

### Impacto
- El build de producción deja de fallar en Vercel al generar la ruta `/login`.
- Se mantiene el flujo actual de login/registro sin cambios funcionales de negocio.
## PR: Eliminación de referencias a Ciudad de México en contenido comercial
### ¿Qué cambia?
- Se removieron menciones explícitas a `CDMX` y `Ciudad de México` en metadatos SEO globales, home, contacto y marketplace para reflejar cobertura en múltiples ciudades.
- Se ajustó el contenido de entrega del catálogo para hablar de cobertura por ciudad/zona según disponibilidad logística, evitando limitar el servicio a una sola ciudad.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.

### Impacto
- El posicionamiento y el copy comercial ahora comunican una operación más amplia y escalable fuera de una única ciudad.
- Se reduce fricción comercial para leads fuera de Ciudad de México.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Ajuste del menú de usuario en mobile para evitar superposición con el contenido
### ¿Qué cambia?
- Se ajustó el layout responsive del header para que, en mobile, el panel del menú de usuario se renderice en flujo dentro del encabezado y no se superponga sobre el texto del hero.
- Se actualizó la alineación de `header-right` para soportar correctamente el despliegue vertical del botón de cuenta y su panel.
- Se definió un ancho máximo responsivo para el bloque de acceso de cuenta, mejorando legibilidad del menú en pantallas pequeñas.

### ¿Cómo se probó?
- `npm run lint`.
- Validación manual estructurada del caso reportado: abrir menú de usuario en vista mobile y verificar que el panel no tape el contenido principal.

### Impacto
- Mejora de UX en mobile: el menú de usuario queda visualmente contenido en el header, sin interferir con el texto editorial de la página.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Redirección post-login a dashboard de usuario
### ¿Qué cambia?
- Se agregó la ruta ` /mi-cuenta ` como dashboard principal del usuario autenticado.
- Al iniciar sesión (y al crear cuenta con sesión activa), ahora se redirige automáticamente a ` /mi-cuenta `.
- El menú de usuario incorpora acceso directo a `Dashboard` para volver rápidamente al panel principal.

### ¿Cómo se probó?
- `npm run lint`.
- Validación manual estructurada del flujo: `/login` → `Iniciar sesión` → redirección a `/mi-cuenta`.

### Impacto
- El usuario ya no se queda en pantalla de login después de autenticarse.
- La experiencia de cuenta queda más clara al centralizar accesos a pedidos y direcciones desde un dashboard.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Ícono de carrito fijo fuera del menú hamburguesa
### ¿Qué cambia?
- Se movió el acceso al carrito fuera del menú hamburguesa para que quede siempre visible en el header.
- Se reemplazó el texto `Ver carrito` por un ícono de carrito dedicado.
- Se añadió una burbuja de notificación sobre el ícono que muestra el número de productos cuando `totalItems > 0`.
- Se removió el acceso duplicado de carrito dentro del menú mobile y de las acciones colapsables.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- Validación manual estructurada del flujo esperado: agregar productos y confirmar que el contador en el ícono se actualiza.

### Impacto
- El acceso al carrito queda más visible y consistente en mobile/desktop.
- Se reduce fricción de compra al no depender de abrir el menú hamburguesa para revisar carrito.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Optimización de providers globales y persistencia de carrito
### ¿Qué cambia?
- Se movieron `AuthProvider` y `CartProvider` al `RootLayout` mediante `AppProviders`, para evitar re-montajes innecesarios al navegar entre rutas.
- `SiteShell` ahora consume contexto global sin envolver providers en cada render de página.
- Se mejoró la hidratación del carrito para evitar escrituras prematuras a `localStorage` antes de cargar el estado persistido.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.

### Impacto
- Menos trabajo repetido en cliente (menos inicializaciones de auth/carrito por navegación).
- Persistencia de carrito más robusta en el primer render al no sobreescribir almacenamiento antes de hidratar.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Refresh visual del botón flotante de WhatsApp
### ¿Qué cambia?
- Se actualizó el ícono de WhatsApp por una versión vectorial más limpia y legible (burbuja + teléfono) para mejorar estética en el botón flotante.
- Se reemplazó el color verde de marca WhatsApp por un estilo alineado al sistema visual del sitio (base clara derivada de `--rose-mist` + ícono en `--charcoal`).
- Se agregó estado `hover` en el botón para mantener consistencia con los demás accesos rápidos del header.

### ¿Cómo se probó?
- `npm run lint`.
- Validación manual estructurada del botón flotante:
  - visual del nuevo ícono;
  - contraste del color con la paleta del sitio;
  - interacción normal de clic/drag sin regresiones.

### Impacto
- El botón de WhatsApp conserva su visibilidad comercial, pero ahora se integra mejor al lenguaje visual editorial de Ritual Studio.
- Se mejora percepción de calidad del componente al sustituir el ícono previo por uno más pulido.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## Checkout embebido con Mercado Pago (Checkout API / Orders)

Se integró un flujo de pago **embebido** (sin redirecciones externas) usando SDK JS de Mercado Pago + Card Payment Brick, con creación de orden/pago desde backend.

### Variables de entorno requeridas

```bash
# Frontend seguro (SDK JS)
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxxxxxxx

# Backend seguro (nunca exponer en cliente)
MP_ACCESS_TOKEN=TEST-xxxxxxxx
MP_WEBHOOK_SECRET=xxxxxxxx

# Supabase backend (persistencia de órdenes/pagos/eventos)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Rutas incluidas
- `GET/POST /api/mercadopago/webhook`
- `POST /api/mercadopago/create-order`
- `/checkout` (pantalla embebida de pago con tarjeta)

### Qué hace el flujo
1. El usuario agrega productos al carrito y entra a `/checkout`.
2. El Card Payment Brick tokeniza la tarjeta en frontend (PCI scope de MP).
3. Frontend envía al backend solo: `token`, `payment_method_id`, `payment_method_type` (cuando Mercado Pago lo incluye), `installments`, `payer.email`, `items` (slug/cantidad).
4. Backend recalcula montos usando catálogo local (no confía en precio del frontend).
5. Backend crea orden en Mercado Pago (`/v1/orders`) y guarda datos en `orders`.
6. Si hay info de pago, también registra `payments`.
7. El webhook recibe eventos, guarda `payment_events`, consulta estado real en MP y reconcilia `orders/payments`.

### Pruebas en sandbox
1. Configura llaves `TEST-` en Vercel/local.
2. Ejecuta `npm run dev`.
3. Agrega productos al carrito y abre `/checkout`.
4. Realiza compra usando tarjetas de prueba de Mercado Pago.
5. Verifica en Supabase que se registren filas en `orders`, `payments` y `payment_events`.



### Recomendación de configuración en Vercel (cuando usas credenciales de prueba)
- Si tus llaves empiezan con `TEST-`, configúralas en **Preview** y **Development** para evitar pruebas accidentales en producción.
- En **Production**, usa llaves productivas (`APP_USR-` para `MP_ACCESS_TOKEN` y la `NEXT_PUBLIC_MP_PUBLIC_KEY` correspondiente) solo cuando quieras cobrar en real.
- `NEXT_PUBLIC_MP_PUBLIC_KEY` puede estar en frontend (prefijo `NEXT_PUBLIC_`), pero `MP_ACCESS_TOKEN` debe quedarse solo en backend y nunca exponerse al cliente.
- Si mantienes llaves `TEST-` en `Production`, el checkout funcionará en modo sandbox (sin cobros reales), lo cual puede ser útil temporalmente pero no es setup final de go-live.

### Configuración de webhook en Mercado Pago
- URL sugerida de producción: `https://ritualstudio.com.mx/api/mercadopago/webhook`.
- Para desarrollo, puedes exponer local con túnel HTTPS y configurar esa URL temporal.
- El endpoint responde `200` incluso si falla reconciliación interna, para tolerar reintentos de MP sin romper recepción.

### Nota de arquitectura
- Este flujo usa **Checkout API / Orders embebido**.
- **No** usa Checkout Pro.
- **No** usa `init_point`.
- **No** usa `preference_id`.
- **No** redirige fuera de `ritualstudio.com.mx`.

### Troubleshooting de error: “Faltan datos obligatorios del pago”
- Si el Brick no manda `payment_method_type` en `onSubmit`, el backend ahora usa fallback seguro `credit_card` para no rechazar pagos válidos por payload parcial.
- Los campos que sí se mantienen como obligatorios son: `token`, `payment_method_id` y `payer.email`.
- Si el error persiste, revisar en Network el payload enviado a `POST /api/mercadopago/create-order` y confirmar que esos tres campos existan.

### Troubleshooting de error: “Mercado Pago respondió con 401”
- El `401 Unauthorized` suele indicar credencial inválida o mal formateada en backend (no un problema del formulario frontend).
- Verifica que `MP_ACCESS_TOKEN` sea el token correcto del entorno (sandbox `TEST-...` o producción `APP_USR-...`) y que **no** incluya el prefijo `Bearer`.
- El backend ahora normaliza `MP_ACCESS_TOKEN` por seguridad (remueve comillas, BOM y un `Bearer` accidental con espacio o `:`), pero la recomendación sigue siendo guardar solo el token plano en Vercel.
- Si hay llaves mezcladas (por ejemplo `NEXT_PUBLIC_MP_PUBLIC_KEY` de sandbox con `MP_ACCESS_TOKEN` de producción), Mercado Pago puede rechazar la operación. Usa ambos del mismo entorno.
- Si mezclas entornos (`TEST-` vs `APP_USR-`), el backend devolverá un error explícito antes de llamar a Mercado Pago para facilitar diagnóstico.

## PR: Registro técnico de integraciones GitHub↔Supabase y Supabase↔Vercel
### ¿Qué cambia?
- Se agregó un módulo central `src/lib/integration-metadata.ts` para registrar en código que existen estas integraciones operativas:
  - GitHub → Supabase (repo conectado, rama productiva, working directory y deploy a producción).
  - Supabase → Vercel (team/proyecto conectado, entornos sincronizados y prefijo de variables públicas).
- Se integró este registro en requests hacia Supabase mediante el header `X-Client-Info`, para adjuntar contexto técnico mínimo al usar Auth y operaciones backend.
- Se unificó el uso del mismo header en:
  - `src/lib/supabase-client.ts` (login/signup/recovery desde frontend)
  - `src/lib/supabase/server.ts` (validación server-side por token/perfil)
  - `src/lib/supabase-admin.ts` (operaciones con service role)

### Variables de entorno para estas integraciones
```bash
# GitHub -> Supabase
NEXT_PUBLIC_GITHUB_REPOSITORY=romezamario/RitualStudio
NEXT_PUBLIC_SUPABASE_WORKING_DIRECTORY=.
NEXT_PUBLIC_SUPABASE_DEPLOY_TO_PRODUCTION=true
NEXT_PUBLIC_SUPABASE_PRODUCTION_BRANCH=main

# Supabase -> Vercel
NEXT_PUBLIC_VERCEL_TEAM=romezamario-1622
NEXT_PUBLIC_VERCEL_PROJECT=ritual-studio
NEXT_PUBLIC_SUPABASE_VERCEL_SYNC_ENVS=production
NEXT_PUBLIC_VERCEL_ENV_PREFIX=NEXT_PUBLIC_
```

### Impacto
- El repositorio ahora deja trazabilidad explícita y versionada de parámetros clave de integración.
- Al centralizar la metadata, futuras automatizaciones (observabilidad, auditoría o checks internos) pueden reutilizar una sola fuente de verdad.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Gestión de productos para administradores (alta + edición)
### ¿Qué cambia?
- Se creó la ruta ` /admin/productos ` para que cuentas administradoras den de alta y editen productos.
- El formulario admin permite capturar:
  - nombre del producto,
  - descripción,
  - foto (carga local con vista previa),
  - precio,
  - activación de oferta y precio de oferta.
- Se agregó persistencia local del catálogo en `localStorage` para iterar rápidamente sin bloquear por backend.
- Marketplace (`/marketplace` y `/marketplace/[slug]`) ahora lee el catálogo persistido, mostrando productos nuevos/editados desde administración.
- Se incorporó visualización de precio con oferta (`precio anterior` + `precio actual`) cuando aplica.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- Validación manual estructurada del flujo esperado:
  - entrar con admin a `/admin/productos`;
  - dar de alta producto con foto + precio + oferta opcional;
  - editar producto existente;
  - validar reflejo en `/marketplace` y en `/marketplace/[slug]`.

### Impacto
- El equipo administrativo ya puede operar altas/ediciones básicas de catálogo desde interfaz, sin tocar código.
- Permite iterar comercialmente mientras se define una persistencia definitiva en base de datos.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Marketplace server-first (SSR inicial) + enhancer de overrides admin
### ¿Qué cambia?
- `src/app/marketplace/page.tsx` y `src/app/marketplace/[slug]/page.tsx` se migraron a **Server Components** (sin `"use client"`).
- El render inicial ahora usa `marketplaceProducts` directamente en servidor para entregar HTML completo desde el primer response.
- En la ruta dinámica de detalle, se reemplazó lectura cliente de `useParams()` por `params` server-side y resolución previa del producto con `getMarketplaceProductBySlug`.
- Se añadió `MarketplaceClientEnhancer` para aplicar overrides guardados por admin en `localStorage` después de hidratar, sin bloquear el primer render.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- `rg -n "^\"use client\"|useEffect|useParams" src/app/marketplace/page.tsx src/app/marketplace/[slug]/page.tsx` (sin coincidencias).

### Impacto
- Mejora SEO y rendimiento percibido al incluir listado/detalle en HTML inicial sin esperar `useEffect`.
- Se conserva compatibilidad con personalizaciones locales de administración mediante enhancer cliente post-hidratación.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: SiteShell servidor + islas cliente para header y WhatsApp
### ¿Qué cambia?
- `SiteShell` ahora es **Server Component** y se encarga solo de la estructura estática compartida (header contenedor, hero base y footer).
- La interactividad del encabezado se movió a `HeaderInteractive` (Client Component):
  - menú hamburguesa mobile,
  - menú de usuario autenticado,
  - badge de carrito.
- El botón de WhatsApp flotante y arrastrable se movió a `FloatingWhatsAppButton` (Client Component).
- La frontera server/client usa props serializables mínimas (`links` y `href`) para mantener bajo acoplamiento.

### ¿Cómo se probó?
- `npm run lint`.
- `npm run build` (en este entorno falla por descarga de Google Fonts desde `fonts.googleapis.com`).
- Revisión estructural del refactor:
  - páginas informativas continúan usando el mismo header funcional;
  - la estructura base de `SiteShell` no requiere hidratación global al ser componente servidor.

### Impacto
- Menor superficie de JavaScript hidratado en rutas informativas al evitar que todo el shell sea cliente.
- Se mantiene funcionalidad existente del header y del botón flotante de WhatsApp.
- Arquitectura más mantenible para futuras “islas” interactivas.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Fix de tipado `params` (Promise) en `/marketplace/[slug]` para build de Next 15
### ¿Qué cambia?
- Se corrigió la firma de la página dinámica `src/app/marketplace/[slug]/page.tsx` para que `params` use el contrato esperado por Next.js 15 en este proyecto (`Promise<{ slug: string }>`).
- La página de detalle ahora es `async` y resuelve `slug` con `await params` antes de buscar el producto.
- Con este ajuste se elimina el error de compilación de tipos en Vercel:
  - `Type 'ProductDetailPageProps' does not satisfy the constraint 'PageProps'`
  - `Type '{ slug: string; }' is missing ... from type 'Promise<any>'`

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- `npm run build` (en este entorno sigue fallando por red al descargar Google Fonts desde `fonts.googleapis.com`, pero ya no aparece el error de tipado de `PageProps` reportado en despliegue).

### Impacto
- El build deja de romperse por incompatibilidad de tipos en la ruta dinámica de detalle de marketplace.
- El cambio es acotado al contrato de props de la página; no modifica lógica de negocio ni contenido visible.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Mensaje accionable en error del Card Payment Brick (producción vs test)
### ¿Qué cambia?
- En `src/components/checkout-client.tsx` se agregó una traducción de errores del callback `onError` del Card Payment Brick para evitar el mensaje genérico único.
- Cuando Mercado Pago devuelve causas relacionadas con métodos de pago/BIN (`get_payment_methods`), el frontend ahora muestra una guía explícita según entorno:
  - con llave productiva (`APP_USR-`): usar tarjeta real y no tarjetas de prueba,
  - con llave de test (`TEST-`): revisar datos o probar otra tarjeta de test.
- Si Mercado Pago entrega `cause.description` o `message`, se muestra ese contexto para diagnóstico más rápido.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.

### Impacto
- Menor ambigüedad para negocio/QA al diagnosticar errores del formulario embebido.
- Reduce falsos tickets de “falló Mercado Pago” cuando en realidad hay mezcla de entorno (producción vs tarjetas de prueba).

### Troubleshooting de error visual: “No pudimos obtener la información de pago. Intenta otra tarjeta”
- Si tu `NEXT_PUBLIC_MP_PUBLIC_KEY` empieza con `APP_USR-` (producción), no uses tarjetas de prueba de Mercado Pago; usa una tarjeta real habilitada.
- Si estás en pruebas, usa llaves `TEST-` y tarjetas de prueba del entorno sandbox.
- Verifica también que `MP_ACCESS_TOKEN` corresponda al mismo entorno que la public key.

## PR: CRUD server-side de productos admin en Supabase
### ¿Qué cambia?
- Se agregaron endpoints de App Router para gestión administrativa de productos en Supabase:
  - `GET/POST /api/admin/products`
  - `PUT/DELETE /api/admin/products/[slug]`
- `AdminProductsManager` ahora consume esos endpoints (carga inicial por API, guardar por `POST/PUT`, eliminación por `DELETE`).
- El fallback por `localStorage` queda controlado por feature flag `NEXT_PUBLIC_MARKETPLACE_LOCAL_FALLBACK=true`.
- `/marketplace` y `/marketplace/[slug]` ahora resuelven catálogo desde backend (Supabase) mediante una capa común en `src/lib/marketplace-catalog.ts`, con fallback al catálogo estático solo por compatibilidad.

### Variables de entorno nuevas/relevantes
- `SUPABASE_SERVICE_ROLE_KEY` (obligatoria en servidor para CRUD admin y lectura server-side del catálogo).
- `NEXT_PUBLIC_MARKETPLACE_LOCAL_FALLBACK` (opcional):
  - `true` => habilita compatibilidad temporal con `localStorage` (admin y enhancer cliente).
  - no definida/`false` => deshabilita fallback local y usa backend como fuente principal.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- `npm run build` (falla en este entorno por bloqueo de red hacia Google Fonts; sin errores nuevos de tipado/lint por este cambio).

### Impacto
- El catálogo deja de depender de persistencia local como fuente primaria y pasa a flujo server-side administrable.
- La operación admin queda preparada para multiusuario real al centralizar cambios en Supabase.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Corrección de request 400 en pago con Mercado Pago
### ¿Qué cambia?
- Se corrigió el backend de checkout para enviar el pago al endpoint recomendado por Card Payment Brick (`POST /v1/payments`) con payload mínimo obligatorio: `token`, `transaction_amount`, `installments`, `payment_method_id` y `payer.email`.
- Se eliminó del request de pago la estructura anidada de `orders.transactions.payments` que podía provocar rechazos `400` por propiedades no esperadas en este flujo.
- Se mejoró el parseo de errores de Mercado Pago para incluir `cause.code` y `cause.description` cuando existan, facilitando diagnóstico de payload mal formado.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.
- Validación estática del payload en `src/app/api/mercadopago/create-order/route.ts` para confirmar que coincide con los campos mínimos documentados por Card Payment Brick.

### Impacto
- Disminuye el riesgo de `400 Bad Request` al pagar con tarjeta en checkout embebido.
- Los errores devueltos por Mercado Pago ahora son más accionables para soporte y debugging.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí

## PR: Fix de alta de productos cuando falta `public.products` en Supabase
### ¿Qué cambia?
- Se agregó la migración `supabase/migrations/20260427_products_catalog.sql` para crear la tabla `public.products` con todos los campos que ya consume el CRUD admin y el render de marketplace.
- La migración también incluye índices base (`name`, `category`), trigger de `updated_at` y políticas RLS (lectura pública + escritura solo admin con `public.is_admin()`).
- Se mejoró el parseo de errores en `supabaseAdminRequest` para detectar explícitamente el caso de tabla faltante (`PGRST205` / `public.products` no encontrada) y devolver un mensaje accionable en español.

### ¿Cómo se probó?
- `npm run lint`.
- `npx tsc --noEmit`.

### Impacto
- El error de alta de producto *"Could not find the table 'public.products' in the schema cache"* queda resuelto al ejecutar migraciones pendientes.
- Si el entorno aún no tiene la migración aplicada, la API responde con un mensaje claro de siguiente paso en lugar del error crudo de PostgREST.

### Paso operativo obligatorio
- Ejecutar migraciones de Supabase en el entorno correspondiente antes de volver a probar alta/edición de productos:
  - `supabase db push` (CLI), o
  - ejecutar manualmente el SQL de `supabase/migrations/20260427_products_catalog.sql` en Supabase SQL Editor.

### Documentación actualizada
- AGENTS.md: Sí
- README.md: Sí
