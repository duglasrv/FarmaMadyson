# 🏗️ FARMA MADYSON — Blueprint de Completitud del Sistema

## Guía para finalizar todos los módulos pendientes

> **Estado actual:** 8 de 14 módulos completos (57%)
> **Objetivo:** 14 de 14 módulos completos (100%)
> **Herramienta de desarrollo:** Claude Opus 4.6 vía Copilot en VS Code
> **Fecha:** Marzo 2026

---

## ⚠️ REGLAS PARA LA IA — OBLIGATORIAS EN CADA FASE

```
R1. NO eliminar, renombrar ni modificar archivos existentes que funcionen.
    Solo CREAR archivos nuevos o AGREGAR código a archivos existentes.

R2. Cada página nueva DEBE seguir el patrón de las páginas admin existentes:
    - Usar los mismos componentes de UI (DataTable, Modal, FormField, etc.)
    - Usar el mismo hook useApi() para llamadas al backend
    - Usar el mismo patrón de permisos con usePermissions()
    - Mantener consistencia visual con las páginas ya terminadas

R3. ANTES de crear una página, verificar qué componentes reutilizables
    ya existen en /components/admin/ y /components/ui/.
    NO crear componentes duplicados.

R4. Todas las tablas DEBEN tener:
    - Paginación server-side (ya implementada con query params page + limit)
    - Al menos 1 filtro relevante
    - Columna de acciones
    - Estado loading con skeleton
    - Estado vacío con mensaje e ícono

R5. Todos los formularios DEBEN tener:
    - Validación client-side (Zod o el patrón existente)
    - Estados loading en botón submit
    - Manejo de errores con toast notification
    - Mensaje de éxito con toast notification
    - Botón cancelar que regresa a la lista

R6. NO inventar endpoints que no existen en la auditoría.
    La lista exacta de endpoints disponibles está documentada aquí.
    Si necesitas un endpoint que no existe, indicarlo con TODO
    pero NO bloquear la UI por eso.

R7. Respetar el sistema de permisos CASL:
    - Cada página debe verificar permisos antes de renderizar
    - Usar @RequirePermission en el backend si se crea endpoint nuevo
    - Botones de acción deben respetar permisos del usuario

R8. Para módulos con API ya lista, el trabajo es SOLO FRONTEND.
    No tocar el backend para estos módulos:
    Categorías, Inventario, Proveedores, Órdenes de Compra.

R9. Para módulos que necesitan API nueva, crear:
    - module.ts, controller.ts, service.ts, dto/ folder
    - Registrar módulo en app.module.ts
    - Documentar con @ApiTags en Swagger
    Esto aplica a: Clientes, Configuración, Banners.

R10. Archivos de página van en: apps/web/src/app/admin/[modulo]/page.tsx
     Componentes específicos del módulo van en: apps/web/src/components/admin/[modulo]/
     Hooks específicos van en: apps/web/src/hooks/
```

---

## 📊 MAPA COMPLETO DE LO QUE FALTA

| # | Módulo | API | Frontend | Esfuerzo | Fase |
|---|--------|-----|----------|----------|------|
| 1 | Categorías admin | ✅ Listo | ❌ 1 página | Pequeño | 1 |
| 2 | Proveedores admin | ✅ Listo | ❌ 1 página | Pequeño | 1 |
| 3 | Órdenes de Compra admin | ✅ Listo | ❌ 2 páginas | Mediano | 1 |
| 4 | Inventario admin | ✅ Listo | ❌ 4 páginas | Grande | 1 |
| 5 | Clientes admin | ❌ Crear API | ❌ 2 páginas | Mediano | 2 |
| 6 | Configuración General | ❌ Crear API | ❌ 1 página | Mediano | 2 |
| 7 | Banners admin | ❌ Crear API | ❌ 1 página + tienda | Mediano | 2 |
| 8 | Visor Audit Log | — (interceptor existe) | ❌ 1 página | Pequeño | 3 |
| 9 | Servicio de Email + 2FA | ❌ Configurar | ❌ Reactivar | Mediano | 3 |
| 10 | Reviews/Reseñas admin | ❌ Crear API | ❌ 1 página | Mediano | 3 |
| 11 | Google OAuth | ❌ Strategy | — | Pequeño | 3 |

**Total de trabajo restante:**
- Páginas frontend nuevas: **13**
- Endpoints API nuevos: **~15**
- Servicios backend nuevos: **4** (users, settings, banners, reviews)

---

## 🏗️ FASE 1 — OPERACIÓN DE LA FARMACIA

> **Objetivo:** Poder gestionar categorías, proveedores, compras e inventario desde el admin.
> **Prerequisito:** Estos módulos tienen la API 100% lista. Solo falta construir las páginas frontend.
> **NO tocar el backend en esta fase.**

---

### 1.1 — Categorías (`/admin/categorias`)

**Archivo a crear:** `apps/web/src/app/admin/categorias/page.tsx`

