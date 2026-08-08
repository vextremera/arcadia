# Plan de rediseño — Panel de administración ARCADIA

> Documento de arquitectura y plan. **No incluye código todavía.** El objetivo es acordar el enfoque completo antes de implementar. La Fase 1 (Dashboard + Estadísticas) es la primera que se construirá.

## Decisiones ya tomadas

- **Arranque:** plan detallado primero (este documento), luego implementación por fases.
- **Impresoras:** el estado en vivo se hará **simulado (mock)** en esta etapa, con la integración real preparada para más adelante.
- **Stack UI:** se mantiene **Preact + Tailwind 4**, recreando el look **TailAdmin dark** con los componentes propios del repo. Sin dependencias pesadas nuevas salvo la librería de gráficos.
- **Primera sección terminada:** **Dashboard + Estadísticas** (con `lightweight-charts`).

---

## 1. Resumen ejecutivo

El admin actual funciona pero se ha construido "a trozos": cada página repite estilos inline (bordes redondeados enormes, tonos ad-hoc, tarjetas con sombras distintas), no hay una librería de componentes compartida, y las métricas se calculan cargando tablas enteras en memoria y reduciéndolas en JavaScript. El resultado es visualmente inconsistente y no escala.

El rediseño propone tres cosas:

1. **Un sistema de diseño único** (tokens de color, tipografía, espaciado, componentes base) con estética TailAdmin dark, aplicado a un shell nuevo (sidebar + topbar) que todas las secciones comparten.
2. **Una capa de analítica real** (servicio de agregación + tablas de rollup diario) que alimenta el Dashboard, las estadísticas D/W/M y el historial, con gráficos `lightweight-charts`.
3. **Secciones reorganizadas por dominio** con CRUD pulido: catálogo (productos/ingredientes/familias/precios), menú diario, usuarios y rankings, ventas/analítica, y tickets + impresoras (mock).

Se conserva toda la lógica de negocio de `src/server/**` y el modelo de datos existente; el rediseño es de capa de presentación + una capa nueva de agregación de datos.

---

## 2. Diagnóstico del admin actual

**Qué conservar**

- El shell base (`AdminLayout.astro` + `AdminSidebar.astro`) ya tiene sidebar colapsable con persistencia en `localStorage` y estética dark. Es una buena semilla; se refactoriza, no se tira.
- El middleware (`src/middleware.ts`) ya protege `/admin/**` por rol `ADMIN`/`STAFF`. No se toca la seguridad.
- Los patrones de auditoría (`src/server/audit/log.ts`) y la lógica de dominio en `src/server/**`.
- El patrón "islas Preact ↔ API JSON en `src/pages/api/admin/**`" para las partes interactivas (ej. `KitchenBoard.tsx`).

**Qué corregir**

- **Estilos duplicados e inconsistentes:** cada `.astro` define sus propios `rounded-[28px]`, `rounded-[32px]`, paletas de tonos por estado repetidas (`statusTone`, `paymentTone` copiados en varios sitios). No hay componentes reutilizables de tarjeta, badge, tabla, botón, etc.
- **Métricas ineficientes:** `admin/index.astro` hace `db.select().from(Order)` **sin filtros** y agrega en JS (cuenta pedidos, factura, filtra por fecha en memoria). Con volumen real esto es lento y frágil. Falta agregación en base y/o tablas de rollup.
- **IDs manuales:** varios módulos calculan el próximo id con `max(id)+1` cargando toda la tabla (loyalty, audit, menu-v2, payment insert en checkout). Es una condición de carrera y un patrón a estandarizar.
- **Dos convenciones de mutación mezcladas:** unas secciones usan `<form method="post">` + redirect con querystring (menu-v2), otras islas + fetch JSON. Conviene unificar el criterio (ver §7).
- **Sin capa de estadísticas ni historial:** hoy no existe nada de series temporales, comparativas por periodo, ni persistencia de snapshots.

---

## 3. Sistema de diseño (TailAdmin dark adaptado)

La base de referencia es TailAdmin dark. Se traduce a tokens y utilidades Tailwind del repo para no depender de sus componentes React.

### 3.1 Tokens de color (dark)

Se centralizan como variables CSS en `src/styles/global.css` (y opcionalmente `@theme` de Tailwind 4) para dejar de hardcodear hex por página:

| Rol | Valor propuesto | Uso |
|---|---|---|
| `--admin-bg` | `#0b1120` | fondo app |
| `--admin-surface` | `#111827` | tarjetas / paneles |
| `--admin-surface-2` | `#0b1220` | paneles anidados, sidebar |
| `--admin-border` | `rgba(255,255,255,0.08)` | bordes sutiles |
| `--admin-text` | `#e2e8f0` | texto principal |
| `--admin-muted` | `#94a3b8` | texto secundario |
| `--admin-primary` | `#38bdf8` (sky) | acento/acción |
| estados | `emerald / amber / rose / violet / cyan` | success / warning / danger / info |

Radios estandarizados a **3 escalones** (ej. `lg=16px`, `xl=20px`, `2xl=28px`) en lugar de los `[22px]`, `[24px]`, `[26px]`, `[28px]`, `[32px]` sueltos de hoy. Sombras y `backdrop-blur` unificados en una sola clase de "card".

### 3.2 Tipografía y densidad

- Titulares con la escala ya usada (`tracking-[-0.03em]`, pesos 600), pero definidos como componentes `PageHeader`/`SectionTitle` en vez de repetir markup.
- Modo "cómodo" por defecto; se prevé un toggle de **densidad** (compact/comfortable) para tablas grandes de catálogo y ventas.

### 3.3 Librería de componentes a crear

Componentes Astro (estáticos) y Preact (interactivos) reutilizables, en `src/components/admin/ui/**` y `src/islands/admin/ui/**`:

- **Layout:** `PageHeader`, `Toolbar`/`ActionsBar`, `Card`, `PanelSection`, `SplitLayout`.
- **Datos:** `StatCard` (KPI con delta ▲▼ y sparkline opcional), `DataTable` (orden, búsqueda, paginación, densidad, estados vacíos), `Badge`/`StatusPill` (un único mapa de tonos por estado, en vez de las funciones duplicadas), `EmptyState`, `Skeleton`.
- **Formularios:** `Field`, `Input`, `Select`, `Toggle`, `MoneyInput` (euros↔céntimos), `Combobox`, `Modal`/`Drawer`, `ConfirmDialog`, `Toast`.
- **Gráficos:** `ChartCard` (wrapper con título, rango temporal y leyenda) + islas específicas (`AreaChart`, `BarChart`, `Sparkline`) sobre `lightweight-charts`.

Un único mapa `STATUS_TONES` centralizado sustituye a `statusTone`/`paymentTone` repetidos.

---

## 4. Arquitectura de información (nueva navegación)

Reagrupación del sidebar para reflejar los objetivos (gestión de producto, usuarios/rankings, ventas/estadísticas, menú diario, tickets/impresoras):

```
GENERAL
  Dashboard            /admin                     (KPIs + gráficos del día)
  Estadísticas         /admin/estadisticas        (D/W/M + historial)   ← NUEVO

OPERATIVA
  Pedidos              /admin/pedidos
  Cocina               /admin/cocina
  Menú del día         /admin/menu                (flujo rápido diario)
  Operativa            /admin/operativa

CATÁLOGO
  Productos            /admin/catalogo/productos
  Ingredientes         /admin/catalogo/ingredientes
  Familias/Categorías  /admin/categorias
  Modificadores        /admin/catalogo/modificadores
  Compatibilidades     /admin/catalogo/compatibilidades
  Alérgenos            /admin/catalogo/alergenos
  Upsell               /admin/upsell

VENTAS
  Ventas               /admin/ventas              (analítica de negocio)  ← NUEVO
  Cupones              /admin/cupones

CLIENTES
  Usuarios             /admin/usuarios
  Rankings             /admin/usuarios/rankings   ← NUEVO (o pestaña dentro de Usuarios)
  Loyalty              /admin/loyalty
  Newsletter           /admin/newsletter

IMPRESIÓN
  Tickets              /admin/tickets             (editor de plantilla)   ← NUEVO
  Impresoras           /admin/impresoras          (estado live, mock)     ← NUEVO

AJUSTES
  Pagos                /admin/ajustes/pagos
  Fees                 /admin/ajustes/fees
  Auditoría            /admin/audit
```

