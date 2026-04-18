# RitualStudio

## Propósito del repositorio
Este repositorio documenta y mantiene la evolución del sitio. Cada cambio debe quedar respaldado por pruebas, aprendizaje y documentación actualizada.

---

## Estándar obligatorio para cada Pull Request

Cada PR debe incluir obligatoriamente:

1. **Pruebas**
   - Automatizadas cuando sea posible.
   - Manuales estructuradas cuando no haya cobertura automática.
   - Evidencia clara del resultado.

2. **Actualización de `AGENTS.md`**
   - Registrar aprendizaje, decisiones y riesgos del cambio.

3. **Actualización de `README.md`**
   - Reflejar cambios funcionales/técnicos aplicados al sitio.

---

## Estructura evolutiva del README

> Este README es vivo y debe crecer con cada PR.

### 1) Estado actual del sitio
- Funcionalidades disponibles
- Módulos/componentes activos
- Dependencias relevantes

### 2) Historial de cambios
- Resumen por PR de lo incorporado
- Enlaces a PR o commits

### 3) Guía de pruebas
- Cómo ejecutar pruebas
- Cobertura esperada
- Criterios mínimos de aceptación

### 4) Guía de despliegue/operación
- Pasos de despliegue
- Validaciones post-despliegue
- Monitoreo básico

### 5) Lecciones y mejoras continuas
- Aprendizajes claves por iteración
- Deuda técnica identificada
- Próximas mejoras propuestas

---

## Plantilla sugerida para registrar cambios por PR

```md
## PR: <id-o-título>
### ¿Qué cambia?
- 

### ¿Cómo se probó?
- 

### Impacto
- 

### Documentación actualizada
- AGENTS.md: Sí/No
- README.md: Sí/No
```

---

## Checklist mínimo por cambio
- [ ] Se implementó el cambio.
- [ ] Se ejecutaron y documentaron pruebas.
- [ ] Se actualizó `AGENTS.md` con aprendizajes.
- [ ] Se actualizó `README.md` con el cambio.
