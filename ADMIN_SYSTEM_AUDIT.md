# 🏥 FARMA MADYSON — Auditoría Completa del Sistema Administrativo

> **Fecha de auditoría:** 12 de marzo de 2026  
> **Propósito:** Documentar el estado actual del sistema admin (backend + frontend), identificar qué está terminado, qué falta, y hacia dónde dirigir el desarrollo.

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| Endpoints API (total) | **78** |
| Endpoints públicos | 16 |
| Endpoints protegidos (JWT) | 62 |
| Con permisos CASL | 54 |
| Páginas admin frontend | **18** |
| Módulos 100% conectados (API ↔ Frontend) | **8 de 14** |
| Módulos SIN frontend | **6** |
| Modelos Prisma (base de datos) | **37** |
| Modelos SIN endpoint API | **8** |

### Estado general por colores:

- 🟢 **COMPLETO** — Backend + Frontend conectados y funcionales
- 🟡 **PARCIAL** — Backend existe pero falta frontend (o viceversa)
- 🔴 **PENDIENTE** — No existe en ningún lado o es solo un stub

---

## 🟢 MÓDULOS COMPLETOS (Backend + Frontend Conectados)

### 1. Dashboard Principal (`/admin`)

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | `GET /dashboard`, `/dashboard/kpis`, `/dashboard/sales-chart`, `/dashboard/top-products`, `/dashboard/orders-by-status` |
| **Frontend** | ✅ | 4 KPI cards, gráfica de ventas 7 días, donut de estados de pedidos, top 10 productos, últimos pedidos, alertas recientes |
| **Conexión** | ✅ | Auto-refresh cada 60 segundos |

**Funcionalidades:**
- Ventas del día (monto + cantidad de pedidos)
- Pedidos pendientes (requieren atención)
- Productos con stock bajo
- Productos por vencer (30 días)
- Gráfica de barras: ventas últimos 7 días
- Donut chart: pedidos por estado (PENDING, CONFIRMED, PREPARING, SHIPPED, DELIVERED, CANCELLED, etc.)
- Top 10 productos más vendidos
- Tabla de últimos pedidos
- Lista de alertas recientes (LOW_STOCK, OUT_OF_STOCK, NEAR_EXPIRY)

---

### 2. Productos (`/admin/productos`)

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | CRUD completo: `GET /products/admin/list`, `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` |
| **Frontend** | ✅ | 3 páginas: Lista, Crear, Editar |
| **Conexión** | ✅ | Completa |

**Páginas frontend:**

| Ruta | Funcionalidad | API Consumida |
|------|--------------|---------------|
| `/admin/productos` | Lista con búsqueda, filtro activo/inactivo, toggle estado | `GET /products/admin/list`, `PATCH /products/:id` |
| `/admin/productos/nuevo` | Formulario completo: nombre, slug, descripción, precio, categoría, marca, imágenes, variantes, info farmacéutica | `POST /products`, `GET /categories`, `GET /brands` |
| `/admin/productos/:id` | Editor con 4 tabs: General, Variantes, Info Farmacéutica, Inventario | `PATCH /products/:id`, `PATCH /:id/pharma-info`, `PATCH /:id/variants/:vid` |

**Endpoints API de productos:**

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/products` | @Public | Listado público (sin costos) |
| GET | `/products/search` | @Public | Búsqueda full-text |
| GET | `/products/slug/:slug` | @Public | Detalle por slug |
| GET | `/products/admin/list` | product:read | Lista admin con costos/márgenes |
| GET | `/products/:id` | product:read | Detalle completo admin |
| POST | `/products` | product:create | Crear producto con variantes |
| PATCH | `/products/:id` | product:update | Actualizar producto |
| DELETE | `/products/:id` | product:delete | Soft delete |
| POST | `/products/:id/variants` | product:create | Agregar variante |
| PATCH | `/products/:id/variants/:vid` | product:update | Editar variante |
| PATCH | `/products/:id/pharma-info` | product:update | Info farmacéutica |

---

### 3. Pedidos (`/admin/pedidos`)

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, `POST /orders/:id/verify-payment` |
| **Frontend** | ✅ | 2 páginas: Lista, Detalle |
| **Conexión** | ✅ | Completa |

**Páginas frontend:**

| Ruta | Funcionalidad |
|------|--------------|
| `/admin/pedidos` | Lista paginada con filtros por estado, búsqueda por número/cliente |
| `/admin/pedidos/:id` | Detalle completo: datos cliente, dirección, items, totales, historial de estados, botones para cambiar estado y verificar pago |

**Flujo de estados del pedido:**
```
PENDING → PENDING_PAYMENT → CONFIRMED → PREPARING → SHIPPED → DELIVERED
                ↓                                         ↓
          CANCELLED                                  REFUNDED
          
