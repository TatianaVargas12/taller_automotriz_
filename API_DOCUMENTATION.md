# Guía Técnica de la API REST & Documentación de Endpoints (v1)
## Sistema de Gestión de Talleres Automotrices & Asistente IA (Laravel 13 / PHP 8.5 / MySQL 8.4)

---

### 1. Introducción y Arquitectura de la API

La API REST del sistema de gestión de talleres automotrices expone operaciones sobre una arquitectura de **Monolito Modular** con prefijo estricto `/api/v1` y respuestas en formato JSON.

- **Especificación OpenAPI 3.0.3:** Disponible en los archivos [`openapi.json`](file:///c:/Users/Melii/taller_automotriz_/taller_automotriz_/openapi.json) y [`openapi.yaml`](file:///c:/Users/Melii/taller_automotriz_/taller_automotriz_/openapi.yaml) en la raíz del repositorio.
- **Formato Estándar de Respuestas:**
  - **Éxito (200 OK / 201 Created):**
    ```json
    {
      "success": true,
      "message": "Mensaje descriptivo de la acción.",
      "data": { ... }
    }
    ```
  - **Listados Paginados (200 OK):**
    ```json
    {
      "success": true,
      "message": "Listado obtenido con éxito.",
      "data": [ ... ],
      "meta": {
        "current_page": 1,
        "last_page": 5,
        "per_page": 15,
        "total": 68
      }
    }
    ```
  - **Error de Autenticación / Autorización / Recurso no encontrado (401 / 403 / 404):**
    ```json
    {
      "success": false,
      "message": "Descripción clara del motivo del rechazo."
    }
    ```
  - **Error de Validación Semántica (422 Unprocessable Content):**
    ```json
    {
      "success": false,
      "message": "Los datos suministrados no son válidos.",
      "errors": {
        "plate": ["La placa vehicular ya se encuentra registrada en el sistema."]
      }
    }
    ```

---

### 2. Guía de Autenticación con Laravel Sanctum

#### 2.1. Obtención del Token (Login)
Para iniciar sesión y obtener un token Bearer, el cliente envía sus credenciales al endpoint público:

- **Ruta:** `POST /api/v1/auth/login`
- **Headers:** `Content-Type: application/json`, `Accept: application/json`
- **Cuerpo de la Petición:**
  ```json
  {
    "email": "admin@autotaller.pro",
    "password": "AdminSecure2026!",
    "device_name": "panel-web-recepcion"
  }
  ```
- **Respuesta Exitosa (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Autenticación exitosa.",
    "data": {
      "token": "1|abcdef1234567890sanctumtokenhash",
      "token_type": "Bearer",
      "user": {
        "id": 1,
        "name": "Administrador Principal",
        "email": "admin@autotaller.pro",
        "status": "Activo",
        "roles": [
          { "id": 1, "name": "Administrador", "slug": "admin" }
        ]
      }
    }
  }
  ```
- **Auditoría:** Cada login exitoso registra un evento en `audit_logs` con `action = 'login'`. Intentos con clave errónea registran `action = 'login_failed'` y responden con **HTTP 401**.

#### 2.2. Uso del Token en Peticiones Protegidas
En todas las peticiones a endpoints protegidos (`auth:sanctum`), debe incluirse el token en el header HTTP `Authorization`:
```http
Authorization: Bearer 1|abcdef1234567890sanctumtokenhash
Accept: application/json
```

#### 2.3. Expiración y Revocación (Logout)
- Para cerrar la sesión de forma segura, el cliente invoca:
  - **Ruta:** `POST /api/v1/auth/logout`
  - **Headers:** `Authorization: Bearer <token>`
- El backend elimina físicamente el registro del token en la tabla `personal_access_tokens` y audita el cierre de sesión (`action = 'logout'`).
- Cualquier llamada posterior con el token revocado o un token inválido/expirado responderá automáticamente con **HTTP 401 Unauthorized**:
  ```json
  {
    "success": false,
    "message": "No autenticado."
  }
  ```

---

### 3. Matriz de Autorización RBAC (Role-Based Access Control)

El middleware `CheckRole` (`'role' => \App\Http\Middleware\CheckRole::class`) protege los endpoints validando la pertenencia del usuario a los roles autorizados en la base de datos:

| Rol (`slug`) | Alcance y Permisos en la API |
|---|---|
| **`admin`** | **Acceso total y supervisión:** CRUD de clientes, vehículos, mecánicos, catálogo de servicios, apertura/cierre de órdenes, excepciones de odómetro (`override_mileage`) y consulta de auditoría. |
| **`receptionist`** | **Gestión operativa:** CRUD de clientes y vehículos; consulta de mecánicos y servicios; apertura de órdenes (`ORD-YYYY-XXXX`), adición de servicios tarifados, asignación de técnicos y entrega de vehículos (`deliver`). |
| **`mechanic`** | **Técnico operativo:** Consulta de órdenes asignadas a su perfil; actualización de notas técnicas y avance de estados en la máquina de estados (`EN_DIAGNOSTICO`, `EN_REPARACION`, etc.). No puede acceder a gestión de clientes ni tarifas. |
| **`client`** | **Portal del cliente:** Consulta exclusiva de sus propios datos personales, historial de sus vehículos y estado de sus órdenes de servicio en curso. Cualquier intento de consulta ajena responde **HTTP 403**. |

> [!IMPORTANT]
> Cuando un usuario autenticado intenta realizar una operación sin poseer el rol requerido (por ejemplo, un mecánico intentando dar de alta a otro técnico o una recepcionista intentando borrar un servicio del catálogo), el middleware responde **HTTP 403 Forbidden** y registra inmediatamente el intento en `audit_logs` con `action = 'access_denied'`.

---

### 4. Catálogo Detallado de Endpoints

#### 4.1. Módulo de Autenticación
- **`POST /api/v1/auth/login`**: Emite token Sanctum. Público. Códigos: 200, 401, 403, 422.
- **`POST /api/v1/auth/logout`**: Revoca el token actual. Roles: Autenticado. Códigos: 200, 401.
- **`GET /api/v1/auth/me`**: Retorna el perfil y roles del usuario en sesión. Roles: Autenticado. Códigos: 200, 401.

#### 4.2. Módulo de Clientes
- **`GET /api/v1/clients`**: Listado paginado con búsqueda por nombre, cédula o teléfono. Excluye soft deletes. Roles: `admin`, `receptionist`. Códigos: 200, 401, 403.
- **`POST /api/v1/clients`**: Alta de cliente. Valida `UNIQUE(document_type, document_number)`. Roles: `admin`, `receptionist`. Códigos: 201, 422.
- **`GET /api/v1/clients/{client}`**: Detalle con vehículos. Roles: `admin`, `receptionist`, `client` (solo titular). Códigos: 200, 403, 404.
- **`PUT /api/v1/clients/{client}`**: Modificación de datos del cliente. Roles: `admin`, `receptionist`. Códigos: 200, 422.
- **`DELETE /api/v1/clients/{client}`**: **Soft Delete**. Preserva historial de órdenes pasadas. Roles: `admin` (Recepcionista responde 403). Códigos: 200, 403.

#### 4.3. Módulo de Vehículos
- **`GET /api/v1/vehicles`**: Listado paginado de vehículos activos. Roles: `admin`, `receptionist`. Códigos: 200, 401, 403.
- **`POST /api/v1/vehicles`**: Alta de vehículo. Valida `UNIQUE(plate)` y normaliza a mayúsculas. Roles: `admin`, `receptionist`. Códigos: 201, 422.
- **`GET /api/v1/vehicles/{vehicle}`**: Ficha técnica del vehículo. Roles: `admin`, `receptionist`, `client` (solo titular). Códigos: 200, 403, 404.
- **`PUT /api/v1/vehicles/{vehicle}`**: **Regla No Decreciente de Odómetro:** El nuevo kilometraje no puede ser inferior al último registrado (HTTP 422), salvo excepción autorizada con `override_mileage = true` y justificación técnica exclusiva de `admin`. Roles: `admin`, `receptionist`. Códigos: 200, 422.
- **`DELETE /api/v1/vehicles/{vehicle}`**: **Soft Delete** del vehículo. Roles: `admin`. Códigos: 200, 403.
- **`GET /api/v1/vehicles/{vehicle}/history`**: Historial de intervenciones y órdenes de trabajo del vehículo. Roles: `admin`, `receptionist`, `mechanic`, `client`. Códigos: 200, 403.

#### 4.4. Módulo de Mecánicos
- **`GET /api/v1/mechanics`**: Catálogo de personal técnico. Roles: `admin`, `receptionist`. Códigos: 200, 403.
- **`POST /api/v1/mechanics`**: Registro de técnico con `document_number` único. Roles: `admin` (Recepcionista responde 403). Códigos: 201, 403, 422.
- **`GET /api/v1/mechanics/{mechanic}`**: Detalle de técnico. Roles: `admin`, `receptionist`. Códigos: 200, 404.
- **`PUT /api/v1/mechanics/{mechanic}`**: Actualización de especialidad y contacto. Roles: `admin`. Códigos: 200, 422.
- **`PATCH /api/v1/mechanics/{mechanic}/status`**: Alternar disponibilidad técnica (`is_active = true|false`). Roles: `admin`. Códigos: 200, 422.
- **`DELETE /api/v1/mechanics/{mechanic}`**: Desvinculación de técnico. Roles: `admin`. Códigos: 200, 403.

#### 4.5. Módulo de Servicios (Catálogo)
- **`GET /api/v1/services`**: Catálogo de operaciones tarifadas en `DECIMAL(12,2)`. Excluye soft deletes. Roles: Autenticado. Códigos: 200.
- **`POST /api/v1/services`**: Alta de servicio con precio $\ge 0$. Roles: `admin`. Códigos: 201, 403, 422.
- **`GET /api/v1/services/{service}`**: Detalle de operación y alcance técnico. Roles: Autenticado. Códigos: 200, 404.
- **`PUT /api/v1/services/{service}`**: Actualización de tarifa base. Los cambios posteriores no alteran órdenes pasadas. Roles: `admin`. Códigos: 200, 422.
- **`DELETE /api/v1/services/{service}`**: **Soft Delete** de servicio. Roles: `admin`. Códigos: 200, 403.

#### 4.6. Módulo de Órdenes de Servicio & Máquina de Estados
- **`GET /api/v1/orders`**: Listado de órdenes. Filtra automáticamente por rol: mecánicos ven solo asignadas; clientes solo sus propias órdenes. Roles: Todos. Códigos: 200.
- **`POST /api/v1/orders`**: Apertura de orden. Generación atómica secuencial de folio `ORD-YYYY-XXXX` e inicio en estado `PENDIENTE`. Rechaza odómetro inferior al del vehículo (HTTP 422). Roles: `admin`, `receptionist`. Códigos: 201, 422.
- **`GET /api/v1/orders/{order}`**: Detalle de orden con líneas tarifadas, mecánicos y bitácora. Roles: Todos autorizados. Códigos: 200, 403, 404.
- **`PUT /api/v1/orders/{order}`**: Edición de notas operativas. **Rechaza con 422 si la orden ya está ENTREGADA.** Roles: `admin`, `receptionist`, `mechanic`. Códigos: 200, 422.
- **`GET /api/v1/orders/{order}/history`**: Bitácora inmutable de transiciones de estado (`order_status_history`). Roles: Autenticado. Códigos: 200.
- **`POST /api/v1/orders/{order}/services`**: **Snapshot de Precio:** Congela `unit_price` y recalcula subtotales. Rechaza servicios inactivos (422) y órdenes en `ENTREGADA` (422). Roles: `admin`, `receptionist`. Códigos: 201, 422.
- **`DELETE /api/v1/orders/{order}/services/{orderService}`**: Elimina línea y recalcula totales. Roles: `admin`, `receptionist`. Códigos: 200, 422.
- **`POST /api/v1/orders/{order}/mechanics`**: Asigna técnico. Rechaza técnicos inactivos (422) o ya asignados a la orden (422). Roles: `admin`, `receptionist`. Códigos: 200, 422.
- **`DELETE /api/v1/orders/{order}/mechanics/{mechanic}`**: Desvincula mecánico. Roles: `admin`, `receptionist`. Códigos: 200, 422.
- **`POST /api/v1/orders/{order}/transition`**: **Máquina de Estados:** Avanza el estado de la orden. **Regla estricta:** La transición hacia `EN_REPARACION` exige al menos un servicio registrado y al menos un mecánico activo asignado (HTTP 422 si falta alguno). Roles: `admin`, `receptionist`, `mechanic`. Códigos: 200, 422.
- **`POST /api/v1/orders/{order}/deliver`**: **Entrega Formal (PT-008, PT-009):**
  - **Rechaza con HTTP 422 cualquier estado distinto de `FINALIZADA`.**
  - Al entregar, establece `delivered_at` y **bloquea la orden en solo lectura permanente**. Cualquier intento de modificación posterior responde **HTTP 422**.
  - Roles: `admin`, `receptionist`. Códigos: 200, 422.
- **`POST /api/v1/orders/{order}/cancel`**: **Cancelación Justificada (PT-010):**
  - Exige motivo de cancelación (`reason`, mínimo 5 caracteres) y usuario responsable.
  - Solo permitida desde estados previos a `FINALIZADA`. Si la orden ya está finalizada o entregada, responde **HTTP 422**.
  - Roles: `admin`, `receptionist`. Códigos: 200, 422.

---

### 5. Estrategia de Sincronización Continua (OpenAPI Spec Sync)

Para garantizar que la documentación OpenAPI nunca quede desactualizada respecto al código:

1. **Prueba Automatizada de Cobertura en CI/CD:**
   El test [`tests/Feature/Api/OpenApiDocumentationTest.php`](file:///c:/Users/Melii/taller_automotriz_/taller_automotriz_/tests/Feature/Api/OpenApiDocumentationTest.php) inspecciona en tiempo de ejecución la colección de rutas registradas en `Route::getRoutes()`. Si un desarrollador añade un nuevo endpoint o altera un método HTTP en `routes/api.php` sin actualizar la especificación OpenAPI, la suite de pruebas falla de forma inmediata.
2. **Generador y Validador Integrado:**
   - Script de generación: `php scratch/generate_openapi.php`
   - Script de exportación YAML: `php scratch/export_openapi_yaml.php`
   - Validador estructural OpenAPI 3.0: `php scratch/validate_openapi.php`
3. **Flujo de Trabajo para Nuevas Funcionalidades:**
   Toda modificación en Form Requests o nuevos controladores debe reflejarse en los esquemas de `components/schemas` y en las rutas correspondientes del generador OpenAPI antes de emitir un commit al repositorio.
