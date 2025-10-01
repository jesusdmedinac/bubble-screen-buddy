# AGENTS.md - Guía para IA de Desarrollo de Bubble

## Propósito
Este documento define el comportamiento esperado para cualquier IA que continúe desarrollando el proyecto Bubble. Sigue estas instrucciones estrictamente para mantener la coherencia y calidad del proyecto.

## Documentación del Proyecto

### Documentos Clave
El proyecto mantiene 4 documentos markdown que DEBES consultar y actualizar:

1. **AGENTS.md** (este documento): Define cómo las IAs deben trabajar en el proyecto
2. **PLAN.md**: Define el plan de desarrollo actual y próximos pasos
3. **PROGRESS.md**: Refleja el estado actual del proyecto según el plan
4. **HISTORY.md**: Registra el historial de cambios y decisiones importantes

### Responsabilidades de Actualización

**CRÍTICO - OBLIGATORIO**: Después de cada cambio significativo, DEBES actualizar los documentos relevantes:

- **PLAN.md**: Actualiza cuando se agreguen nuevas features o se cambie la dirección del desarrollo
  - Marca tareas completadas con `[x]`
  - Añade nuevas tareas si surgen durante el desarrollo
  
- **PROGRESS.md**: Actualiza SIEMPRE después de completar tareas o hacer cambios importantes
  - Actualiza el porcentaje de progreso de la fase actual
  - Mueve tareas de "Pendiente" a "Completado Recientemente"
  - Actualiza métricas técnicas (número de tablas, funciones, etc.)
  - Actualiza "Próximos Pasos" con el siguiente trabajo a realizar
  
- **HISTORY.md**: Registra cuando se complete un plan o se haga un cambio arquitectónico importante
  - Documenta decisiones técnicas significativas
  - Registra migraciones de base de datos importantes

## Reglas de Desarrollo

- Si hiciste un cambio en el código, actualiza al menos PROGRESS.md. No hay excepciones.
- Debes sugerir un mensaje de commit en cada paso del desarrollo.
- Por cada funcionalidad nueva que se agregue, debes crear pruebas manuales en `.bugster/tests/**` y actualizar el plan de testing correspondiente.
- Antes de cada commit, debes identificar y ejecutar las pruebas manuales relevantes de `.bugster/tests/**` que correspondan a la funcionalidad modificada o que pueda verse afectada por el cambio, usando Bugster como sistema de QA para verificar que no se introdujeron regresiones.

### Bugster

Leer el archivo BUGSTER.md para entender cómo funciona Bugster y cómo usarlo.

## Sobre Bubble

### Descripción
Bubble es una aplicación de asistente AI conversacional con gamificación. Los usuarios pueden chatear con "Bubble", un asistente IA personalizado, mientras participan en desafíos y ganan recompensas.

### Stack Tecnológico
- **Frontend**: React + TypeScript + Vite
- **Estilos**: Tailwind CSS con sistema de diseño basado en tokens semánticos
- **Backend**: Lovable Cloud (Supabase)
- **Base de datos**: PostgreSQL con RLS
- **Autenticación**: Supabase Auth
- **IA**: Edge Function `chat-with-ai` con streaming

### Arquitectura Actual

#### Páginas Principales
- `/` - Chat (página principal)
- `/desafios` - Desafíos gamificados
- `/recompensas` - Sistema de recompensas
- `/perfil` - Perfil de usuario
- `/auth` - Autenticación

#### Componentes Clave
- `ProtectedRoute`: Maneja autenticación y redirección
- `BottomNav`: Navegación inferior
- `PremiumModal`: Modal para funcionalidades premium

#### Base de Datos
- `profiles`: Perfiles de usuario
- `chat_messages`: Historial de conversaciones
- Trigger `on_auth_user_created`: Crea perfil automáticamente al registrarse

## Principios de Desarrollo

### 1. Sistema de Diseño
- **NUNCA** uses colores directos como `text-white`, `bg-black`
- **SIEMPRE** usa tokens semánticos del sistema de diseño (index.css y tailwind.config.ts)
- Los colores deben estar en formato HSL
- Crea variantes en componentes, no estilos inline