PENDING_PRESCRIPTION → (aprobación receta) → CONFIRMED
```

---

### 4. Promociones y Cupones (`/admin/promociones`)

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | CRUD completo de promociones + CRUD de cupones + validación pública |
| **Frontend** | ✅ | 3 páginas: Lista, Crear, Detalle/Cupones |
| **Conexión** | ✅ | Completa |

**Páginas frontend:**

| Ruta | Funcionalidad |
|------|--------------|
| `/admin/promociones` | Lista con filtro activo/inactivo, eliminar |
| `/admin/promociones/nueva` | Crear: tipo (PERCENTAGE/FIXED_AMOUNT/FREE_SHIPPING), valor, fechas, ubicaciones |
| `/admin/promociones/:id` | Ver detalle + gestión de cupones (crear, toggle, eliminar) |

**Endpoints API:**

| Método | Ruta | Permiso |
|--------|------|---------|
| GET | `/promotions` | promotion:read |
| GET | `/promotions/:id` | promotion:read |
| POST | `/promotions` | promotion:create |
| PATCH | `/promotions/:id` | promotion:update |
| DELETE | `/promotions/:id` | promotion:delete |
| GET | `/promotions/:id/coupons` | promotion:read |
| POST | `/coupons` | promotion:create |
| PATCH | `/coupons/:id/toggle` | promotion:update |
| DELETE | `/coupons/:id` | promotion:delete |
| POST | `/coupons/validate` | @Public |

---

### 5. Recetas / Prescripciones (`/admin/recetas`)

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | `GET /prescriptions`, `GET /:id`, `PATCH /:id/approve`, `PATCH /:id/reject` |
| **Frontend** | ✅ | 1 página con grid de tarjetas y modal de acciones |
| **Conexión** | ✅ | Completa |

**Funcionalidades:**
- Grid de prescripciones agrupadas por estado (PENDING, APPROVED, REJECTED)
- Modal para ver imagen de receta
- Botón aprobar → confirma el pedido asociado
- Botón rechazar → pide razón de rechazo
- Registro del farmacéutico que revisó

---

### 6. Reportes (`/admin/reportes`)

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | 4 endpoints: ventas, inventario, financiero, por vencer |
| **Frontend** | ✅ | 5 páginas: Hub + 4 reportes detallados |
| **Conexión** | ✅ | Completa |

**Páginas frontend:**

| Ruta | API | Funcionalidades |
|------|-----|-----------------|
| `/admin/reportes` | — | Portal de navegación con 4 tarjetas |
| `/admin/reportes/ventas` | `GET /reports/sales` | KPIs + tabla por categoría + top 20 productos + **exportar Excel** |
| `/admin/reportes/financiero` | `GET /reports/financial` | Ingresos vs costos, margen de ganancia por producto + **exportar Excel** |
| `/admin/reportes/inventario` | `GET /reports/inventory` | Valorización de stock, productos bajo stock/sin stock |
| `/admin/reportes/por-vencer` | `GET /reports/expiring` | 3 niveles de urgencia (30/60/90 días) + **exportar Excel** |

---

### 7. Roles y Permisos (`/admin/configuracion/roles`)

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | CRUD completo: `GET /roles`, `POST /roles`, `PATCH /roles/:id`, `DELETE /roles/:id`, `GET /roles/permissions` |
| **Frontend** | ✅ | 3 páginas: Lista, Crear, Editar |
| **Conexión** | ✅ | Completa |

**Roles del sistema (seed):**
| Rol | Nombre visible | Tipo |
|-----|---------------|------|
| super_admin | Super Administrador | Sistema (no editable) |
| admin | Administrador | Sistema |
| pharmacist | Farmacéutico | Sistema |
| warehouse | Almacén | Sistema |
| sales | Ventas | Sistema |
| customer | Cliente | Sistema |

**57 permisos organizados por recurso:**
- product: read, create, update, delete
- category: read, create, update, delete
- brand: read, create, update
- order: read, update_status, verify_payment, cancel
- inventory: read, create, update
- supplier: read, create, update
- purchase_order: read, create, update, delete
- prescription: view_all, update
- promotion: read, create, update, delete
- report: view_sales, view_inventory, view_financial
- settings: manage_roles, manage_pages, manage_settings
- y más...

---

### 8. Páginas CMS (`/admin/configuracion/paginas`)

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | CRUD: `GET /pages`, `POST /pages`, `PATCH /pages/:id`, `DELETE /pages/:id` |
| **Frontend** | ✅ | 3 páginas: Lista, Crear, Editar |
| **Conexión** | ✅ | Completa |

**Funcionalidades:**
- Crear páginas con título, slug, contenido HTML, meta SEO
- Estado: published/draft
- Las páginas se renderizan en `/pagina/:slug` en la tienda

---

## 🟡 MÓDULOS PARCIALES (Backend existe, Frontend FALTA)

### 9. Categorías (`/admin/categorias`) — ⚠️ SIN PÁGINA ADMIN

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | CRUD completo con soporte de árbol jerárquico |
| **Frontend** | ❌ | **NO EXISTE** — enlace en sidebar navega a `/admin/categorias` pero la página no existe |
| **Impacto** | 🔴 Alto | No se pueden crear/editar/reordenar categorías desde el admin |

**Endpoints API disponibles (listos para conectar):**

| Método | Ruta | Permiso | Funcionalidad |
|--------|------|---------|---------------|
| GET | `/categories` | @Public | Árbol completo de categorías |
| GET | `/categories/:slug` | @Public | Categoría por slug con productos |
| POST | `/categories` | category:create | Crear categoría (nombre, slug, icon, parentId, sortOrder) |
| PATCH | `/categories/reorder` | category:update | Reordenar categorías |
| PATCH | `/categories/:id` | category:update | Actualizar categoría |
| DELETE | `/categories/:id` | category:delete | Eliminar categoría |

**Modelo de datos (Prisma):**
```
Category: id, name, slug, description, icon, imageUrl, parentId, sortOrder, isActive
  → parent (self-relation)
  → children (self-relation)
  → products