El `AdminSidebar` pasa a leer los grupos de un archivo de configuración (`src/lib/admin/nav.ts`) en lugar de tenerlos hardcodeados, y los iconos se extraen a un componente `<AdminIcon name>` (hoy son ~19 SVG inline en un switch gigante).

---

## 5. Rediseño del shell

- **Sidebar:** misma mecánica colapsable, pero markup extraído a componentes, iconografía centralizada, y estados activos coherentes con los nuevos tokens. Se añade buscador rápido (⌘K opcional en fase posterior).
- **Topbar:** hoy solo tiene título + "Cerrar sesión". Se enriquece con: migas/rango temporal contextual, indicador de **estado operativo** (pedidos activos/pausados, force-pickup) leído de `AppSetting.opsFlags`, indicador de **impresora** (mini-pill conectada/desconectada) y menú de usuario.
- **Responsive:** el sidebar ya se oculta en `< xl`; se añade un drawer móvil real para pantallas pequeñas (hoy simplemente desaparece).

---

## 6. Fase 1 — Dashboard + Estadísticas (prioritaria)

Es la cara del nuevo admin y la primera entrega completa.

### 6.1 Objetivo

Pasar de "tarjetas con números calculados en JS" a un **dashboard con KPIs + gráficos temporales** y una sección de **Estadísticas** con vistas diaria / semanal / mensual e **historial navegable**.

### 6.2 Dashboard (`/admin`)

- **Fila de KPIs** (`StatCard`): facturación hoy, nº pedidos hoy, ticket medio, pedidos en curso, % delivery vs pickup, nuevos clientes. Cada uno con **delta vs periodo anterior** (▲/▼ %) y **sparkline** de los últimos 14 días.
- **Gráfico principal (área):** facturación por hora del día actual, con comparativa punteada del mismo día de la semana anterior.
- **Gráfico secundario (barras):** pedidos por franja horaria / por canal.
- **Top productos del día** (mini tabla) y **últimos pedidos** (reusando el patrón actual, pero con `DataTable`).
- **Panel operativo** (flags actuales + accesos rápidos), como hoy pero componentizado.

### 6.3 Estadísticas (`/admin/estadisticas`)

- Selector de **rango**: Hoy / Semana / Mes / Personalizado, con navegación anterior/siguiente y comparación contra periodo previo.
- Series: **facturación**, **nº pedidos**, **ticket medio**, desglose por **canal** (delivery/pickup) y por **método de pago** (cash/card).
- **Historial:** tabla de cierres diarios (rollup) exportable a CSV, y vista mensual tipo calendario-heatmap.
- Todo alimentado por la capa de analítica (§8), no por scans en JS.

### 6.4 Integración de `lightweight-charts`

- Se añade la dependencia `lightweight-charts` (vanilla JS, ~45 kB, sin React).
- Se envuelve en **islas Preact** (`AreaChart.tsx`, `BarChart.tsx`, `Sparkline.tsx`) con `client:visible`, creando el chart en `useEffect` sobre un `ref`, aplicando un **tema dark** alineado a los tokens (fondo transparente, grid `--admin-border`, línea `--admin-primary`, tooltip custom).
- Los datos llegan por props (SSR) o por `fetch` a `/api/admin/analytics/**` (para el cambio de rango sin recargar). Manejo de `ResizeObserver` y `remove()` en cleanup.
- Nota: `lightweight-charts` está pensado para series financieras; para KPIs usamos **area/line/histogram** (no velas). Encaja perfecto para facturación/pedidos en el tiempo.

---

## 7. Resto de secciones (fases siguientes)

### 7.1 Catálogo — productos, ingredientes, familias, precios

- **Productos:** `DataTable` con búsqueda, filtro por categoría/estado, edición de **precio** inline (`MoneyInput`), toggles de canal (delivery/pickup/dine-in), y un **Drawer de edición** que agrupa variantes, ingredientes (base/removibles), alérgenos y grupos de modificadores en pestañas — hoy están dispersos en varias páginas/endpoints (`products/[id]/*`).
- **Ingredientes:** grid con imagen (resolución vía `src/server/media/product-images.ts`), precio de extra, flag `isCommon`, edición rápida de `imageUrl`.
- **Familias/Categorías:** orden por drag, activo/inactivo, imagen.
- **Precios:** edición inline + acción masiva ("subir X% a una familia") con confirmación y auditoría.
- **Convención:** unificar a islas + API JSON (`/api/admin/...`) para edición fluida, dejando los formularios POST clásicos solo donde no aporta interactividad.

