---
version: 1
slug: "app-login-page-tsx"
primary_target: "app/login/page.tsx"
related_targets: ["app/register/page.tsx","app/page.tsx"]
---

# Surface Brief: Autenticación (Login y Register)

- **Scope**: Pantallas de acceso `/login`, `/register` y entrada `/` (redirección según sesión) de **Calculadora de Faltas**.
- **Visitor mode**: Operate (`code-led`, sin comp previo; `canon.html` como referencia de estructura).
- **Audience & job**: Estudiantes de FP / ciclos formativos o instituto en móvil (entre clases) y escritorio (en casa) que inician sesión o crean su ficha eligiendo un curso existente del catálogo (sin email).
- **Constraints**:
  - Metodología **Atomic Design** estricta (`atoms` → `molecules` → `organisms` → `templates`) con tokens CSS dedicados y componentes presentacionales separados de la lógica de envío/datos.
  - Endpoints actuales: `POST /api/users/log-in` (`{ name, password }`), `POST /api/user/sign-up` (`{ name, password, courseId }`, seguido de login automático si devuelve 201 para emitir cookies), y lectura de cursos en servidor vía `courseDal.listAll()` (más seed inicial de cursos FP/Instituto en PostgreSQL).
  - Prohibido permitir crear cursos desde el registro; solo selección de curso existente.
  - Todo el copy y errores en español; soporte nativo de modo claro y oscuro (`color-scheme: light dark`), `:user-invalid` + ARIA sincronizada y áreas táctiles ≥ 48px.

## Direction contract

THESIS: Autenticación académica sin fricción en una única tarjeta centrada con la ligereza editorial y limpieza operativa de Notion: solo nombre de usuario, curso existente y contraseña, sin reclamos promocionales, ilustraciones de relleno ni pasos sobrantes.

OWN-WORLD: Superficie base neutra limpia (`#F7F7F5` en claro / `#151514` en oscuro), tarjeta elevada con borde sutil de 1 px (`#FFFFFF` con `#E5E5E0` / `#1D1D1B` con `#2E2E2B`), tinta principal de alto contraste (`#181817` / `#F3F2EE`), texto secundario tintado sobre el neutro (`#5A5A54` / `#A8A79F`) y acento azul cobalto mesurado (`#2151D6` / `#6E9BFF`) reservado únicamente a foco, estado activo y acción primaria. Tipografía Geist Sans y numeración tabular Geist Mono para horas de curso.

STORY: El estudiante llega a `/login` o `/register`, comprende de inmediato qué datos debe introducir (nombre de usuario y contraseña; en registro, elegir su curso oficial con duración en horas), recibe validación clara tras interactuar con cada campo y entra directamente con su sesión activa.

FIRST VIEWPORT: Lienzo centrado con cabecera minimalista de marca (`Calculadora de Faltas` + isotipo SVG geométrico propio) sobre una única tarjeta (`max-width: 420px`, `padding: 32px`). Arriba, conmutador de navegación entre `/login` (`Iniciar sesión`) y `/register` (`Crear cuenta`); debajo, título `h1` directo sin kicker ni eyebrow, breve subtítulo de una línea, campos en columna única con `<label>` encima del control, botón accesible de mostrar/ocultar contraseña, selector `<select>` nativo de curso en `/register` con indicación de horas totales en tabular-nums, errores contextuales bajo cada campo o alerta de formulario tras envío, y botón primario ancho completo (`Iniciar sesión` / `Crear cuenta`). En móvil (`390px`) la tarjeta se adapta con `16px` de margen lateral y altura táctil de `48px` en todos los controles. Interacción firma: transición de `180ms` (`cubic-bezier(0.22, 1, 0.36, 1)`) al enfocar, alternar visibilidad de contraseña o pasar a estado pendiente de envío, junto con feedback tras interacción (`:user-invalid` + anuncio accesible).

FORM: Estándar de la categoría (`canon`, referencia de acabado: Notion), salida permanente de la lista, seed:eb0bc7886ad50fb2

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