**API disponible (NO crear endpoints nuevos):**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/categories` | Árbol completo |
| POST | `/categories` | Crear (body: name, slug, description, icon, parentId, sortOrder, isActive) |
| PATCH | `/categories/:id` | Actualizar |
| PATCH | `/categories/reorder` | Reordenar (body: array de { id, sortOrder, parentId }) |
| DELETE | `/categories/:id` | Eliminar |

**Layout de la página:**

```
┌──────────────────────────────────────────────────────┐
│ H1: Categorías              [+ Nueva categoría]      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ÁRBOL DE CATEGORÍAS (vista jerárquica)              │
│                                                      │
│  📁 Medicamentos                    [Editar] [🗑️]   │
│    ├── 💊 Antibióticos              [Editar] [🗑️]   │
│    ├── 💊 Analgésicos               [Editar] [🗑️]   │
│    ├── 💊 Antigripales              [Editar] [🗑️]   │
│    └── 💊 Pediátricos               [Editar] [🗑️]   │
│  📁 Nutrición                       [Editar] [🗑️]   │
│    ├── 🍼 Fórmulas Infantiles       [Editar] [🗑️]   │
│    └── 💪 Suplementos               [Editar] [🗑️]   │
│  📁 Cuidado Personal                [Editar] [🗑️]   │
│  📁 Dispositivos Médicos            [Editar] [🗑️]   │
│                                                      │
│  Cada fila muestra: ícono + nombre + # productos +   │
│  badge activo/inactivo + botones de acción           │
│                                                      │
│  Drag & drop para reordenar (opcional, si el         │
│  componente DnD ya existe; si no, usar botones       │
│  ↑↓ para reordenar)                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Modal Crear/Editar Categoría:**

```
┌─────────────────────────────────────┐
│ Crear categoría        [X cerrar]   │
├─────────────────────────────────────┤
│                                     │
│ Nombre *          [_______________] │
│ Slug (auto)       [_______________] │
│ Descripción       [_______________] │
│ Ícono (emoji/text)[_______________] │
│ Categoría padre   [▼ Ninguna     ] │ ← Select con opción "Ninguna" para top-level
│                                     │
│ □ Activa                            │ ← Checkbox, default: true
│                                     │
│           [Cancelar] [Guardar]      │
└─────────────────────────────────────┘
```

**Comportamientos:**
- Al escribir el nombre, el slug se auto-genera (slugify).
- El select de "Categoría padre" muestra todas las categorías top-level existentes.
- Al guardar, llamar POST o PATCH según sea crear o editar.
- Al eliminar, mostrar diálogo de confirmación: "¿Eliminar categoría X? Los productos asociados quedarán sin categoría."
- Toast de éxito: "Categoría creada/actualizada exitosamente"
- Toast de error si falla.
- Permiso requerido para ver la página: `category:read`
- Permiso requerido para crear/editar: `category:create` / `category:update`
- Permiso requerido para eliminar: `category:delete`

---

### 1.2 — Proveedores (`/admin/proveedores`)

**Archivo a crear:** `apps/web/src/app/admin/proveedores/page.tsx`

**API disponible:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/suppliers` | Lista de proveedores |
| POST | `/suppliers` | Crear proveedor |
| PATCH | `/suppliers/:id` | Actualizar |
| GET | `/suppliers/:id/history` | Historial de compras del proveedor |

**Layout de la página:**

```
┌───────────────────────────────────────────────────────────────────┐
│ H1: Proveedores                          [+ Nuevo proveedor]     │
├───────────────────────────────────────────────────────────────────┤
│ [🔍 Buscar proveedor...]                                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  TABLA:                                                           │
│  ┌────────┬──────────────┬─────────────┬──────────┬────────────┐ │
│  │ Nombre │ Contacto     │ Teléfono    │ Estado   │ Acciones   │ │
│  ├────────┼──────────────┼─────────────┼──────────┼────────────┤ │
│  │ Solu-  │ info@solu..  │ 7890-1234   │ 🟢 Act. │ [✏️] [📋]  │ │
│  │ farma  │              │             │          │            │ │
│  └────────┴──────────────┴─────────────┴──────────┴────────────┘ │
│                                                                   │
│  ✏️ = Editar (abre modal)                                        │
│  📋 = Ver historial de compras (abre panel lateral o modal)      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Modal Crear/Editar Proveedor:**

```
Campos del formulario:
- Nombre *              (text input)
- Nombre de contacto    (text input)
- Email                 (email input)
- Teléfono              (text input)
- Dirección             (textarea)
- NIT / RFC             (text input)
- Notas                 (textarea)
- □ Activo              (checkbox, default true)
```

**Modal/Panel Historial de Compras:**
- Llama a GET `/suppliers/:id/history`
- Muestra tabla: Número OC, Fecha, Estado, Total
- Click en OC navega a `/admin/compras/:id` (cuando exista)

---

### 1.3 — Órdenes de Compra (`/admin/compras`)

**Archivos a crear:**
- `apps/web/src/app/admin/compras/page.tsx` — Lista
- `apps/web/src/app/admin/compras/nueva/page.tsx` — Crear / Detalle

**API disponible:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/purchase-orders` | Lista paginada |
| POST | `/purchase-orders` | Crear OC (DRAFT) |
| POST | `/purchase-orders/:id/send` | Marcar como enviada |
| POST | `/purchase-orders/:id/receive` | Recibir mercadería → crea batches + movimientos |
| DELETE | `/purchase-orders/:id` | Cancelar (solo DRAFT) |

**Dependencia:** La página necesita la lista de proveedores (GET `/suppliers`) y la lista de variantes de productos (GET `/products/admin/list`) para poder seleccionar qué comprar.

**Página 1: Lista (`/admin/compras`)**

```
┌───────────────────────────────────────────────────────────────────────┐
│ H1: Órdenes de Compra                       [+ Nueva orden]         │
├───────────────────────────────────────────────────────────────────────┤
│ Filtros: [▼ Estado: Todos] [▼ Proveedor: Todos]                     │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  TABLA:                                                               │
│  ┌────────┬────────────┬──────────┬────────┬──────────┬────────────┐ │
│  │ # OC   │ Proveedor  │ Estado   │ Total  │ Fecha    │ Acciones   │ │
│  ├────────┼────────────┼──────────┼────────┼──────────┼────────────┤ │
│  │ PO-001 │ Solufarma  │ DRAFT    │ Q 850  │ 10/03/26 │ [Ver] [🗑] │ │
│  │ PO-002 │ Solufarma  │ SENT     │ Q 2300 │ 08/03/26 │ [Ver]      │ │
│  │ PO-003 │ Solufarma  │ RECEIVED │ Q 1200 │ 01/03/26 │ [Ver]      │ │
│  └────────┴────────────┴──────────┴────────┴──────────┴────────────┘ │
│                                                                       │
│  Badges de estado con colores:                                        │
│  DRAFT = gris, SENT = azul, PARTIALLY_RECEIVED = ámbar,              │
│  RECEIVED = verde, CANCELLED = rojo                                   │
│                                                                       │
│  🗑️ solo visible para OC en estado DRAFT                              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Página 2: Crear/Detalle (`/admin/compras/nueva` y `/admin/compras/[id]`)**

