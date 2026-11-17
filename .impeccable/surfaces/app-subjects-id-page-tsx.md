---
version: 1
slug: "app-subjects-id-page-tsx"
primary_target: "app/subjects/[id]/page.tsx"
related_targets: ["app/page.tsx"]
---

# Surface Brief: Detalle de Asignatura y Registro de Faltas

- **Scope**: Vista de detalle por asignatura `/subjects/[id]` y acceso desde tarjetas y menú contextual en `/` de **Calculadora de Faltas**.
- **Visitor mode**: Operate (`code-led`, extensión dentro del mundo establecido "The Academic Ledger").
- **Audience & job**: Estudiantes de FP e instituto en móvil o escritorio que consultan el desglose horario de una asignatura concreta, verifican cuántas horas injustificadas consumen su límite del 15 %, añaden nuevas faltas (+1 h, +2 h, +3 h), alternan el estado justificada/injustificada de cada registro o eliminan faltas anotadas por error.
- **Constraints**:
  - Metodología **Atomic Design** estricta (`atoms` → `molecules` → `organisms` → `templates`) gobernada únicamente por tokens CSS en `app/tokens.css` y clases en `app/components.css`.
  - Solo las faltas **injustificadas** (`justified: false`) consumen el límite del 15 % de evaluación continua; las faltas **justificadas** (`justified: true`) se contabilizan por separado como informativas tanto en el panel de detalle como en el resumen general.
  - Navegación desde `/`: clic en cualquier área de la tarjeta de asignatura (mediante enlace estirado `.cf-subject-card-link` excluyendo botones rápidos y menú) y opción "Ver detalles" dentro del menú contextual (`SubjectContextMenu`).
  - Endpoints utilizados: `GET /api/subjects/[id]`, `GET /api/absences?subjectId=...`, `POST /api/absences`, `PATCH /api/absences/[id]` y `DELETE /api/absences/[id]`.

## Direction contract

THESIS: Ficha académica operativa que combina un panel compacto de métricas horarias (separando horas injustificadas que consumen el 15 % de las justificadas informativas) con el historial cronológico accionable de faltas, evitando modales y gráficos decorativos.

OWN-WORLD: Superficie base neutra cálida (`#F7F7F5` en claro / `#151514` en oscuro), tarjetas y filas delimitadas por bordes de 1 px (`#FFFFFF` con `#E5E5E0` / `#1D1D1B` con `#2E2E2B`), tinta principal de alto contraste (`#181817` / `#F3F2EE`), texto secundario (`#5A5A54` / `#A8A79F`), acento azul cobalto (`#2151D6` / `#7CA6FF`) y semántica de alerta (`#DC2626` / `#F87171`) al superar el 15 % injustificado. Tipografía Geist Sans y numeración tabular Geist Mono.

STORY: El estudiante entra desde una tarjeta del panel principal o su menú contextual, visualiza de un vistazo el margen de evaluación continua de la asignatura y el desglose entre faltas injustificadas y justificadas, añade nuevas horas de falta o corrige al instante cualquier registro (justificar/injustificar o eliminar) sin perder el contexto.

FIRST VIEWPORT: Cabecera superior a ancho completo (`cf-topbar`) con marca, usuario y cierre de sesión; debajo, barra de retorno (`Volver a asignaturas`), cabecera de asignatura con título `h1` directo sin kicker, curso, estado de convalidación y botonera rápida (`+1 h`, `+2 h`, +3 h`), seguida del panel compacto de estadísticas (carga lectiva, barra de progreso del límite del 15 %, faltas injustificadas vs. límite, faltas justificadas informativas y margen disponible) y la lista cronológica de faltas con fecha formateada, horas en `tabular-nums`, badge de estado y controles de alternar justificación y eliminar con áreas táctiles de 48 px.

FORM: Extensión directa del mundo establecido (`canon`, referencia de acabado: Notion), seed:eb0bc7886ad50fb2

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
