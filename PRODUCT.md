# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Estudiantes de Formación Profesional (FP / ciclos formativos) o instituto que necesitan controlar con precisión sus faltas de asistencia por asignatura a lo largo del curso académico, tanto desde el móvil entre clases como desde el ordenador en casa.

## Product Purpose

**Calculadora de Faltas** permite a cada estudiante registrar sus asignaturas (con sus horas lectivas) y anotar las horas de falta —diferenciando entre faltas justificadas e injustificadas— para saber en todo momento cuánto margen le queda antes de perder el derecho a la evaluación continua.

## Positioning

Registro académico ligero y centrado en horas lectivas adaptado al contexto de FP e instituto en España: acceso sin correo electrónico (solo nombre de usuario, curso y contraseña) y separación explícita entre faltas justificadas e injustificadas por asignatura.

## Operating Context

1. Al llegar por primera vez, el estudiante crea su cuenta en `/register` eligiendo su curso matriculado (de la tabla `cursos` con duración total en horas), un nombre de usuario y una contraseña.
2. En visitas posteriores inicia sesión en `/login` con su nombre de usuario y contraseña, manteniendo sesión mediante cookies `HttpOnly` (`access_token` y `refresh_token`).
3. Toda la interfaz, etiquetas, ayudas y mensajes de validación están redactados en español.

## Capabilities and Constraints

- **Stack existente**: Next.js 16.4.6 (App Router con `cacheComponents: true` y `partialPrefetching: true`), React 19, Tailwind CSS v4, TypeScript, Prisma 7 y PostgreSQL.
- **API de autenticación y cursos existente**:
  - `POST /api/user/sign-up`: recibe `{ name, password, courseId }`, devuelve `201 { user }` o `409` si el usuario ya existe (no emite cookies por sí solo).
  - `POST /api/users/log-in`: recibe `{ name, password }`, verifica bcrypt y emite cookies `HttpOnly` `access_token` (2 h) y `refresh_token` (60 días), devolviendo `200 { refreshToken }`, `404` si el usuario no existe o `401` si la contraseña es incorrecta.
  - `POST /api/users/refresh`: renueva `access_token` a partir de `refresh_token`.
  - `GET /api/courses` y `GET /api/courses/[id]` están protegidos por `requireAuth`. Para el registro público en `/register`, los cursos disponibles se cargan desde servidor (`courseDal.listAll()`), el estudiante elige exclusivamente un curso existente del catálogo (sin crear cursos nuevos desde el registro) y se añade un seed inicial en PostgreSQL con cursos de ejemplo reales.
- **Validación de entrada (`lib/server/schemas/`)**:
  - Nombre de usuario obligatorio tras `trim()` (`requiredTextSchema`).
  - Contraseña obligatoria de al menos 1 carácter y máximo 72 bytes UTF-8 (`MAX_BCRYPT_BYTES`).
  - `courseId` debe ser un UUID válido existente en `cursos`.
- **Arquitectura UI**: Metodología **Atomic Design** (`atoms` → `molecules` → `organisms` → `templates`) con tokens de diseño centralizados y componentes presentacionales separados de la lógica de datos/envío.
- **Convenciones del repositorio (`AGENTS.md`)**: Esquemas Zod en `lib/server/schemas/` agrupados por dominio; utilidades de servidor y DALs marcados con `import 'server-only'`; prohibido usar prefijo `NEXT_PUBLIC_` para secretos.
- **Decisiones de producto aún abiertas**: Porcentaje exacto de pérdida de evaluación continua (p. ej. 15 % o 20 % o configurable), diseño completo del panel principal de asignaturas/faltas tras el acceso, y flujo de recuperación de contraseña (no se almacena email).

## Brand Commitments

- **Nombre de la aplicación**: Calculadora de Faltas.
- **Idioma**: Español.
- **Dirección explícita del usuario para Login y Register**: Estándar moderno y minimalista de la categoría (`canon`) ejecutado con cercanía académica, ligereza visual y cero ruido (listón de calidad de referencia: **Notion**).

## Evidence on Hand

- Esquema Prisma (`prisma/schema.prisma`), seed de 10 cursos FP/Bachillerato (`prisma/seed.ts`), capa DAL (`lib/server/dal/`), helper de sesión (`lib/server/session.ts`), esquemas Zod (`lib/server/schemas/`) y Route Handlers (`app/api/`, incluyendo `POST /api/users/log-out`) implementados.
- Sistema de tokens (`app/tokens.css`, `app/components.css`, `DESIGN.md`, `.impeccable/design.json`) y vistas `/login`, `/register` y `/` construidos con Atomic Design (`components/ui/`) y contenedores separados (`components/containers/`).
- No existen métricas de uso reales, testimonios ni logotipos previos; las futuras pantallas no deben inventar cifras de usuarios ni capacidades inexistentes.

## Product Principles

1. **Acceso sin fricción ni datos innecesarios**: Solicitar solo nombre de usuario, curso y contraseña.
2. **Claridad inmediata sobre el estado y los errores**: Comunicar validaciones, requisitos y respuestas del servidor en español claro y accionable.
3. **Precisión académica antes que adorno**: La herramienta debe transmitir orden, calma y legibilidad en móvil y escritorio.
4. **Sistema UI componible**: Cada átomo y token creado para autenticación sienta la base reutilizable del resto de la aplicación.