Estas pueden ser la misma página con lógica condicional (si tiene ID = modo ver/editar, si no = modo crear).

```
┌───────────────────────────────────────────────────────────────────────┐
│ ← Volver a Órdenes de Compra                                        │
│ H1: Nueva Orden de Compra    (o "OC #PO-001" si es detalle)         │
│                               Estado: [DRAFT]  (badge)              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ SECCIÓN ENCABEZADO:                                                   │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Proveedor * [▼ Seleccionar proveedor]                          │  │
│ │ Notas       [________________________________]                  │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ SECCIÓN ITEMS:                                                        │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ [+ Agregar producto]                                            │  │
│ │                                                                 │  │
│ │ ┌──────────────┬──────────┬────────────┬──────────┬──────────┐ │  │
│ │ │ Producto/Var │ Cantidad │ Costo Unit │ Subtotal │ Acción   │ │  │
│ │ ├──────────────┼──────────┼────────────┼──────────┼──────────┤ │  │
│ │ │ Amoxicilina  │ [  10  ] │ [  10.50 ] │ Q 105.00│ [🗑️]     │ │  │
│ │ │ 500mg caja   │          │            │          │          │ │  │
│ │ ├──────────────┼──────────┼────────────┼──────────┼──────────┤ │  │
│ │ │ Acetaminofen │ [  50  ] │ [   8.50 ] │ Q 425.00│ [🗑️]     │ │  │
│ │ │ jarabe 120ml │          │            │          │          │ │  │
│ │ └──────────────┴──────────┴────────────┴──────────┴──────────┘ │  │
│ │                                                                 │  │
│ │                              SUBTOTAL:  Q 530.00                │  │
│ │                              IVA (12%): Q  63.60                │  │
│ │                              TOTAL:     Q 593.60                │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ ACCIONES (según estado):                                              │
│ Si DRAFT:   [Guardar borrador] [Enviar a proveedor] [Cancelar OC]   │
│ Si SENT:    [Recibir mercadería]                                      │
│ Si RECEIVED: (solo lectura, mostrar fecha de recepción)               │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Flujo "Agregar producto":**
1. Click en "+ Agregar producto" abre un searchable dropdown o modal de búsqueda.
2. Busca entre las variantes de productos existentes (GET `/products/admin/list`).
3. Al seleccionar, se agrega una fila a la tabla de items.
4. El costo unitario se pre-llena con `variant.purchasePrice` pero es editable.
5. Cantidad es editable. Subtotal se calcula automáticamente.

**Flujo "Recibir mercadería" (CRÍTICO):**
1. Al click en "Recibir mercadería" se abre un modal/formulario.
2. Por cada item de la OC, mostrar campos adicionales:
   - Cantidad recibida (puede ser menor que la pedida)
   - Número de lote (texto libre)
   - Fecha de vencimiento (date picker, formato MM/YYYY o DD/MM/YYYY)
3. Al confirmar, llama POST `/purchase-orders/:id/receive`.
4. El backend automáticamente crea ProductBatch + InventoryMovement.
5. Toast: "Mercadería recibida exitosamente. X lotes creados."
6. Redirigir a la lista de OC.

---

### 1.4 — Inventario (`/admin/inventario`) — 4 PÁGINAS

**Archivos a crear:**
- `apps/web/src/app/admin/inventario/page.tsx` — Stock Actual
- `apps/web/src/app/admin/inventario/movimientos/page.tsx` — Movimientos
- `apps/web/src/app/admin/inventario/alertas/page.tsx` — Alertas
- `apps/web/src/app/admin/inventario/por-vencer/page.tsx` — Por Vencer

**API disponible:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/inventory/dashboard` | KPIs: total productos, con stock, bajo stock, sin stock, valor total |
| GET | `/inventory/variants/:id/stock` | Stock desglosado por lote para una variante |
| GET | `/inventory/movements` | Movimientos paginados (query: type, variantId, page, limit) |
| POST | `/inventory/receive` | Recibir stock (body: variantId, quantity, batchNumber, costPrice, expirationDate, supplierId) |
| POST | `/inventory/adjust` | Ajuste manual (body: variantId, batchId, quantity, reason) |
| GET | `/inventory/expiring` | Lotes por vencer (query: days = 30/60/90) |
| GET | `/inventory/alerts` | Alertas activas (query: type, isResolved) |
| PATCH | `/inventory/alerts/:id/resolve` | Resolver alerta |

#### Página 1: Stock Actual (`/admin/inventario`)

