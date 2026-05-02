# Bitácora de versiones

Este archivo registra los cambios liberados por versión usando SemVer.

## Convención de incrementos
- `small` ⇒ `patch` (x.y.Z): ajustes pequeños, fixes y mejoras sin impacto funcional amplio.
- `big` ⇒ `minor` (x.Y.0): cambios funcionales relevantes y nuevas capacidades compatibles.
- `breaking` ⇒ `major` (X.0.0): cambios incompatibles que requieren adaptación.

## v0.2.0 - 2026-04-27
- Implementación del flujo de versionado SemVer con niveles small/big/breaking
- Creación de bitácora de versiones persistente en CHANGELOG.md
- Documentación de proceso de release en README

## v0.2.1 - 2026-05-02
- Ajuste menor en plantillas de correo de confirmación: la etiqueta de fecha en texto plano ahora indica `Fecha (hora de México)` para mantener consistencia con la versión HTML.

## v0.1.0 - 2026-04-18
- Base inicial del sitio con Next.js App Router y arquitectura para despliegue en Vercel.
- Evolución funcional inicial: marketplace, carrito, autenticación, administración y checkout asistido.