```

**Lo que necesita el frontend:**
- [ ] Vista de árbol jerárquico (categorías padre → hijos)
- [ ] Drag & drop para reordenar (usa `PATCH /categories/reorder`)
- [ ] Modal o formulario para crear/editar categoría
- [ ] Selector de categoría padre
- [ ] Toggle activo/inactivo
- [ ] Eliminar con confirmación

---

### 10. Inventario (`/admin/inventario`) — ⚠️ SIN PÁGINAS ADMIN

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | 8 endpoints completos: dashboard, stock por variante, movimientos, recibir, ajustar, expirando, alertas |
| **Frontend** | ❌ | **NO EXISTEN** — 4 enlaces en sidebar (`/admin/inventario`, `/inventario/movimientos`, `/inventario/alertas`, `/inventario/por-vencer`) sin páginas |
| **Impacto** | 🔴 Crítico | No se puede gestionar inventario, recibir mercadería, ni ajustar stock desde el admin |

**Endpoints API disponibles (listos para conectar):**

| Método | Ruta | Permiso | Funcionalidad |
|--------|------|---------|---------------|
| GET | `/inventory/dashboard` | inventory:read | Resumen: total productos, con stock, bajo stock, sin stock, valor total |
| GET | `/inventory/variants/:id/stock` | inventory:read | Detalle de stock por lote (batch) para una variante |
| GET | `/inventory/movements` | inventory:read | Historial de movimientos (paginado, filtro por tipo/variante) |
| POST | `/inventory/receive` | inventory:create | Recibir inventario: crea lote con número, costo, cantidad, fecha vencimiento |
| POST | `/inventory/adjust` | inventory:update | Ajuste manual: +/- cantidad con razón |
| GET | `/inventory/expiring` | inventory:read | Productos por vencer en N días |
| GET | `/inventory/alerts` | inventory:read | Alertas activas de stock |
| PATCH | `/inventory/alerts/:id/resolve` | inventory:update | Resolver alerta |

**4 páginas que necesita el frontend:**

1. **`/admin/inventario`** — Stock Actual
   - [ ] Dashboard con KPIs (total productos, con stock, bajo stock, sin stock, valor total)
   - [ ] Tabla de productos/variantes con stock actual, costo, estado
   - [ ] Click en variante → detalle de lotes (batch) con fechas vencimiento
   - [ ] Botón "Recibir inventario" → formulario (variante, cantidad, lote, costo, fecha vencimiento)
   - [ ] Botón "Ajuste manual" → formulario (variante, cantidad +/-, razón)

2. **`/admin/inventario/movimientos`** — Movimientos
   - [ ] Tabla con filtros: tipo (PURCHASE, SALE, ADJUSTMENT, RETURN, LOSS), variante, fecha
   - [ ] Paginación
   - [ ] Cada movimiento muestra: tipo, variante, cantidad, referencia, usuario, fecha

3. **`/admin/inventario/alertas`** — Alertas
   - [ ] Lista de alertas activas (LOW_STOCK, OUT_OF_STOCK, NEAR_EXPIRY, EXPIRED)
   - [ ] Botón resolver alerta
   - [ ] Filtro por tipo de alerta

4. **`/admin/inventario/por-vencer`** — Por Vencer
   - [ ] Tabla de lotes próximos a vencer (30/60/90 días)
   - [ ] Indicador visual de urgencia (rojo/naranja/amarillo)
   - [ ] Nota: existe un reporte similar en `/admin/reportes/por-vencer`, podrían compartir componente

**Modelo de datos:**
```
ProductBatch: id, variantId, batchNumber, quantity, reservedQuantity, costPrice, expirationDate, receivedAt, purchaseOrderId
InventoryMovement: id, variantId, batchId, type, quantity, previousStock, newStock, reason, reference, userId
StockAlert: id, variantId, type, message, isResolved, resolvedAt, resolvedById
```

---

### 11. Proveedores (`/admin/proveedores`) — ⚠️ SIN PÁGINA ADMIN

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | CRUD: `GET /suppliers`, `POST /suppliers`, `PATCH /suppliers/:id`, `GET /suppliers/:id/history` |
| **Frontend** | ❌ | **NO EXISTE** |
| **Impacto** | 🟡 Medio-Alto | No se pueden gestionar proveedores desde el admin |

**Endpoints API disponibles:**

| Método | Ruta | Permiso | Funcionalidad |
|--------|------|---------|---------------|
| GET | `/suppliers` | supplier:read | Lista de proveedores |
| POST | `/suppliers` | supplier:create | Crear proveedor |
| PATCH | `/suppliers/:id` | supplier:update | Actualizar proveedor |
| GET | `/suppliers/:id/history` | supplier:read | Historial de órdenes de compra del proveedor |

**Lo que necesita el frontend (1 página):**
- [ ] Tabla de proveedores: nombre, contacto, email, teléfono, estado
- [ ] Modal crear/editar proveedor
- [ ] Vista de historial de compras por proveedor

**Modelo de datos:**
```
Supplier: id, name, contactName, email, phone, address, rfc, notes, isActive, rating
  → purchaseOrders