```
┌───────────────────────────────────────────────────────────────────────┐
│ H1: Inventario                  [Recibir stock] [Ajuste manual]      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ KPI CARDS (4 tarjetas en fila, datos de GET /inventory/dashboard):    │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ 📦 Total     │ │ ✅ Con stock │ │ ⚠️ Stock bajo│ │ ❌ Sin stock │ │
│ │    124       │ │    98        │ │    18        │ │    8         │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                       │
│ ┌──────────────┐                                                      │
│ │ 💰 Valor     │  ← Valor total del inventario al costo              │
│ │  Q 45,230    │                                                      │
│ └──────────────┘                                                      │
│                                                                       │
│ FILTROS: [🔍 Buscar...] [▼ Estado: Todos/En stock/Bajo/Sin]         │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  TABLA DE VARIANTES CON STOCK:                                        │
│  ┌──────────┬──────────┬───────┬────────┬────────┬──────┬──────────┐ │
│  │ Producto │ Variante │ SKU   │ Stock  │ Costo  │ Est. │ Acciones │ │
│  ├──────────┼──────────┼───────┼────────┼────────┼──────┼──────────┤ │
│  │ Amoxici- │ Caja x10 │ AM001 │  45    │ Q10.50 │ 🟢   │ [📋][+] │ │
│  │ lina 500 │          │       │        │        │      │          │ │
│  ├──────────┼──────────┼───────┼────────┼────────┼──────┼──────────┤ │
│  │ Acetami- │ Jarabe   │ AC002 │   3 ⚠️ │ Q 8.50 │ 🟡   │ [📋][+] │ │
│  │ nofén    │ 120ml    │       │        │        │      │          │ │
│  ├──────────┼──────────┼───────┼────────┼────────┼──────┼──────────┤ │
│  │ Loratad. │ Tab ind. │ LO003 │   0 ❌ │ Q 0.40 │ 🔴   │ [📋][+] │ │
│  └──────────┴──────────┴───────┴────────┴────────┴──────┴──────────┘ │
│                                                                       │
│  📋 = Ver detalle de lotes (expande fila o abre panel)               │
│  + = Recibir stock rápido (abre modal pre-llenado con esta variante) │
│                                                                       │
│  Estado: 🟢 stock > umbral, 🟡 stock <= umbral, 🔴 stock = 0        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Panel/Expansión "Detalle de lotes" al clickear 📋:**
- Llama GET `/inventory/variants/:id/stock`
- Muestra tabla interna de lotes:

```
  ┌──────────┬──────────┬──────────┬──────────┬──────────────────┐
  │ # Lote   │ Cantidad │ Costo    │ Vence    │ Estado           │
  ├──────────┼──────────┼──────────┼──────────┼──────────────────┤
  │ LOT-001  │    30    │ Q 10.50  │ 04/2026  │ ⚠️ Vence pronto │
  │ LOT-002  │    15    │ Q 10.50  │ 02/2027  │ ✅ OK            │
  └──────────┴──────────┴──────────┴──────────┴──────────────────┘
```

**Modal "Recibir Stock" (botón superior o botón + en la fila):**

```
┌─────────────────────────────────────────┐
│ Recibir Inventario            [X]       │
├─────────────────────────────────────────┤
│                                         │
│ Producto/Variante * [▼ Buscar...]       │ ← Si se abrió desde una fila,
│                                         │    viene pre-seleccionado
│ Cantidad *          [________]          │
│ Número de lote      [________]          │
│ Costo unitario *    [________]          │ ← Pre-llenado con purchasePrice
│ Fecha vencimiento * [📅 DD/MM/YYYY]    │
│ Proveedor           [▼ Seleccionar]     │
│ Notas               [________________] │
│                                         │
│            [Cancelar] [Recibir stock]   │
└─────────────────────────────────────────┘
```

- Al confirmar: POST `/inventory/receive`
- Toast éxito: "Stock recibido: X unidades de [producto]"
- Refrescar la tabla de stock

**Modal "Ajuste Manual":**

```
┌─────────────────────────────────────────┐
│ Ajuste de Inventario          [X]       │
├─────────────────────────────────────────┤
│                                         │
│ Producto/Variante * [▼ Buscar...]       │
│ Lote *              [▼ Seleccionar]     │ ← Lista de lotes de esa variante
│ Tipo de ajuste      (○ Agregar)(○ Quitar)│
│ Cantidad *          [________]          │
│ Razón *             [________________] │ ← Obligatorio: "Conteo físico",
│                                         │   "Daño", "Pérdida", etc.
│                                         │
│            [Cancelar] [Aplicar ajuste]  │
└─────────────────────────────────────────┘
```

- Al confirmar: POST `/inventory/adjust`
- Toast éxito: "Ajuste aplicado: +/- X unidades"

#### Página 2: Movimientos (`/admin/inventario/movimientos`)

```
┌───────────────────────────────────────────────────────────────────────┐
│ H1: Movimientos de Inventario                                        │
├───────────────────────────────────────────────────────────────────────┤
│ Filtros:                                                              │
│ [▼ Tipo: Todos] [🔍 Buscar producto...] [📅 Desde] [📅 Hasta]      │
│                                                                       │
│ Tipos de filtro:                                                      │
│ PURCHASE = Compra, SALE = Venta, ADJUSTMENT = Ajuste,                │
│ RETURN = Devolución, LOSS = Pérdida, EXPIRED = Vencido               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  TABLA:                                                               │
│  ┌────────┬──────────┬──────┬──────────┬───────────┬───────┬───────┐ │
│  │ Fecha  │ Producto │ Tipo │ Cantidad │ Referenc. │ Lote  │ User  │ │
│  ├────────┼──────────┼──────┼──────────┼───────────┼───────┼───────┤ │
│  │ 10/03  │ Amox.500 │ 📦   │ +50      │ PO-003    │ L-001 │ Admin │ │
│  │ 10/03  │ Acetam.  │ 🛒   │ -2       │ FM-00045  │ L-002 │ Sist. │ │
│  │ 09/03  │ Lorat.   │ ⚙️   │ +10      │ Conteo    │ L-003 │ Admin │ │
│  └────────┴──────────┴──────┴──────────┴───────────┴───────┴───────┘ │
│                                                                       │
│  Íconos por tipo: 📦 PURCHASE, 🛒 SALE, ⚙️ ADJUSTMENT,             │
│                   ↩️ RETURN, ❌ LOSS, ⏰ EXPIRED                     │
│                                                                       │
│  Cantidad: verde si positiva (+), rojo si negativa (-)               │
│  Referencia: número de OC o número de pedido                         │
│                                                                       │
│  Paginación server-side al fondo                                      │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

