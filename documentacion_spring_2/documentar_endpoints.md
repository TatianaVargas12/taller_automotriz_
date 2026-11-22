# Entregable 5: Documentación Técnica de Endpoints (OpenAPI 3.0.3)
## Sistema de Gestión de Talleres Automotrices (Laravel 13 / PHP 8.5 / MySQL 8.4 LTS)

---

### 1. Especificación OpenAPI 3.0.3 y Artefactos

La API REST del taller automotriz está formalmente documentada bajo el estándar **OpenAPI 3.0.3**, permitiendo su consumo directo e importación en herramientas como Postman, Swagger UI, Insomnia o generadores de clientes SDK (TypeScript, React, Flutter, Python).

- **Artefacto JSON:** [`openapi.json`](file:///c:/Users/Melii/taller_automotriz_/taller_automotriz_/openapi.json) (Raíz del proyecto, 100 KB, 24 rutas y 30 esquemas).
- **Artefacto YAML:** [`openapi.yaml`](file:///c:/Users/Melii/taller_automotriz_/taller_automotriz_/openapi.yaml) (Raíz del proyecto, 53 KB).
- **Esquema de Seguridad:** `bearerAuth` (HTTP Bearer / Laravel Sanctum API Token).
- **Servidor Base:** `/api/v1`

---

### 2. Guía de Uso Rápido para Desarrolladores

#### 2.1. Autenticación y Emisión de Token
1. Realizar una petición POST a `/api/v1/auth/login` con credenciales de usuario:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -d '{"email": "admin@autotaller.pro", "password": "AdminSecure2026!", "device_name": "web-frontend"}'
   ```
2. La API responderá con el token Bearer:
   ```json
   {
     "success": true,
     "message": "Autenticación exitosa.",
     "data": {
       "token": "1|9876543210abcdefsanctumtoken",
       "token_type": "Bearer",
       "user": { ... }
     }
   }
   ```

#### 2.2. Consumo de Endpoints Protegidos
Adjuntar el token en el header HTTP `Authorization` en cada solicitud subsiguiente:
```bash
curl -X GET http://localhost:8000/api/v1/orders \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 1|9876543210abcdefsanctumtoken"
```

#### 2.3. Cierre de Sesión y Revocación
Para invalidar el token de forma permanente:
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 1|9876543210abcdefsanctumtoken"
```
Una vez revocado, cualquier llamada que reutilice dicho token responderá **HTTP 401 Unauthorized**.

---

### 3. Matriz Exhaustiva de Endpoints (`/api/v1`)

#### 3.1. Autenticación y Monitoreo
| Método | Ruta | Roles | Query Params | Request Body | Códigos |
|---|---|---|---|---|---|
| `POST` | `/auth/login` | Público | Ninguno | `LoginRequest` (`email`, `password`, `device_name`) | `200`, `401`, `403`, `422` |
| `POST` | `/auth/logout` | Autenticado | Ninguno | Ninguno | `200`, `401` |
| `GET` | `/auth/me` | Autenticado | Ninguno | Ninguno | `200`, `401` |
| `GET` | `/health` | Público | Ninguno | Ninguno | `200` |

#### 3.2. Módulo de Clientes
| Método | Ruta | Roles | Query Params | Request Body | Códigos |
|---|---|---|---|---|---|
| `GET` | `/clients` | Admin, Recepcionista | `search`, `status`, `page`, `per_page` | Ninguno | `200`, `401`, `403` |
| `POST` | `/clients` | Admin, Recepcionista | Ninguno | `StoreClientRequest` (`first_name`, `last_name`, `document_type`, `document_number`, `phone`, `email`, `address`) | `201`, `422` |
| `GET` | `/clients/{client}` | Admin, Recepcionista, Cliente (propio) | Ninguno | Ninguno | `200`, `403`, `404` |
| `PUT` | `/clients/{client}` | Admin, Recepcionista | Ninguno | `UpdateClientRequest` | `200`, `422` |
| `DELETE` | `/clients/{client}` | Admin | Ninguno | Ninguno | `200`, `403` |

#### 3.3. Módulo de Vehículos
| Método | Ruta | Roles | Query Params | Request Body | Códigos |
|---|---|---|---|---|---|
| `GET` | `/vehicles` | Admin, Recepcionista | `search`, `client_id`, `page`, `per_page` | Ninguno | `200`, `401`, `403` |
| `POST` | `/vehicles` | Admin, Recepcionista | Ninguno | `StoreVehicleRequest` (`client_id`, `plate`, `brand`, `model`, `year`, `current_mileage`) | `201`, `422` |
| `GET` | `/vehicles/{vehicle}` | Admin, Recepcionista, Cliente (propio) | Ninguno | Ninguno | `200`, `403`, `404` |
| `PUT` | `/vehicles/{vehicle}` | Admin, Recepcionista | Ninguno | `UpdateVehicleRequest` (`current_mileage`, `override_mileage`, `override_reason`) | `200`, `422` |
| `DELETE` | `/vehicles/{vehicle}` | Admin | Ninguno | Ninguno | `200`, `403` |
| `GET` | `/vehicles/{vehicle}/history` | Admin, Recepcionista, Mecánico, Cliente | `page`, `per_page` | Ninguno | `200`, `403` |

#### 3.4. Módulo de Mecánicos
| Método | Ruta | Roles | Query Params | Request Body | Códigos |
|---|---|---|---|---|---|
| `GET` | `/mechanics` | Admin, Recepcionista | `search`, `specialty`, `status`, `page`, `per_page` | Ninguno | `200`, `403` |
| `POST` | `/mechanics` | Admin | Ninguno | `StoreMechanicRequest` (`document_type`, `document_number`, `name`, `specialty`, `is_active`) | `201`, `403`, `422` |
| `GET` | `/mechanics/{mechanic}` | Admin, Recepcionista | Ninguno | Ninguno | `200`, `404` |
| `PUT` | `/mechanics/{mechanic}` | Admin | Ninguno | `UpdateMechanicRequest` | `200`, `422` |
| `PATCH` | `/mechanics/{mechanic}/status`| Admin | Ninguno | `{"is_active": boolean}` | `200`, `422` |
| `DELETE` | `/mechanics/{mechanic}` | Admin | Ninguno | Ninguno | `200`, `403` |

#### 3.5. Módulo de Catálogo de Servicios
| Método | Ruta | Roles | Query Params | Request Body | Códigos |
|---|---|---|---|---|---|
| `GET` | `/services` | Autenticado | `search`, `category`, `page`, `per_page` | Ninguno | `200` |
| `POST` | `/services` | Admin | Ninguno | `StoreServiceRequest` (`name`, `description`, `category`, `base_price`, `status`) | `201`, `403`, `422` |
| `GET` | `/services/{service}` | Autenticado | Ninguno | Ninguno | `200`, `404` |
| `PUT` | `/services/{service}` | Admin | Ninguno | `UpdateServiceRequest` | `200`, `422` |
| `DELETE` | `/services/{service}` | Admin | Ninguno | Ninguno | `200`, `403` |

#### 3.6. Módulo de Órdenes de Servicio
| Método | Ruta | Roles | Query Params | Request Body | Códigos |
|---|---|---|---|---|---|
| `GET` | `/orders` | Admin, Recepcionista, Mecánico, Cliente | `search`, `status`, `vehicle_id`, `client_id`, `mechanic_id`, `page`, `per_page` | Ninguno | `200` |
| `POST` | `/orders` | Admin, Recepcionista | Ninguno | `StoreOrderRequest` (`vehicle_id`, `entry_mileage`, `client_notes`, `estimated_delivery_date`) | `201`, `422` |
| `GET` | `/orders/{order}` | Admin, Recepcionista, Mecánico, Cliente | Ninguno | Ninguno | `200`, `403`, `404` |
| `PUT` | `/orders/{order}` | Admin, Recepcionista, Mecánico | Ninguno | `UpdateOrderRequest` (`client_notes`) | `200`, `422` |
| `GET` | `/orders/{order}/history` | Autenticado | Ninguno | Ninguno | `200` |
| `POST` | `/orders/{order}/services` | Admin, Recepcionista | Ninguno | `AddOrderServiceRequest` (`service_id`, `quantity`, `notes`) | `201`, `422` |
| `DELETE` | `/orders/{order}/services/{id}` | Admin, Recepcionista | Ninguno | Ninguno | `200`, `422` |
| `POST` | `/orders/{order}/mechanics` | Admin, Recepcionista | Ninguno | `AssignOrderMechanicRequest` (`mechanic_id`, `role_description`) | `200`, `422` |
| `DELETE` | `/orders/{order}/mechanics/{id}`| Admin, Recepcionista | Ninguno | Ninguno | `200`, `422` |
| `POST` | `/orders/{order}/transition` | Admin, Recepcionista, Mecánico | Ninguno | `TransitionOrderStatusRequest` (`status` / `to_status`, `reason`) | `200`, `422` |
| `POST` | `/orders/{order}/deliver` | Admin, Recepcionista | Ninguno | `DeliverOrderRequest` (`notes`) | `200`, `422` |
| `POST` | `/orders/{order}/cancel` | Admin, Recepcionista | Ninguno | `CancelOrderRequest` (`reason` / `cancellation_reason`) | `200`, `422` |

---

### 4. Esquemas de Componentes Reutilizables (`components.schemas`)

El archivo OpenAPI define 30 esquemas tipados que garantizan un contrato claro:
- **`Client` / `StoreClientRequest` / `UpdateClientRequest`**
- **`Vehicle` / `StoreVehicleRequest` / `UpdateVehicleRequest`**
- **`Mechanic` / `StoreMechanicRequest` / `UpdateMechanicRequest`**
- **`Service` / `StoreServiceRequest` / `UpdateServiceRequest`**
- **`Order` / `StoreOrderRequest` / `OrderServiceLine` / `OrderStatusHistory`**
- **`AddOrderServiceRequest` / `AssignOrderMechanicRequest` / `TransitionOrderStatusRequest` / `DeliverOrderRequest` / `CancelOrderRequest`**
- **`User` / `Role` / `LoginRequest` / `LoginResponseData`**
- **`ApiSuccessResponse` / `ApiPaginatedSuccessResponse` / `ApiErrorResponse` / `ApiValidationErrorResponse` / `PaginationMeta`**

---

### 5. Reglas de Negocio Explícitas en la Documentación

Cada endpoint en OpenAPI detalla las reglas de integridad que aplican:
1. **Regla de Odómetro No Regresivo:** `PUT /vehicles/{vehicle}` explica que reducir kilometraje exige `override_mileage = true` y rol `admin`.
2. **Snapshot de Tarifa:** `POST /orders/{order}/services` aclara que el precio unitario se copia al momento de inserción y no cambia si el catálogo se actualiza posteriormente.
3. **Precondición para `EN_REPARACION`:** `POST /orders/{order}/transition` especifica que se requiere al menos 1 servicio y 1 mecánico activo asignado.
4. **Entrega Estricta (PT-008):** `POST /orders/{order}/deliver` estipula que cualquier estado distinto a `FINALIZADA` es rechazado con **HTTP 422**.
5. **Inmutabilidad de Orden Entregada (PT-009):** Documenta el rechazo con **HTTP 422** ante cualquier intento de edición o adición de servicios sobre órdenes en estado `ENTREGADA`.
6. **Cancelación Justificada (PT-010):** `POST /orders/{order}/cancel` especifica que exige motivo obligatorio y es rechazada si la orden ya está finalizada o entregada.

---

### 6. Estrategia de Sincronización Continua y Pruebas Automatizadas

Para evitar que la documentación OpenAPI diverja del código:
1. **Prueba Automatizada en el Harness (`tests/Feature/Api/OpenApiDocumentationTest.php`):**
   - Comprueba que el archivo `openapi.json` existe y es sintácticamente válido.
   - Valida que todos los componentes y esquemas requeridos estén declarados.
   - Lee en tiempo de ejecución la colección de rutas registradas en Laravel (`Route::getRoutes()`) bajo el prefijo `api/v1` y comprueba que **el 100% de las rutas y métodos HTTP implementados se encuentren documentados**.
   - Valida que las descripciones de los endpoints contengan las explicaciones de las reglas invariantes (`FINALIZADA`, `override_mileage`, `snapshot`, etc.).
2. **Herramienta de Validación Estructural:**
   - Script ejecutable: `php scratch/validate_openapi.php`.
   - Valida conformidad contra las especificaciones formales de OpenAPI 3.0.3 (descripciones obligatorias por respuesta, rutas válidas que inician con `/` y resolución recursiva de todos los punteros `$ref`).
   - Resultado: `PASSED: OpenAPI 3.0.3 specification is 100% structurally valid with 0 errors.`
