# PLAN.md - Plan de Desarrollo de Bubble

## Plan Actual: MVP Funcional y Expansión de Features

**Fecha de inicio del plan**: 2025-09-30  
**Estado**: En progreso

## Objetivo General
Completar el MVP funcional de Bubble con chat IA operativo y bases de gamificación, luego expandir con features de desafíos y recompensas completamente funcionales.

## Fase 1: Estabilización del MVP ✅
**Estado**: Completada

### Objetivos
- [x] Chat con IA funcionando correctamente
- [x] Autenticación robusta
- [x] Persistencia de conversaciones
- [x] Estructura base de navegación

### Logros
- Sistema de chat con streaming implementado
- Autenticación con validación en servidor
- Base de datos con RLS policies
- Navegación entre secciones principales

## Fase 2: Implementación de Gamificación (Actual)
**Estado**: En progreso  
**Prioridad**: Alta

### Objetivos Principales

#### 2.1 Sistema de Desafíos
- [ ] Definir tipos de desafíos (diarios, semanales, especiales)
- [ ] Crear tabla `challenges` en la base de datos
- [ ] Crear tabla `user_challenges` para tracking
- [ ] Implementar lógica de asignación de desafíos
- [ ] UI para mostrar desafíos activos y completados
- [ ] Sistema de validación de completado

#### 2.2 Sistema de Recompensas
- [ ] Definir tipos de recompensas (puntos, badges, items)
- [ ] Crear tabla `rewards` en la base de datos
- [ ] Crear tabla `user_rewards` para inventario
- [ ] Implementar sistema de puntos (XP)
- [ ] UI para mostrar recompensas disponibles y desbloqueadas
- [ ] Sistema de canje de puntos por recompensas

#### 2.3 Sistema de Progreso de Usuario
- [ ] Agregar campos a `profiles`: `xp`, `level`, `streak_days`
- [ ] Implementar cálculo de nivel basado en XP
- [ ] Sistema de rachas (streak) por uso diario
- [ ] Notificaciones de logros
- [ ] Actualizar página de perfil con estadísticas

## Iniciativa Paralela: Renderizado Markdown en Chat
**Estado**: Planificado  
**Prioridad**: Media

### Objetivo
Habilitar soporte seguro de Markdown en los mensajes del chat para mejorar la expresividad de Bubble y de los usuarios (listas, énfasis, enlaces y bloques de código) manteniendo una experiencia consistente con el sistema de diseño.

### Plan de Ejecución
1. **Alcance y requisitos**: Definir qué elementos Markdown se soportarán (títulos ligeros, énfasis, listas, enlaces, citas, código) y documentar reglas de fallback para texto plano y streaming parcial.
2. **Infraestructura de renderizado**: Evaluar e instalar librerías (`react-markdown`, `remark-gfm`, `rehype-sanitize`) o equivalente ligera; configurar sanitización estricta y limitar nodos inseguros (scripts, iframes, HTML crudo).
3. **Componente UI**: Crear un componente `MarkdownMessage` reutilizable que reciba `content` y `role`, aplique tokens semánticos para colores/typography y adapte layout móvil; ajustar `Chat.tsx` para usarlo en mensajes del usuario y asistente.
4. **Compatibilidad con streaming y almacenamiento**: Ajustar lógica de streaming para renderizar incrementalmente sin bloquear la UI, asegurando que el contenido final almacenado sigue siendo texto Markdown plano sin artefactos; agregar migraciones solo si surgen nuevos metadatos (por ejemplo, flags de formato).
5. **QA y validación**: Cubrir casos con pruebas unitarias/componentes (render de listas, código, enlaces), QA manual con mensajes largos y mezcla de Markdown, y verificar compatibilidad en navegadores móviles; añadir documentación breve en `README.md` sobre uso de Markdown.

### Definición de Hecho
- Mensajes renderizan Markdown soportado con estilos alineados al sistema de diseño.
- Sanitización evita inyecciones o HTML arbitrario tanto de usuario como de Bubble.
- Streaming mantiene rendimiento aceptable (<100ms por frame) y no rompe formato final.
- Documentación y ejemplos actualizados para el equipo.

## Fase 3: Mejoras de Experiencia (Futuro)
**Estado**: Planificado  
**Prioridad**: Media

### Objetivos
- [ ] Mejoras visuales y animaciones
- [ ] Onboarding para nuevos usuarios
- [ ] Tutorial interactivo
- [ ] Personalización de Bubble (tono, personalidad)
- [ ] Sistema de notificaciones push
- [ ] Compartir logros en redes sociales

## Fase 4: Features Premium (Futuro)
**Estado**: Planificado  
**Prioridad**: Baja

### Objetivos
- [ ] Definir features premium
- [ ] Integración de pagos (Stripe)
- [ ] Desafíos exclusivos premium
- [ ] Personalización avanzada
- [ ] Análisis detallado de uso
- [ ] Exportación de conversaciones

## Consideraciones Técnicas

### Performance
- Optimizar queries de base de datos según crezca el uso
- Implementar caching para datos de desafíos y recompensas
- Lazy loading de imágenes y recursos

### Seguridad
- Mantener RLS policies actualizadas
- Validar todas las acciones de gamificación en servidor
- Prevenir manipulación de puntos/recompensas

### Escalabilidad
- Diseñar sistema de desafíos para soportar muchos tipos
- Sistema de recompensas extensible
- Preparar para múltiples idiomas

## Métricas de Éxito
- Tiempo de respuesta del chat < 2s
- Tasa de retención diaria > 40%
- Usuarios completando al menos 1 desafío diario > 60%
- Engagement con sistema de recompensas > 70%

## Notas
- Mantener el foco en la experiencia de usuario
- Iterar basándose en feedback real
- No sobre-complicar features antes de validar uso
- Priorizar funcionalidad sobre diseño perfecto en MVP
