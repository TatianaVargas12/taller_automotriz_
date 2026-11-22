# Entregable 4: Implementación de Operaciones CRUD y Ciclo de Vida de Órdenes
## Sistema de Gestión de Talleres Automotrices (Laravel 13 / PHP 8.5 / MySQL 8.4 LTS)

---

### 1. Resumen de Operaciones CRUD por Módulo

Todas las operaciones CRUD implementan separación estricta: validación mediante **Form Requests** dedicados con mensajes en español, ejecución transaccional en **servicios de dominio**, y serialización de salida mediante **API Resources**.

Las eliminaciones de clientes, vehículos y servicios son lógicas (**Soft Deletes**), por lo que los registros eliminados se excluyen automáticamente de los listados y búsquedas de la API por defecto (`WHERE deleted_at IS NULL`).

---

### 2. Módulo 1: Clientes (CRUD y Búsqueda en Tiempo Real)

- **Controlador:** `ClientController`
- **Servicio:** `ClientService`
- **Form Requests:** `StoreClientRequest`, `UpdateClientRequest`
- **Resource:** `ClientResource`

#### Operaciones Implementadas:
1. **Listado Paginado (`GET /api/v1/clients`):**
   - Parámetros query: `search` (búsqueda parcial por nombres, apellidos, documento o teléfono), `status` (filtro por estado activo/inactivo), `page` y `per_page`.
   - Excluye registros con soft delete por defecto.
2. **Creación (`POST /api/v1/clients`):**
   - Valida campos obligatorios (`first_name`, `last_name`, `document_type`, `document_number`, `phone`).
   - Aplica la regla de integridad `UNIQUE(document_type, document_number)`. Si se intenta registrar un documento ya existente para el mismo tipo, responde con **HTTP 422**.
3. **Detalle (`GET /api/v1/clients/{client}`):**
   - Retorna la ficha del cliente cargando la relación con su flota de vehículos (`vehicles`) y el conteo de órdenes asociadas.
   - Si el usuario autenticado tiene rol `client`, valida que el cliente consultado sea el propio; si intenta consultar un cliente ajeno, responde **HTTP 403 Forbidden**.
4. **Actualización (`PUT /api/v1/clients/{client}`):**
   - Modifica información de contacto, dirección y estado.
5. **Eliminación Lógica (`DELETE /api/v1/clients/{client}`):**
   - Ejecuta `softDeletes()`. Exclusivo para el rol `admin` (la recepcionista recibe **HTTP 403**).

---

### 3. Módulo 2: Vehículos (CRUD, Odómetro e Historial)

- **Controlador:** `VehicleController`
- **Servicio:** `VehicleService`
- **Form Requests:** `StoreVehicleRequest`, `UpdateVehicleRequest`
- **Resource:** `VehicleResource`

#### Operaciones Implementadas:
1. **Listado Paginado (`GET /api/v1/vehicles`):**
   - Filtros query: `search` (placa, marca o modelo), `client_id` (filtro por cliente propietario).
2. **Registro de Vehículo (`POST /api/v1/vehicles`):**
   - Valida campos obligatorios: `client_id`, `plate`, `brand`, `model`, `year`, `current_mileage`.
   - Normaliza la placa a mayúsculas (`strtoupper(trim($plate))`).
   - Valida la restricción `UNIQUE(plate)`; duplicados son rechazados con **HTTP 422**.
3. **Detalle (`GET /api/v1/vehicles/{vehicle}`):**
   - Retorna la ficha técnica con los datos del cliente propietario.
4. **Actualización y Regla de Odómetro (`PUT /api/v1/vehicles/{vehicle}`):**
   - **Regla Invariante:** El nuevo kilometraje no puede ser inferior al último registrado en el vehículo (PRD CA-2.1.3).
   - Si un operador normal intenta reducir el odómetro, la API rechaza la solicitud con **HTTP 422**:
     ```json
     {
       "success": false,
       "message": "Los datos proporcionados no son válidos.",
       "errors": {
         "current_mileage": ["El kilometraje no puede ser inferior al último registrado (80000 km)."]
       }
     }
     ```
   - **Excepción de Odómetro:** Solo los usuarios con rol `admin` pueden forzar una disminución enviando `override_mileage = true` y una justificación técnica en `override_reason`. La operación queda registrada en `audit_logs`.