```

---

### 12. Órdenes de Compra (`/admin/compras`) — ⚠️ SIN PÁGINA ADMIN

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ✅ | CRUD completo con flujo DRAFT → SENT → RECEIVED |
| **Frontend** | ❌ | **NO EXISTE** |
| **Impacto** | 🟡 Medio-Alto | No se pueden crear órdenes de compra a proveedores |

**Endpoints API disponibles:**

| Método | Ruta | Permiso | Funcionalidad |
|--------|------|---------|---------------|
| GET | `/purchase-orders` | purchase_order:read | Lista paginada |
| POST | `/purchase-orders` | purchase_order:create | Crear OC en estado DRAFT |
| POST | `/purchase-orders/:id/send` | purchase_order:update | Marcar como enviada al proveedor |
| POST | `/purchase-orders/:id/receive` | purchase_order:update | Recibir OC → crea lotes de inventario automáticamente |
| DELETE | `/purchase-orders/:id` | purchase_order:delete | Cancelar (solo DRAFT) |

**Lo que necesita el frontend (2 páginas):**

1. **`/admin/compras`** — Lista
   - [ ] Tabla: número OC, proveedor, estado, total, fecha
   - [ ] Filtro por estado (DRAFT, SENT, PARTIALLY_RECEIVED, RECEIVED, CANCELLED)
   - [ ] Botón crear nueva OC

2. **`/admin/compras/nueva`** — Crear/Ver OC
   - [ ] Seleccionar proveedor
   - [ ] Agregar items (variante, cantidad, costo unitario)
   - [ ] Calcular total
   - [ ] Acciones: Guardar borrador, Enviar a proveedor, Recibir mercadería

**Modelo de datos:**
```
PurchaseOrder: id, orderNumber, supplierId, status, subtotal, tax, total, notes, expectedDate, sentAt, receivedAt
PurchaseOrderItem: id, purchaseOrderId, variantId, quantity, receivedQuantity, unitCost
```

**Flujo de estados:**
```
DRAFT → SENT → PARTIALLY_RECEIVED → RECEIVED
  ↓                                    
