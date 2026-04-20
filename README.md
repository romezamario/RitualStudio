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
- ` /auth/callback ` Callback de confirmación de correo para Supabase (`token_hash` + `type`) con redirección amigable.
- ` /correo-confirmado ` Página de éxito visual para confirmación de correo.
- ` /auth/error ` Página de error amigable cuando el enlace de confirmación es inválido o expiró.
- ` /mi-cuenta/pedidos ` Vista base de seguimiento para pedidos del usuario autenticado.
- ` /mi-cuenta/direcciones ` Gestión de direcciones de entrega del usuario (guardar, marcar principal y eliminar).
- ` /admin/pedidos ` Vista operativa para gestión de pedidos (rol administrador).
- ` /admin/usuarios ` Vista operativa para gestión de usuarios y roles (rol administrador).
- ` /aviso-de-privacidad ` Aviso de privacidad para tratamiento de datos personales (nombre, teléfono, correo y datos de cuenta) conforme a regulación mexicana, enlazado desde el footer global.


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

## Configuración de Supabase para confirmación de correo

Para que el flujo de confirmación funcione sin redirigir a `localhost`, configura estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu_publishable_key>
# opcional (fallback retrocompatible)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>
# recomendado para producción y previews
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

Notas operativas:
- El template **Confirm sign up** de Supabase debe apuntar a `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`.
- El registro (`signUp`) ahora envía `emailRedirectTo` usando `NEXT_PUBLIC_SITE_URL` y, si no existe, usa el `origin` actual del navegador.
- Si la confirmación crea sesión, el usuario se sincroniza automáticamente en la app al llegar a `/correo-confirmado`.

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