### 7.2 Menú del día (`/admin/menu`)

- Objetivo del usuario: **cambiar rápido y directo** los platos que rotan a diario.
- Rediseño sobre el sistema **V2** ya existente (`MenuDish` + `MenuDishAssignment`, config en `AppSetting.menuConfigV2`): tablero de tres columnas (Primero / Segundo / Postre) para DIARIO y FESTIVO, con **buscador de platos**, alta rápida en línea, y **drag & drop** entre cursos.
- Mantiene precio y activo por tipo de menú. Se conserva la importación legacy como acción puntual.
- Se moderniza de POST+redirect a interacción por isla (con fallback), manteniendo la lógica de `menu-v2.ts`.

### 7.3 Usuarios y rankings

- **Usuarios:** `DataTable` con rol, estado, gasto total, nº pedidos, puntos y tier; detalle con direcciones, historial de pedidos y ledger de loyalty.
- **Rankings:** leaderboards por **puntos** (de `UserProfile.pointsBalance` / `LoyaltyLedger`) y por **gasto** (agregando `Order.totalCents`), con periodo (total / mes) y tier. Reusa `recomputeTier` para mostrar progreso.

### 7.4 Ventas / analítica de negocio (`/admin/ventas`)

- Vista orientada a negocio (distinta del dashboard operativo): ingresos por periodo, por categoría/producto, por canal y método de pago, descuentos aplicados (cupones), y **exportación**.
- Comparativas y objetivos. Comparte la capa de analítica y los gráficos.

### 7.5 Tickets + impresoras (mock en esta fase)

- **Editor de tickets** (`/admin/tickets`): diseñador de la plantilla que se imprime (cabecera con logo/negocio, líneas de producto con modificadores, totales, pie, QR de seguimiento). Configuración persistida como plantilla (§8). **Preview en vivo** con datos de un pedido de ejemplo y **vista a ancho de papel** (58 mm / 80 mm). Exportación del diseño a un formato imprimible (HTML/ESC-POS se define en la fase real).
- **Impresoras** (`/admin/impresoras`): panel de estado **simulado** — lista de impresoras con nombre/ubicación y pill **Conectada/Desconectada**, última señal, cola de impresión mock, y botón "imprimir prueba". La UI se construye contra una **interfaz de datos** (`getPrinters()`, `getPrinterStatus()`) que hoy devuelve mock y mañana se cablea a ESC/POS / QZ Tray / agente local sin tocar la vista.

---

## 8. Cambios en el modelo de datos (`db/config.ts`)

Añadidos (no se modifica lo existente):

- **`SalesDaily`** (rollup diario para estadísticas/historial rápido):
  `dateISO` (único), `ordersCount`, `revenueCents`, `avgTicketCents`, `deliveryCount`, `pickupCount`, `cashCents`, `cardCents`, `discountCents`, `newCustomers`, `updatedAt`. Se recalcula por job/al cierre y se puede reconstruir desde `Order` en cualquier momento.
- **`ProductSalesDaily`** (opcional, para "top productos" y ventas por producto): `dateISO`, `productId`, `qty`, `revenueCents`.
- **`TicketTemplate`**: `name`, `kind` (TICKET/KITCHEN), `paperWidth` (58/80), `layout` (JSON con secciones/flags), `active`.
- **`Printer`** (mock ahora, real después): `name`, `location`, `kind`, `status` (`ONLINE`/`OFFLINE`), `lastSeenAt`, `config` (JSON). Alternativa ligera: guardarlo en `AppSetting` mientras sea mock, y promover a tabla al integrar hardware.

Decisión abierta: rollup **persistido** (`SalesDaily`) vs **cálculo on-demand con caché**. Recomendación: persistir el diario (barato, permite historial y evita scans), y calcular semana/mes sumando días.

---

## 9. Capa de servidor / API de analítica

Nuevo dominio `src/server/analytics/**`:

- `rollup.ts`: construye/actualiza `SalesDaily`/`ProductSalesDaily` para una fecha (idempotente; reconstruible).
- `queries.ts`: series por rango (día/semana/mes), KPIs con delta vs periodo anterior, top productos, desglose por canal/pago. Aquí se usan **agregaciones en base** (drizzle `sql`/`count`/`sum`) en vez de traer tablas enteras a memoria como hoy.
- API bajo `src/pages/api/admin/analytics/**`: `summary`, `series`, `top-products`, `history`, con validación de rol y respuesta JSON para las islas de gráficos.
- Estrategia de recálculo: al crear/cancelar pedido se marca el día como "sucio" o se recalcula; adicionalmente un recálculo perezoso al abrir estadísticas. (En Vercel no hay cron por defecto; se puede usar tarea programada o recompute on-read.)

---

## 10. Deuda técnica que se corrige de paso

- **IDs manuales `max(id)+1`:** estandarizar a un helper único o apoyarse en autoincrement de Astro DB, eliminando los scans de tabla repartidos (loyalty, audit, menu-v2, payments). Reduce riesgo de colisión.
- **Agregaciones en JS → en base:** el dashboard deja de cargar `Order` completo.
- **Tonos de estado duplicados:** a un único `STATUS_TONES`.
- **Iconos SVG inline:** a componente `<AdminIcon>`.
- **Estilos hardcodeados:** a tokens/clases utilitarias compartidas.

---

## 11. Roadmap por fases

| Fase | Contenido | Entregable |
|---|---|---|
| **0. Fundaciones** | Tokens de color, `global.css`, librería base (`Card`, `StatCard`, `DataTable`, `Badge`, `Modal`, `PageHeader`), `nav.ts`, `<AdminIcon>`, refactor de shell (sidebar/topbar) | Shell nuevo + kit UI, sin romper páginas actuales |
| **1. Dashboard + Estadísticas** *(prioridad)* | `SalesDaily` + `src/server/analytics/**` + API + islas `lightweight-charts` + Dashboard y Estadísticas D/W/M + historial | Sección estrella terminada |
| **2. Catálogo** | Productos (drawer unificado), ingredientes, familias, precios masivos | CRUD de catálogo pulido |
| **3. Menú del día** | Tablero rápido V2 con drag & drop | Cambio diario ágil |
| **4. Usuarios + Rankings + Ventas** | Tablas + leaderboards + analítica de negocio + export | Clientes y ventas |
| **5. Tickets + Impresoras (mock)** | Editor de ticket + preview + panel de estado simulado | Base lista para hardware real |
| **6. Real de impresoras** *(fuera de alcance ahora)* | Integración ESC/POS / agente local | — |

Cada fase mantiene el admin operativo (se migra sección por sección; las no migradas siguen con su estilo hasta su turno).

---

## 12. Riesgos y decisiones abiertas

- **Preact + Tailwind vs fidelidad TailAdmin:** recreamos el look, no clonamos pixel a pixel. Es una decisión ya validada; asumible.
- **Rollup persistido vs on-demand:** recomendación de persistir diario (§8). A confirmar.
- **Recálculo de estadísticas en Vercel:** sin cron nativo; se resuelve con recompute on-read o tarea programada. A definir en Fase 1.
- **Impresión real:** ESC/POS desde web requiere agente local o QZ Tray; se deja como interfaz mockeable ahora.
- **Migración de convención de mutaciones** (POST+redirect → islas JSON): se hace gradual para no romper flujos.

---

## 13. Criterios de aceptación (Fase 1)

- Dashboard y Estadísticas cargan **sin escanear tablas completas** (consultas agregadas o rollup).
- KPIs muestran valor + delta vs periodo anterior y sparkline.
- Gráficos `lightweight-charts` en dark, responsivos, con cambio de rango D/W/M sin recarga completa.
- Historial diario navegable y exportable a CSV; cifras reconciliables con `Order` real.
- Todo bajo el shell nuevo y el sistema de diseño, con componentes reutilizables (sin estilos duplicados).
- Acceso restringido a `ADMIN`/`STAFF` (middleware intacto).

---

### Próximo paso sugerido

Si el plan te encaja, empiezo por la **Fase 0 (fundaciones)** + arranque de la **Fase 1**: tokens + kit UI + shell, y en paralelo la tabla `SalesDaily` con el servicio de analítica y el primer gráfico real en el Dashboard. Dime si quieres ajustar prioridades, la agrupación del sidebar, o la decisión de rollup persistido antes de tocar código.