CANCELLED                             
```

Al recibir una OC, el sistema automáticamente:
- Crea `ProductBatch` por cada item recibido
- Registra `InventoryMovement` tipo PURCHASE
- Actualiza estado de la OC

---

### 13. Clientes / Usuarios (`/admin/clientes`) — ⚠️ SIN PÁGINA ADMIN

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ⚠️ Parcial | Solo `GET /auth/me` para perfil propio. **No hay endpoint para listar/gestionar usuarios** |
| **Frontend** | ❌ | **NO EXISTE** |
| **Impacto** | 🟡 Medio | No se pueden ver clientes, desactivar cuentas, ni asignar roles |

**Lo que falta en API:**
- [ ] `GET /users` — Listar usuarios (paginado, filtro por rol, búsqueda)
- [ ] `GET /users/:id` — Detalle de usuario
- [ ] `PATCH /users/:id` — Editar usuario (activar/desactivar, cambiar roles)
- [ ] `GET /users/:id/orders` — Pedidos del usuario

**Lo que necesita el frontend (2 páginas):**

1. **`/admin/clientes`** — Lista
   - [ ] Tabla: nombre, email, teléfono, rol, estado, último login, total pedidos
   - [ ] Búsqueda y filtros
   - [ ] Toggle activar/desactivar

2. **`/admin/clientes/:id`** — Detalle
   - [ ] Información del cliente
   - [ ] Historial de pedidos
   - [ ] Asignar/cambiar rol
   - [ ] Desactivar cuenta

---

### 14. Configuración General (`/admin/configuracion`) — ⚠️ SIN PÁGINA ADMIN

| Capa | Estado | Detalles |
|------|--------|----------|
| **API** | ❌ | **No existe endpoint `/settings`** — El modelo `Setting` existe en Prisma pero no tiene controller/service |
| **Frontend** | ❌ | **NO EXISTE** — El sidebar enlaza a `/admin/configuracion` pero no hay página |
| **Impacto** | 🟡 Bajo | Las configuraciones se manejan directamente en la base de datos |

**Modelo Prisma existente:**
```
Setting: id, key, value, type, description
```

**Lo que falta:**
- [ ] **API**: Crear `settings.controller.ts` + `settings.service.ts` con CRUD
- [ ] **Frontend**: Página para gestionar configuraciones (nombre farmacia, dirección, teléfono, horarios, info de banco, etc.)

---

## 🔴 MODELOS SIN ENDPOINT NI FRONTEND

Estos modelos existen en la base de datos pero no tienen API ni UI:

| Modelo Prisma | Propósito | Prioridad |
|---------------|-----------|-----------|
| **Banner** | Banners/sliders para la tienda | 🟡 Media |
| **Review** | Reseñas de productos por clientes | 🟡 Media |
| **WishlistItem** | Lista de favoritos del cliente | 🟢 Baja (funciona en frontend con localStorage) |
| **Cart / CartItem** | Carrito persistente en BD | 🟢 Baja (funciona con localStorage) |
| **Address** | Direcciones del cliente | 🟢 Baja (se usa en checkout) |
| **AuditLog** | Registro de auditoría | 🟡 Media (interceptor existe pero no hay visor) |
| **NotificationTemplate** | Plantillas de emails/notificaciones | 🟡 Media |
| **Payment** | Registros de pago | 🟢 Baja (se gestiona dentro de Order) |

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Estado actual:

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Login con email/password | ✅ | Funcional |
| Registro de clientes | ✅ | Funcional |
| JWT (access + refresh) | ✅ | Access: 15min, Refresh: 7 días |
| Auto-refresh en 401 | ✅ | Interceptor Axios con cola |
| CASL Abilities (permisos) | ✅ | Cache en Redis 5 min |
| Super admin bypass | ✅ | `manage:all` |
| 2FA por email | ⚠️ | **DESHABILITADO** — código comentado, falta servicio de email |
| Verificación de email | ❌ | Stub (endpoint existe, lógica no implementada) |
| Recuperar contraseña | ❌ | Stub (endpoint existe, falta envío de email) |
| Google OAuth | ❌ | Campo `googleId` existe pero no hay strategy |
| Separación admin/cliente | ✅ | Middleware + cookie `session_type` |

### Credenciales actuales:
- **Super Admin:** admin@farmamadyson.com / FarmaMadyson2026!

---

## 🛒 SISTEMA DE TIENDA (FRONTEND PÚBLICO)

### Páginas de la tienda:

| Ruta | Estado | Funcionalidad |
|------|--------|---------------|
| `/` | ✅ | Homepage: hero, categorías carousel, ofertas, marcas |
| `/productos` | ✅ | Catálogo con filtros y paginación |
| `/productos/:slug` | ✅ | Detalle de producto con variantes |
| `/categorias/:slug` | ✅ | Productos por categoría |
| `/buscar` | ✅ | Búsqueda full-text |
| `/ofertas` | ✅ | Productos en oferta |
| `/carrito` | ✅ | Vista del carrito |
| `/checkout` | ✅ | Proceso de compra (4 pasos) |
| `/subir-receta` | ✅ | Upload de receta médica |
| `/pagina/:slug` | ✅ | Páginas CMS dinámicas |

### Cuenta del cliente (`/mi-cuenta`):

| Ruta | Estado | Funcionalidad |
|------|--------|---------------|
| `/mi-cuenta` | ✅ | Resumen |
| `/mi-cuenta/pedidos` | ✅ | Historial de pedidos |
| `/mi-cuenta/pedidos/:id` | ✅ | Detalle de pedido |
| `/mi-cuenta/favoritos` | ✅ | Lista de deseos |
| `/mi-cuenta/direcciones` | ✅ | Gestión de direcciones |
| `/mi-cuenta/perfil` | ✅ | Editar perfil |

---

## 📋 CRON JOBS / TAREAS AUTOMÁTICAS

| Tarea | Frecuencia | Estado | Funcionalidad |
|-------|-----------|--------|---------------|
| Verificar stock bajo | Cada hora | ✅ | Crea alertas para variantes bajo umbral |
| Pedidos pendientes | Cada 6 horas | ✅ | Alerta si hay pedidos pendientes >24h |
| Lotes por vencer | Diario 6 AM | ✅ | Alerta lotes que vencen en 30/60/90 días |

---

## 🗺️ MAPA DE PRIORIDADES DE DESARROLLO

### 🔴 Prioridad ALTA (Impacto directo en operación diaria)

| # | Módulo | Esfuerzo estimado | Justificación |
|---|--------|-------------------|---------------|
| 1 | **Inventario** (4 páginas) | Grande | Sin esto no se puede gestionar stock, recibir mercadería, ni ver alertas desde el admin |
| 2 | **Proveedores** (1 página) | Pequeño | Prerequisito para órdenes de compra |
| 3 | **Órdenes de Compra** (2 páginas) | Mediano | Flujo completo de abastecimiento. Al recibir OC se alimenta el inventario automáticamente |
| 4 | **Categorías** (1 página) | Pequeño | Sin esto no se pueden organizar productos. El API ya está listo |

### 🟡 Prioridad MEDIA (Gestión y control)

| # | Módulo | Esfuerzo estimado | Justificación |
|---|--------|-------------------|---------------|
| 5 | **Clientes** (2 páginas + API) | Mediano | Requiere crear endpoints nuevos. Permite ver usuarios y sus pedidos |
| 6 | **Configuración General** (1 página + API) | Mediano | Requiere crear controller + service + página |
| 7 | **Banners** (API + 1 página admin + componente tienda) | Mediano | Gestionar sliders/promociones visuales de la homepage |

### 🟢 Prioridad BAJA (Mejoras futuras)

| # | Módulo | Esfuerzo | Justificación |
|---|--------|----------|---------------|
| 8 | **Reviews/Reseñas** (API + páginas) | Mediano | Moderación de reseñas de clientes |
| 9 | **Visor de Audit Log** (1 página) | Pequeño | Ver quién hizo qué cambio |
| 10 | **2FA y emails** | Mediano | Configurar EmailJS/SendGrid + reactivar 2FA |
| 11 | **Notificaciones** | Grande | Emails transaccionales (confirmación pedido, cambio estado, etc.) |
| 12 | **Google OAuth** | Pequeño | Login con Google |

---

## 🔄 ORDEN DE DESARROLLO RECOMENDADO

```
Fase 1 — Operación básica (can operate the pharmacy):
  ├── 1. /admin/categorias ──────── (API ✅, solo frontend)
  ├── 2. /admin/proveedores ─────── (API ✅, solo frontend)
  ├── 3. /admin/compras ─────────── (API ✅, solo frontend)
  └── 4. /admin/inventario ──────── (API ✅, 4 páginas frontend)

