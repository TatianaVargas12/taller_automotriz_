# Entregable 2: Implementación de la API REST Modular
## Sistema de Gestión de Talleres Automotrices (Laravel 13 / PHP 8.5 / MySQL 8.4 LTS)

---

### 1. Arquitectura de Software y Capas Limpias

La API REST del backend ha sido construida bajo el patrón de **Monolito Modular con Capas Limpias** (Hexagonal Ligera), evitando fugas de lógica de negocio hacia los controladores y garantizando respuestas JSON homogéneas con el prefijo obligatorio `/api/v1`.

```
[ Cliente HTTP / Frontend ]
          │  Petición JSON / Bearer Token
          ▼
[ routes/api.php ]
          │
          ▼
[ Capa de Presentación: Controladores Delgados ] (app/Http/Controllers/Api/V1/)
          │  Inyección de Dependencias
          ▼
[ Capa de Aplicación: Form Requests & Resources ] (app/Http/Requests/, app/Http/Resources/)
          │  Validación Estricta / Serialización DTO
          ▼
[ Capa de Dominio: Servicios de Negocio ] (app/Services/)
          │  Reglas Invariantes / Transacciones DB
          ▼
[ Capa de Persistencia: Modelos Eloquent ] (app/Models/)
          │  MySQL 8.4 LTS InnoDB
          ▼
[ Base de Datos Relacional ]
```

---

### 2. Formato Estándar de Respuestas JSON

Toda respuesta de la API hereda de `BaseApiController` y cumple con una estructura semántica predecible:

#### 2.1. Respuesta Exitosa Simple (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Operación completada exitosamente.",
  "data": { ... }
}
```

#### 2.2. Respuesta Paginada (HTTP 200)
```json
{
  "success": true,
  "message": "Listado de órdenes obtenido con éxito.",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 4,
    "per_page": 15,
    "total": 52
  }
}
```

#### 2.3. Respuesta de Error de Seguridad o No Encontrado (HTTP 401 / 403 / 404)
```json
{
  "success": false,
  "message": "No tiene permisos para realizar esta acción."
}
```

#### 2.4. Respuesta de Validación Semántica Fallida (HTTP 422)
```json
{
  "success": false,
  "message": "Los datos proporcionados no son válidos.",
  "errors": {
    "entry_mileage": [
      "El kilometraje de entrada (45000 km) no puede ser inferior al último registrado en el vehículo (50000 km)."
    ]
  }
}
```

---

### 3. Controladores Delgados (`app/Http/Controllers/Api/V1/`)

Los controladores actúan como puntos de entrada orquestadores; no contienen consultas SQL crudas ni lógica de negocio:

1. **`BaseApiController`:** Provee los métodos de envelope JSON `success($data, $message, $code)` y `error($message, $code, $errors)`.
2. **`AuthController`:** Login, logout, perfil autenticado (`/me`) y auditoría de eventos de acceso.
3. **`ClientController`:** Listado paginado con búsqueda en tiempo real, creación, detalle con flota, actualización y soft delete.
4. **`VehicleController`:** Listado, alta con placa única en mayúsculas, detalle, actualización con regla de odómetro, soft delete e historial de intervenciones.
5. **`MechanicController`:** Listado técnico, registro con documento único, detalle, actualización y cambio de estado de disponibilidad (`is_active`).
6. **`ServiceController`:** Catálogo de tarifas base en `DECIMAL(12,2)`, creación, actualización y soft delete.
7. **`OrderController`:** Apertura con correlativo `ORD-YYYY-XXXX`, detalle con trazabilidad, actualización de notas, adición/remoción de servicios con snapshot de precio y asignación de técnicos.
8. **`OrderStatusController`:** Transición en máquina de estados, entrega formal del vehículo (bloqueo a solo lectura) y cancelación justificada con motivo.
9. **`HealthController`:** Monitoreo y health check del servidor y conexión con MySQL 8.4.

---

### 4. Servicios de Dominio (`app/Services/`)

Encapsulan todas las reglas de negocio e invariantes críticas del taller:

- **`OrderDomainService`:**
  - **Generación Atómica de Folio:** Transacción con bloqueo pesimista (`lockForUpdate`) para emitir la secuencia anual `ORD-YYYY-XXXX` libre de colisiones concurrentes.
  - **Snapshot de Precio:** Copia el `base_price` actual al campo `order_services.unit_price`. Modificaciones posteriores en el catálogo nunca alteran las órdenes vigentes o históricas.
  - **Precondiciones para `EN_REPARACION`:** Requiere validar que la orden posea al menos 1 servicio y al menos 1 mecánico activo (`is_active = true`), arrojando HTTP 422 si falta alguno.
  - **Entrega Formal:** Solo permitida si el estado actual es `FINALIZADA` (HTTP 422 en otros estados). Establece `delivered_at` y bloquea la orden en solo lectura permanente.
  - **Inmutabilidad:** Toda orden en `ENTREGADA` rechaza cualquier modificación posterior con HTTP 422.
  - **Cancelación:** Exige motivo obligatorio y solo es válida en estados previos a `FINALIZADA`.
- **`VehicleService`:**
  - Valida la regla no decreciente de odómetro: nuevo kilometraje $\ge$ kilometraje registrado.
  - Excepción autorizada: Permite disminución solo a usuarios con rol `admin` (`override_mileage = true`) registrando motivo técnico obligatorio en auditoría.
  - Normaliza placas a mayúsculas sin espacios (`strtoupper(trim($plate))`).
- **`ClientService`:** Búsqueda en tiempo real por nombres, apellidos, documento y teléfono. Soft deletes.
- **`MechanicService`:** Validación de documento único laboral y alternancia de estado activo/inactivo.
- **`ServiceCatalogService`:** Mantenimiento de precios en `DECIMAL(12,2)` y soporte de soft deletes.
- **`AuditService`:** Registro en `audit_logs` con `user_id`, `entity_type`, `action`, IP, User-Agent y snapshots de `previous_values` y `new_values` en JSON nativo.

---

### 5. API Resources (Serialización Desacoplada)

Ubicados en `app/Http/Resources/`, transforman los modelos Eloquent en representaciones JSON sin exponer directamente la estructura interna de la base de datos:
- `ClientResource` (incluye cálculo de vehículos y nombre completo)
- `VehicleResource` (incluye relación con cliente formateada)
- `MechanicResource` (formato de documento, especialidad y estado)
- `ServiceResource` (tarifa formateada a decimal con 2 dígitos)
- `OrderResource` (incluye folio, líneas con snapshots, técnicos asignados y estado tipado)
- `OrderServiceResource` (línea con precio unitario congelado y subtotal)
- `OrderStatusHistoryResource` (secuencia histórica con autor y motivo)
- `UserResource` (usuario con roles asignados sin exponer hashes de contraseña)

---

### 6. Rutas Registradas en `routes/api.php`

Todas las rutas operan bajo el prefijo `/api/v1` y cuentan con nombres de ruta canónicos (`api.v1.{modulo}.{accion}`).
- **Públicas:** `/api/v1/auth/login`, `/api/v1/health`.
- **Protegidas por Sanctum y RBAC:** `/api/v1/auth/logout`, `/api/v1/auth/me`, `/api/v1/clients/*`, `/api/v1/vehicles/*`, `/api/v1/mechanics/*`, `/api/v1/services/*`, `/api/v1/orders/*`.