- API: GET `/inventory/movements?type=PURCHASE&page=1&limit=20`

#### Página 3: Alertas (`/admin/inventario/alertas`)

```
┌───────────────────────────────────────────────────────────────────────┐
│ H1: Alertas de Inventario                                            │
├───────────────────────────────────────────────────────────────────────┤
│ Filtros: [▼ Tipo: Todas] [▼ Estado: Activas / Resueltas]            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Lista de tarjetas de alerta:                                         │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ 🔴 SIN STOCK                                   Hace 2 horas  │   │
│  │ Loratadina Select Tab. Individual (SKU: LO003)               │   │
│  │ Stock actual: 0 unidades                                     │   │
│  │                                          [Resolver] [Recibir]│   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ 🟡 STOCK BAJO                                  Hace 5 horas  │   │
│  │ Acetaminofén Select Jarabe 120ml (SKU: AC002)                │   │
│  │ Stock actual: 3 unidades (umbral: 5)                         │   │
│  │                                          [Resolver] [Recibir]│   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ POR VENCER                                  Hace 1 día    │   │
│  │ Amoxicilina Select 500mg Lote L-001                          │   │
│  │ Vence: 04/2026 (en 30 días) — 20 unidades                   │   │
│  │                                                   [Resolver] │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Colores de badge: 🔴 OUT_OF_STOCK/EXPIRED, 🟡 LOW_STOCK,          │
│                    ⚠️ NEAR_EXPIRY                                    │
│                                                                       │
│  [Resolver] = PATCH /inventory/alerts/:id/resolve                    │
│  [Recibir] = Abre modal de recibir stock pre-llenado con variante    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

#### Página 4: Por Vencer (`/admin/inventario/por-vencer`)

```
┌───────────────────────────────────────────────────────────────────────┐
│ H1: Productos por Vencer                          [Exportar Excel]   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ 3 TABS de urgencia:                                                   │
│ [🔴 30 días (5)] [🟡 60 días (12)] [🟢 90 días (23)]               │
│                                                                       │
│  TABLA:                                                               │
│  ┌──────────┬──────────┬──────┬──────────┬────────────┬────────────┐ │
│  │ Producto │ Lote     │ Cant │ Costo    │ Vence      │ Urgencia   │ │
│  ├──────────┼──────────┼──────┼──────────┼────────────┼────────────┤ │
│  │ Amox.500 │ L-001    │  20  │ Q 210.00 │ 15/04/2026 │ 🔴 34 días│ │
│  │ Ensure   │ L-005    │   3  │ Q1047.00 │ 22/05/2026 │ 🟡 71 días│ │
│  └──────────┴──────────┴──────┴──────────┴────────────┴────────────┘ │
│                                                                       │
│  API: GET /inventory/expiring?days=30 (o 60, o 90)                   │
│  Cambiar entre tabs recarga con el parámetro days                    │
│                                                                       │
│  [Exportar Excel] genera descarga con todos los datos visibles       │
│  (reutilizar el mismo patrón de export que ya existe en reportes)    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**✅ VALIDACIÓN FASE 1 — Debe cumplirse antes de pasar a Fase 2:**
- [ ] `/admin/categorias` muestra árbol, permite crear/editar/eliminar categorías
- [ ] `/admin/proveedores` muestra tabla, permite crear/editar proveedores
- [ ] `/admin/compras` muestra lista de OC con filtro por estado
- [ ] `/admin/compras/nueva` permite crear OC con items y recibir mercadería
- [ ] `/admin/inventario` muestra KPIs + tabla de stock + detalle por lotes
- [ ] Se puede recibir stock y hacer ajustes desde el inventario
- [ ] `/admin/inventario/movimientos` muestra historial con filtros
- [ ] `/admin/inventario/alertas` muestra alertas y permite resolverlas
- [ ] `/admin/inventario/por-vencer` muestra 3 niveles de urgencia
- [ ] NINGUNA página existente se rompió en el proceso

---

## 🏗️ FASE 2 — CONTROL Y GESTIÓN

> **Objetivo:** Gestión de clientes, configuración del sistema, y banners promocionales.
> **Nota:** Esta fase REQUIERE crear nuevos endpoints en el backend.

---

### 2.1 — Clientes/Usuarios (`/admin/clientes`)

**⚠️ REQUIERE CREAR API NUEVA**

#### Backend — Crear UsersModule

**Archivos a crear en `apps/api/src/users/`:**
```
users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
└── dto/
    ├── list-users-query.dto.ts
    └── update-user.dto.ts
```

**Registrar en `app.module.ts`:** Agregar `UsersModule` al array de imports.

**Endpoints a crear:**

```typescript
// GET /users — Lista de usuarios paginada
// Query params: page, limit, search (email o nombre), role, isActive
// Permiso: @RequirePermission('user', 'read')
// Respuesta: { data: User[], total, page, limit }
// IMPORTANTE: NO devolver passwordHash en la respuesta
// Incluir: roles (con include), conteo de pedidos (_count: { orders: true })

// GET /users/:id — Detalle de usuario
// Permiso: @RequirePermission('user', 'read')
// Incluir: roles, addresses, orders (últimos 10), prescriptions

// PATCH /users/:id — Actualizar usuario
// Permiso: @RequirePermission('user', 'update')
// Body: { isActive?, firstName?, lastName?, phone? }
// NO permitir cambiar email ni password desde aquí

// POST /users/:id/roles — Asignar rol
// Permiso: @RequirePermission('settings', 'manage_roles')
// Body: { roleId }
// Crear UserRole, invalidar cache CASL del usuario

// DELETE /users/:id/roles/:roleId — Quitar rol
// Permiso: @RequirePermission('settings', 'manage_roles')
// Eliminar UserRole, invalidar cache CASL

// GET /users/:id/orders — Pedidos del usuario
// Permiso: @RequirePermission('user', 'read')
// Query: page, limit
```