Fase 2 — Control y gestión:
  ├── 5. /admin/clientes ────────── (API nuevo + frontend)
  ├── 6. /admin/configuracion ───── (API nuevo + frontend)
  └── 7. Banners ────────────────── (API nuevo + frontend + tienda)

Fase 3 — Mejoras:
  ├── 8. Reviews
  ├── 9. Audit Log viewer
  ├── 10. Email service + 2FA
  └── 11. Notificaciones transaccionales
```

---

## 📐 ARQUITECTURA TÉCNICA

### Stack:
- **Backend:** NestJS + Prisma + PostgreSQL + Redis
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS v4
- **Auth:** JWT (access + refresh) + CASL permissions + Redis cache
- **Monorepo:** pnpm workspaces + Turborepo

### Paquetes compartidos:
```
packages/
├── database/     → Prisma schema, client, seed
├── shared-types/ → DTOs, interfaces, enums compartidos
└── shared-validators/ → Validaciones compartidas
```

### Infraestructura:
- PostgreSQL: puerto 5433 (instancia nativa Windows)
- Redis: puerto 6379 (Docker container)
- API: puerto 4000
- Web: puerto 3000
- PgAdmin: puerto 5050

### Guards globales (app.module.ts):
```typescript
APP_GUARD → JwtAuthGuard    // Valida JWT en toda ruta no @Public()
APP_GUARD → CaslAbilityGuard // Verifica permisos en rutas con @RequirePermission()
```

---

## 📝 NOTAS IMPORTANTES

1. **Base de datos:** La app usa la instancia nativa de PostgreSQL en Windows (puerto 5433), NO el contenedor Docker. El contenedor Docker de postgres está activo pero es redundante.

2. **2FA deshabilitado:** Las líneas de verificación 2FA en `auth.service.ts` están comentadas. Debe reactivarse cuando se configure un servicio de email.

3. **Stock dinámico:** El stock nunca se almacena en `ProductVariant`. Siempre se calcula en tiempo real de la suma de `ProductBatch.quantity - reservedQuantity`. Esto es por diseño (FEFO).

4. **Permisos en cache:** Las abilities se cachean en Redis por 5 minutos. Si se cambian los permisos de un rol, usar `CaslAbilityFactory.invalidateCache(userId)` o esperar 5 minutos.

5. **Soft deletes:** Solo los productos usan soft delete (`deletedAt`). El resto de entidades se eliminan de forma permanente.

6. **Middleware frontend:** Se creó `middleware.ts` con cookie `session_type` para separar sesiones admin/cliente. Los admins no pueden acceder a `/mi-cuenta` ni `/checkout`, y los clientes no pueden acceder a `/admin`.