5. **Historial Técnico (`GET /api/v1/vehicles/{vehicle}/history`):**
   - Retorna la colección cronológica de todas las órdenes e intervenciones realizadas sobre el vehículo.
6. **Eliminación Lógica (`DELETE /api/v1/vehicles/{vehicle}`):**
   - Soft Delete exclusivo para `admin`.

---

### 4. Módulo 3: Mecánicos (Personal Técnico Operativo)

- **Controlador:** `MechanicController`
- **Servicio:** `MechanicService`
- **Form Requests:** `StoreMechanicRequest`, `UpdateMechanicRequest`
- **Resource:** `MechanicResource`

#### Operaciones Implementadas:
1. **Listado de Técnicos (`GET /api/v1/mechanics`):**
   - Consulta de mecánicos con filtros por especialidad y estado de actividad.
2. **Alta de Técnico (`POST /api/v1/mechanics`):**
   - Exclusivo de `admin`. Valida documento único laboral `UNIQUE(document_number)`. Recepcionistas reciben **HTTP 403**.
3. **Detalle (`GET /api/v1/mechanics/{mechanic}`):**
   - Retorna perfil técnico, especialidad y estado de asignación.
4. **Actualización (`PUT /api/v1/mechanics/{mechanic}`):**
   - Edición de especialidad, nombre o teléfono.
5. **Alternar Disponibilidad (`PATCH /api/v1/mechanics/{mechanic}/status`):**
   - Permite activar o desactivar la disponibilidad del técnico (`is_active = true|false`).
6. **Eliminación (`DELETE /api/v1/mechanics/{mechanic}`):**
   - Desvinculación técnica exclusiva de `admin`.

---

### 5. Módulo 4: Catálogo de Servicios (Tarifas)

- **Controlador:** `ServiceController`
- **Servicio:** `ServiceCatalogService`
- **Form Requests:** `StoreServiceRequest`, `UpdateServiceRequest`
- **Resource:** `ServiceResource`

#### Operaciones Implementadas:
1. **Consulta de Catálogo (`GET /api/v1/services`):**
   - Retorna servicios activos con tarifas expresadas en `DECIMAL(12,2)`.
2. **Creación de Servicio (`POST /api/v1/services`):**
   - Exclusivo de `admin`. Valida precio base no negativo (`base_price >= 0`, rechaza negativos con **HTTP 422**).
3. **Detalle (`GET /api/v1/services/{service}`):**
   - Ficha descriptiva y categoría técnica del servicio.
4. **Actualización de Tarifa (`PUT /api/v1/services/{service}`):**
   - Actualiza el precio base para nuevas órdenes. Las órdenes existentes no se alteran gracias al snapshot.
5. **Desactivación Lógica (`DELETE /api/v1/services/{service}`):**
   - Soft delete exclusivo de `admin`.

---

### 6. Módulo 5: Órdenes de Servicio & Máquina de Estados

- **Controladores:** `OrderController`, `OrderStatusController`
- **Servicio:** `OrderDomainService`
- **Form Requests:** `StoreOrderRequest`, `UpdateOrderRequest`, `AddOrderServiceRequest`, `AssignOrderMechanicRequest`, `TransitionOrderStatusRequest`, `DeliverOrderRequest`, `CancelOrderRequest`.
- **Resources:** `OrderResource`, `OrderServiceResource`, `OrderStatusHistoryResource`.

#### 6.1. Diagrama de Transición de Estados
```
                  ┌─────────────┐
                  │  PENDIENTE  │
                  └──────┬──────┘
                         │
                         ▼
               ┌───────────────────┐
               │   EN_DIAGNOSTICO  │
               └─────────┬─────────┘
                         │ (Precondición: >= 1 servicio Y >= 1 mecánico activo)
                         ▼
               ┌───────────────────┐        ┌─────────────────────────┐
               │   EN_REPARACION   │ <────> │  EN_ESPERA_APROBACION   │
               └─────────┬─────────┘        └─────────────────────────┘
                         │
                         ▼
               ┌───────────────────┐
               │    FINALIZADA     │
               └─────────┬─────────┘
                         │ (Única vía de entrega permitida: PT-008)
                         ▼
               ┌───────────────────┐
               │     ENTREGADA     │ ───► [ Bloqueo en Solo Lectura Permanente: PT-009 ]
               └───────────────────┘

  [ CANCELADA ] ◄─── (Permitida únicamente ANTES de FINALIZADA, con motivo: PT-010)
```