#### Frontend — 2 páginas

**Página 1: Lista (`/admin/clientes`)**

```
┌───────────────────────────────────────────────────────────────────────┐
│ H1: Clientes                                                         │
├───────────────────────────────────────────────────────────────────────┤
│ [🔍 Buscar por nombre o email...] [▼ Rol: Todos] [▼ Estado: Todos]  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  TABLA:                                                               │
│  ┌──────────┬──────────────┬──────┬────────┬──────────┬────────────┐ │
│  │ Nombre   │ Email        │ Rol  │ Estado │ Pedidos  │ Acciones   │ │
│  ├──────────┼──────────────┼──────┼────────┼──────────┼────────────┤ │
│  │ Juan P.  │ juan@gm..    │ Cli. │ 🟢 Act│   12     │ [Ver]      │ │
│  │ María L. │ maria@gm..   │ Cli. │ 🟢 Act│    5     │ [Ver]      │ │
│  │ Admin    │ admin@fa..   │ S.A. │ 🟢 Act│    0     │ [Ver]      │ │
│  └──────────┴──────────────┴──────┴────────┴──────────┴────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Página 2: Detalle (`/admin/clientes/[id]`)**

```
┌───────────────────────────────────────────────────────────────────────┐
│ ← Volver a Clientes                                                  │
│ H1: Juan Pérez                  Estado: [🟢 Activo] [Desactivar]    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ INFO DEL CLIENTE:                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Email: juan@gmail.com                                           │  │
│ │ Teléfono: 5555-1234                                             │  │
│ │ Registrado: 01/02/2026                                          │  │
│ │ Último login: 10/03/2026                                        │  │
│ │ Verificado: ✅ Sí                                               │  │
│ │ Rol actual: Cliente    [Cambiar rol ▼]                          │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ DIRECCIONES:                                                          │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ 🏠 Casa: 4 Av 2-70 Zona 2, Chimaltenango                      │  │
│ │ 🏢 Oficina: 6 Calle 3-45 Zona 1, Guatemala                    │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ HISTORIAL DE PEDIDOS (últimos 10):                                    │
│ ┌────────┬──────────┬────────┬──────────┐                            │
│ │ # Orden│ Fecha    │ Total  │ Estado   │                            │
│ ├────────┼──────────┼────────┼──────────┤                            │
│ │ FM-045 │ 10/03/26 │ Q 230  │ DELIVERED│                            │
│ │ FM-032 │ 25/02/26 │ Q 85   │ DELIVERED│                            │
│ └────────┴──────────┴────────┴──────────┘                            │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 — Configuración General (`/admin/configuracion`)

**⚠️ REQUIERE CREAR API NUEVA**

#### Backend — Crear SettingsModule

**Archivos a crear en `apps/api/src/settings/`:**
```
settings/
├── settings.module.ts
├── settings.controller.ts
├── settings.service.ts
└── dto/
    └── update-settings.dto.ts
```

**Endpoints a crear:**

```typescript
// GET /settings — Obtener todas las configuraciones
// Permiso: @RequirePermission('settings', 'read')
// Respuesta: Record<string, any> (clave-valor)

// GET /settings/public — Configuraciones públicas (nombre, logo, etc.)
// Permiso: @Public()
// Solo devolver settings marcados como públicos

// PATCH /settings — Actualizar configuraciones
// Permiso: @RequirePermission('settings', 'manage_settings')
// Body: { key: value, key2: value2, ... }
// Upsert cada key en la tabla Setting
```

**Settings que deben existir (seed o crear al arrancar):**

```
GRUPO "general":
- store_name: "Farma Madyson"
- store_slogan: "Donde Comienza el Bienestar"
- store_phone: ""
- store_email: "farmamadyson@gmail.com"
- store_address: "4 Av 2-70 Zona 2, Chimaltenango"
- store_nit: ""

GRUPO "payment":
- bank_name: ""
- bank_account_name: "FARMA MADYSON, S.A."
- bank_account_number: ""
- bank_account_type: "Monetaria"
- cod_enabled: true (contra entrega)
- transfer_enabled: true

GRUPO "shipping":
- shipping_flat_rate: 25.00
- free_shipping_threshold: 200.00
- shipping_areas: "Chimaltenango y alrededores"

GRUPO "tax":
- tax_rate: 0.12
- tax_name: "IVA"
- currency: "GTQ"
- currency_symbol: "Q"
```

#### Frontend — 1 página con tabs