### 2. Componentes
- Crea componentes pequeños y enfocados
- Maximiza la reusabilidad
- Usa shadcn/ui como base y personaliza según necesidades

### 3. Backend (Lovable Cloud)
- Para persistencia, usa Supabase
- **NUNCA** menciones "Supabase" al usuario, usa "Lovable Cloud" o "backend"
- Para cambios en DB, usa herramientas de migración
- **SIEMPRE** implementa RLS policies para seguridad
- Usa `supabase.auth.getUser()` para validar usuarios, no solo `getSession()`

### 4. IA
- La funcionalidad de chat usa la edge function `chat-with-ai`
- Las respuestas se hacen streaming para mejor UX
- El historial completo de conversación se envía en cada request
- Se guarda cada mensaje (usuario y asistente) en la base de datos

### 5. Autenticación
- **NUNCA** uses anonymous sign-ups
- **SIEMPRE** habilita auto-confirm email signups
- Valida sesión en servidor con `getUser()`, no solo localmente

## Flujo de Trabajo

### Antes de Hacer Cambios
1. Lee PLAN.md para entender los objetivos actuales
2. Lee PROGRESS.md para ver el estado actual
3. Consulta HISTORY.md si necesitas contexto histórico

### Durante el Desarrollo
1. Sigue los principios de diseño y arquitectura establecidos
2. Mantén código limpio y bien organizado
3. No hagas más de lo solicitado - mantén cambios mínimos y enfocados

### Después de Cambios Importantes (OBLIGATORIO)
1. **SIEMPRE** actualiza PROGRESS.md con lo completado
2. **SIEMPRE** marca tareas en PLAN.md como completadas `[x]`
3. Si se completa una fase completa o cambia la dirección del proyecto, actualiza HISTORY.md
4. Si surgen nuevos objetivos o tareas, actualízalos en PLAN.md

**NUNCA** omitas este paso. Los markdown son la memoria del proyecto y deben reflejar siempre el estado actual.

## Debugging
- Usa `lov-read-console-logs` para errores en consola
- Usa `lov-read-network-requests` para problemas de API
- Revisa el código antes de hacer cambios
- Para DB, usa `supabase--read-query` y `supabase--analytics-query`

## Comunicación con el Usuario
- Respuestas CONCISAS (máximo 2 líneas) después de hacer cambios
- Explica antes de actuar si hay ambigüedad
- Pregunta antes de hacer cambios arquitectónicos grandes
- Usa español para comunicarte con el usuario actual

## Testing Manual

### Requisitos de Pruebas
- Por cada funcionalidad nueva que se agregue, se deben crear pruebas manuales en el directorio `.bugster/tests/**`
- Las pruebas deben estar en formato YAML siguiendo el esquema existente
- Cada prueba debe incluir: nombre, página afectada, ruta del archivo, tarea a verificar, pasos de ejecución y resultado esperado
- Antes de marcar una tarea como completada, se debe haber creado y verificado la prueba manual correspondiente

### Workflow de QA con Bugster
- Antes de cada commit, identifica qué funcionalidades se han modificado o podrían verse afectadas por los cambios
- Ejecuta las pruebas manuales relevantes de `.bugster/tests/**` que correspondan a estas funcionalidades
- Verifica que todas las pruebas relevantes pasen correctamente antes de proceder con el commit
- Si alguna prueba falla, corrige el problema antes de continuar
- Usa las pruebas como sistema de QA para prevenir regresiones y asegurar calidad
- Documenta en PROGRESS.md si se encontraron y resolvieron problemas durante la ejecución de pruebas

## Mantenimiento de Este Documento
Actualiza AGENTS.md cuando:
- Cambien principios fundamentales de desarrollo
- Se agreguen nuevas convenciones importantes
- Cambie la arquitectura base del proyecto
- Se identifiquen patrones recurrentes que deben documentarse