#### 6.2. Operaciones de Orden Implementadas:
1. **Apertura de Orden (`POST /api/v1/orders`):**
   - Emite folio secuencial único `ORD-YYYY-XXXX` con bloqueo pesimista en base de datos.
   - Estado inicial: `PENDIENTE`.
   - **Regla PT-003:** Valida que el `entry_mileage` sea mayor o igual al último kilometraje del vehículo. Si es menor, responde con **HTTP 422**.
   - Registra el evento inicial en `order_status_history` y `audit_logs`.
2. **Listado Paginado (`GET /api/v1/orders`):**
   - Scoping automático: Los mecánicos solo ven las órdenes donde están asignados; los clientes solo sus propias órdenes; el administrador y la recepcionista tienen visibilidad general.
3. **Carga de Servicios con Snapshot (`POST /api/v1/orders/{order}/services`):**
   - Valida que el servicio esté activo en catálogo (servicios inactivos son rechazados con **HTTP 422**, PT-006).
   - Congela el precio unitario en `order_services.unit_price = service.base_price` (PT-007).
   - Recalcula de forma atómica subtotal, IVA (19%) y total.
   - **Bloqueo:** Si la orden ya está `ENTREGADA`, rechaza con **HTTP 422**.
4. **Asignación de Mecánicos (`POST /api/v1/orders/{order}/mechanics`):**
   - **Regla PT-004:** Rechaza la asignación de mecánicos inactivos con **HTTP 422**.
   - **Regla PT-005:** Rechaza mecánicos duplicados en la misma orden con **HTTP 422**.
5. **Transición de Estado Técnico (`POST /api/v1/orders/{order}/transition`):**
   - Valida la secuencia según la matriz permitida.
   - **Precondición para `EN_REPARACION` (CA-5.2.1):** Si la orden no tiene al menos un servicio registrado y al menos un mecánico activo asignado, rechaza con **HTTP 422**.
   - Toda transición se registra en la bitácora inmutable `order_status_history`.
6. **Entrega Formal del Vehículo (`POST /api/v1/orders/{order}/deliver`):**
   - **Regla Estricta PT-008:** La entrega **únicamente** es válida si la orden se encuentra en estado `FINALIZADA`. Cualquier intento de entrega desde otro estado (`PENDIENTE`, `EN_DIAGNOSTICO`, etc.) responde inmediatamente con **HTTP 422**:
     ```json
     {
       "success": false,
       "message": "Los datos proporcionados no son válidos.",
       "errors": {
         "status": ["La orden solo puede ser entregada desde el estado FINALIZADA. Estado actual: EN_REPARACION."]
       }
     }
     ```
   - Al entregar, establece el estado en `ENTREGADA`, registra `delivered_at = now()` y **bloquea la orden en solo lectura permanente (PT-009)**.
7. **Inmutabilidad de Orden Entregada (PT-009):**
   - Todo intento de modificar notas (`PUT /orders/{id}`) o cargar nuevos servicios (`POST /orders/{id}/services`) sobre una orden `ENTREGADA` es rechazado con **HTTP 422**.
8. **Cancelación Justificada (`POST /api/v1/orders/{order}/cancel`):**
   - **Regla Estricta PT-010:** Requiere obligatoriamente un motivo de cancelación (`reason`, mínimo 5 caracteres) y el usuario responsable.
   - **Solo es válida en estados previos a `FINALIZADA`.** Si la orden ya se encuentra en `FINALIZADA` o `ENTREGADA`, responde con **HTTP 422**.

---

### 7. Pruebas Automatizadas de Feature

Ubicadas en `tests/Feature/Api/`:
- `ClientApiTest.php`: CRUD, unicidad de documento compuesto y soft delete.
- `VehicleApiTest.php`: Placa única, kilometraje no regresivo y autorización administrativa de odómetro.
- `MechanicApiTest.php`: Documento único, RBAC y toggle de estado de disponibilidad.
- `ServiceApiTest.php`: Catálogo, validación de precio decimal no negativo y protección de borrado.
- `OrderLifecycleApiTest.php`: Apertura atómica `ORD-YYYY-XXXX`, validación de odómetro, snapshot de tarifas, bloqueo de técnicos inactivos/duplicados, precondiciones de reparación, rechazo de entrega si no está en `FINALIZADA`, bloqueo a solo lectura y cancelación justificada.