```
┌───────────────────────────────────────────────────────────────────────┐
│ H1: Configuración General                                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ TABS: [General] [Pagos] [Envíos] [Impuestos]                        │
│                                                                       │
│ TAB GENERAL:                                                          │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Nombre de la farmacia    [Farma Madyson_______________]         │  │
│ │ Slogan                   [Donde Comienza el Bienestar_]         │  │
│ │ Teléfono                 [________________________]             │  │
│ │ Email                    [farmamadyson@gmail.com___]            │  │
│ │ Dirección                [4 Av 2-70 Zona 2, Chimalt]           │  │
│ │ NIT                      [________________________]             │  │
│ │                                                                 │  │
│ │                                       [Guardar cambios]        │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ TAB PAGOS:                                                            │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ TRANSFERENCIA BANCARIA                                          │  │
│ │ □ Habilitado                                                    │  │
│ │ Banco                    [________________________]             │  │
│ │ Nombre de cuenta         [FARMA MADYSON, S.A._____]            │  │
│ │ Número de cuenta         [________________________]             │  │
│ │ Tipo de cuenta           [▼ Monetaria]                         │  │
│ │                                                                 │  │
│ │ CONTRA ENTREGA                                                  │  │
│ │ □ Habilitado                                                    │  │
│ │                                                                 │  │
│ │                                       [Guardar cambios]        │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ TAB ENVÍOS:                                                           │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Tarifa fija de envío     [Q 25.00___]                          │  │
│ │ Envío gratis a partir de [Q 200.00__]                          │  │
│ │ Áreas de cobertura       [Chimaltenango y alrededore]          │  │
│ │                                       [Guardar cambios]        │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ TAB IMPUESTOS:                                                        │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Tasa de IVA              [12___] %                             │  │
│ │ Nombre del impuesto      [IVA____]                             │  │
│ │ Moneda                   [▼ GTQ - Quetzal]                     │  │
│ │ Símbolo                  [Q_]                                  │  │
│ │                                       [Guardar cambios]        │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 — Banners (`/admin/banners`)

**⚠️ REQUIERE CREAR API NUEVA**

#### Backend — Crear BannersModule

**Archivos a crear en `apps/api/src/banners/`:**
```
banners/
├── banners.module.ts
├── banners.controller.ts
├── banners.service.ts
└── dto/
    ├── create-banner.dto.ts
    └── update-banner.dto.ts
```

**Endpoints:**

```typescript
// GET /banners — Lista todos (admin)
// Permiso: @RequirePermission('banner', 'read')

// GET /banners/public — Banners activos y dentro de fecha (tienda)
// Permiso: @Public()
// Filtrar: isActive = true, startDate <= now, endDate >= now (o null)

// POST /banners — Crear banner
// Permiso: @RequirePermission('banner', 'create')
// Body: { title, subtitle?, imageUrl, linkUrl?, position, sortOrder, startDate?, endDate?, isActive }

// PATCH /banners/:id — Actualizar
// DELETE /banners/:id — Eliminar
// PATCH /banners/:id/toggle — Toggle activo/inactivo
```

#### Frontend Admin (`/admin/banners`)

```
┌───────────────────────────────────────────────────────────────────────┐
│ H1: Banners                                      [+ Nuevo banner]   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Grid de tarjetas de banners:                                         │
│                                                                       │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐  │
│  │ [Imagen preview]             │  │ [Imagen preview]             │  │
│  │                              │  │                              │  │
│  │ Título: Ofertas de marzo     │  │ Título: Envío gratis         │  │
│  │ Posición: HOME_HERO          │  │ Posición: HOME_SECONDARY     │  │
│  │ Estado: 🟢 Activo            │  │ Estado: 🔴 Inactivo          │  │
│  │ Vigencia: 01/03 - 31/03     │  │                              │  │
│  │                              │  │                              │  │
│  │ [Editar] [Toggle] [🗑️]      │  │ [Editar] [Toggle] [🗑️]      │  │
│  └──────────────────────────────┘  └──────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

#### Frontend Tienda — Conectar banners al homepage

Modificar el componente hero del homepage para consumir GET `/banners/public?position=HOME_HERO` en lugar de tener datos hardcodeados. Si el homepage ya tiene un hero carousel o similar, solo cambiar la fuente de datos para que venga del API.

**✅ VALIDACIÓN FASE 2:**
- [ ] `/admin/clientes` muestra usuarios con búsqueda y filtros
- [ ] `/admin/clientes/:id` muestra detalle con pedidos y permite cambiar rol
- [ ] `/admin/configuracion` permite editar datos de la farmacia, pagos, envío, impuestos
- [ ] `/admin/banners` permite gestionar banners del homepage
- [ ] El homepage consume banners desde el API (no hardcodeados)
- [ ] Los nuevos endpoints tienen permisos CASL correctos
- [ ] NINGUNA funcionalidad existente se rompió

---

## 🏗️ FASE 3 — MEJORAS Y PULIDO

> **Objetivo:** Completar features secundarios que mejoran la experiencia.

---

### 3.1 — Visor de Audit Log (`/admin/configuracion/audit-log`)

**No requiere API nueva** — El interceptor de audit log ya existe y registra acciones en la tabla `AuditLog`. Solo falta una página para visualizarlos.

**Crear endpoint simple:**

```typescript
// GET /audit-logs — Lista paginada
// Permiso: @RequirePermission('settings', 'manage_settings')
// Query: page, limit, userId?, resource?, action?, dateFrom?, dateTo?
// Incluir: user (nombre y email)
```

**Página frontend:**

```
┌───────────────────────────────────────────────────────────────────────┐
│ H1: Registro de Auditoría                                            │
├───────────────────────────────────────────────────────────────────────┤
│ Filtros: [▼ Usuario] [▼ Recurso] [▼ Acción] [📅 Desde] [📅 Hasta] │
├───────────────────────────────────────────────────────────────────────┤
│  TABLA:                                                               │
│  ┌──────────┬──────────┬───────────┬───────────────┬────────────────┐ │
│  │ Fecha    │ Usuario  │ Acción    │ Recurso       │ Detalles       │ │
│  ├──────────┼──────────┼───────────┼───────────────┼────────────────┤ │
│  │ 10/03 14h│ Admin    │ update    │ product #abc  │ [Ver cambios]  │ │
│  │ 10/03 13h│ Admin    │ create    │ order #FM-045 │ [Ver cambios]  │ │
│  └──────────┴──────────┴───────────┴───────────────┴────────────────┘ │
│                                                                       │
│  [Ver cambios] abre modal con JSON diff (oldData vs newData)         │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 — Servicio de Email + Reactivar 2FA

**Trabajo en backend (`apps/api/src/email/`):**

```
email/
├── email.module.ts
├── email.service.ts       ← Servicio genérico de envío
└── templates/
    ├── two-factor-code.ts ← HTML del email de código 2FA
    ├── verify-email.ts
    ├── reset-password.ts
    ├── order-confirmation.ts
    └── order-status-change.ts
```

**EmailService debe:**
1. Usar nodemailer con transporte SMTP de SendGrid.
2. Tener método genérico `sendEmail({ to, subject, html })`.
3. Tener métodos específicos:
   - `sendTwoFactorCode(email, code)` — Envía código 6 dígitos
   - `sendVerificationEmail(email, token)` — Envía link de verificación
   - `sendPasswordReset(email, token)` — Envía link de reset
   - `sendOrderConfirmation(email, order)` — Confirmación de pedido

**Reactivar 2FA:**
1. Descomentar las líneas de 2FA en `auth.service.ts`.
2. Inyectar `EmailService` en `AuthService`.
3. En el flujo de login admin, cuando `user.twoFactorEnabled === true`:
   - Generar código 6 dígitos
   - Hashear y guardar en TwoFactorCode
   - Llamar `emailService.sendTwoFactorCode(user.email, code)`
   - Responder `{ requiresTwoFactor: true, tempToken }`

**Variables de entorno requeridas:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx  # SendGrid API Key
SMTP_FROM=noreply@farmamadyson.com
SMTP_FROM_NAME=Farma Madyson
```

**Reactivar verificación de email y recuperación de contraseña:**
- Los endpoints ya existen como stubs en auth.controller.ts
- Solo falta implementar la lógica en auth.service.ts que use EmailService
- Para verificación: generar token UUID, guardarlo, enviar link, al confirmar marcar emailVerifiedAt
- Para reset: generar token, guardarlo con expiración 1h, enviar link, al confirmar hashear nueva password

---

### 3.3 — Reviews / Reseñas (`/admin/reseñas`)

**Backend — Crear ReviewsModule:**

```typescript
// GET /reviews — Lista de reseñas (admin)
// Permiso: review:read
// Query: page, limit, productId?, isApproved?, rating?

// PATCH /reviews/:id/approve — Aprobar reseña
// PATCH /reviews/:id/reject — Rechazar (soft delete)
// DELETE /reviews/:id — Eliminar

// POST /reviews — Crear reseña (cliente)
// Permiso: autenticado
// Body: { productId, rating, title?, comment? }
// Validar: el usuario debe haber comprado el producto
```

**Frontend admin:** Tabla de reseñas pendientes con botones aprobar/rechazar.

---

### 3.4 — Google OAuth

**Backend — Agregar GoogleStrategy:**

Crear `apps/api/src/auth/strategies/google.strategy.ts`:
- Usar `passport-google-oauth20`
- Al callback, buscar usuario por `googleId` o `email`
- Si no existe, crear usuario nuevo con rol `customer` e `isVerified: true`
- Si existe, vincular `googleId` si no lo tenía
- Generar tokens JWT normales

**Frontend:**
- Agregar botón "Continuar con Google" en la página de login de clientes
- El botón redirige a GET `/api/auth/google`
- El callback redirige de vuelta al frontend con tokens

---

**✅ VALIDACIÓN FASE 3:**
- [ ] Audit log se visualiza con filtros y detalle de cambios
- [ ] 2FA funciona: login admin → código al email → verificar → acceso
- [ ] Email de verificación de cuenta se envía al registrarse
- [ ] Recuperación de contraseña envía email con link
- [ ] Reseñas se pueden moderar desde el admin
- [ ] Google OAuth funciona para login de clientes

---

## 📋 CHECKLIST FINAL — SISTEMA 100% COMPLETO

Cuando TODAS las fases estén terminadas, verificar:

**Admin (14/14 módulos):**
- [ ] Dashboard con KPIs en vivo
- [ ] CRUD de productos con variantes e info farmacéutica
- [ ] CRUD de categorías con árbol jerárquico
- [ ] Gestión de pedidos con flujo de estados
- [ ] Gestión completa de inventario (stock, lotes, movimientos, alertas)
- [ ] CRUD de proveedores
- [ ] Órdenes de compra con recepción de mercadería
- [ ] Gestión de clientes con detalle y asignación de roles
- [ ] Gestión de recetas médicas
- [ ] Promociones y cupones
- [ ] Reportes con exportación a Excel
- [ ] Roles y permisos dinámicos con CASL
- [ ] Páginas CMS
- [ ] Configuración general (farmacia, pagos, envío, impuestos)
- [ ] Banners del homepage
- [ ] Visor de audit log

**Auth:**
- [ ] Login email/password funcional
- [ ] 2FA por email para admins
- [ ] Google OAuth para clientes
- [ ] Verificación de email
- [ ] Recuperación de contraseña
- [ ] Refresh tokens automático

**Tienda:**
- [ ] Homepage con banners dinámicos
- [ ] Catálogo con filtros y búsqueda
- [ ] Detalle de producto con info farmacéutica
- [ ] Carrito (precios server-side)
- [ ] Checkout con transferencia y contra entrega
- [ ] Subida de recetas
- [ ] Cuenta del cliente completa

---

> **NOTA FINAL:** Completar Fase 1 primero es CRÍTICO porque sin inventario
> y proveedores la farmacia no puede operar. Las Fases 2 y 3 son importantes
> pero la farmacia puede funcionar sin ellas temporalmente.
