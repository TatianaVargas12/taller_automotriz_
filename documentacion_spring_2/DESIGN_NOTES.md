# Notas de Diseño y Decisiones Técnicas del Esquema de Base de Datos y API REST
## Sistema de Gestión de Talleres Automotrices & Asistente IA (Laravel 13 / MySQL 8.4 / PHP 8.5)

---

### 1. Resumen Ejecutivo de la Entrega

Este entregable implementa la capa de persistencia, base de datos relacional, módulo de autenticación/autorización y API REST completa del backend (Hitos 1, 2 y 3 de la Hoja de Ruta), cubriendo:
- **13 tablas relacionales** en MySQL 8.4 (motor InnoDB obligatorio) + 1 tabla para tokens de Sanctum (`personal_access_tokens`).
- Modelos Eloquent tipados en PHP 8.5 con `declare(strict_types=1);`.
- Seeders idempotentes de roles y usuario administrador inicial con credenciales vía `.env`.
- Autenticación por Bearer Tokens con **Laravel Sanctum** y revocación completa (`/api/v1/auth/*`).
- Autorización RBAC mediante middleware `CheckRole` sobre las tablas `roles` y `role_user` (roles: `admin`, `receptionist`, `mechanic`, `client`).
- Operaciones CRUD completas y endpoints de máquina de estados para órdenes (`/api/v1/*`).
- Bitácoras inmutables de auditoría (`audit_logs`) con snapshots JSON y trazabilidad de transiciones en `order_status_history`.
- Suite exhaustiva de Feature Tests con 100% de sintaxis validada.

---

### 2. Decisiones de Diseño y Mapeo de Entidades

#### 2.1. Convenciones de Claves Primarias y Foráneas
- **Claves Primarias:** Se adopta el estándar nativo de Laravel 13 con `$table->id()` (`BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`) de forma consistente en las 14 tablas.
- **Claves Foráneas:** Se utiliza `$table->foreignId('entidad_id')->constrained('tabla')`. En las relaciones de histórico operativo (`clients`, `vehicles`, `services`, `mechanics`), se aplica explícitamente `->restrictOnDelete()` para prevenir la eliminación accidental en cascada de entidades con historial activo, conforme a la regla de integridad del TRD (Sección 2).

#### 2.2. Reglas de Integridad Implementadas en el Motor (MySQL 8.4)

| Regla de Negocio | Tabla | Restricción en Base de Datos | Justificación en PRD / TRD |
| :--- | :--- | :--- | :--- |
| **Documento único por tipo de cliente** | `clients` | `UNIQUE(document_type, document_number)` | PRD CA-1.1.2: Permite que un extranjero con CE y un ciudadano con CC compartan el mismo número numérico sin colisión, pero prohíbe duplicados del mismo tipo. |
| **Documento único por mecánico** | `mechanics` | `UNIQUE(document_number)` | PRD CA-3.1.1: Identificación laboral única para cada técnico operativo. |
| **Placa vehicular única** | `vehicles` | `UNIQUE(plate)` | PRD CA-2.1.1: Evita que el mismo vehículo físico se duplique en la base de datos. |
| **Numeración de orden secuencial y única** | `orders` | `UNIQUE(order_number)` | PRD RF-5.1 y PT-011: Folio correlativo único protegido contra colisiones por concurrencia. |
| **No duplicidad de mecánico en misma orden** | `order_mechanic` | `UNIQUE(order_id, mechanic_id)` | PRD CA-3.2.2 y PT-005: El motor rechaza a nivel de restricción única la asignación redundante del mismo técnico. |
| **Snapshot inmutable de precio** | `order_services` | `unit_price DECIMAL(12, 2)`, `subtotal DECIMAL(12, 2)` | PRD RF-4.2 y PT-007: Se congelan el nombre y precio unitario al agregar el servicio. Actualizaciones posteriores al catálogo no alteran órdenes pasadas. |
| **Subtotal calculado** | `order_services` | `subtotal = quantity * unit_price` | PRD CA-5.4.1: Persistencia del snapshot exacto por línea de servicio. |
| **Kilometraje no negativo** | `vehicles`, `orders` | `UNSIGNED INTEGER` | PRD CA-2.1.3: El tipo no admite valores negativos en el motor. |

#### 2.3. Soft Deletes y Preservación Histórica
Las tablas `clients`, `vehicles` y `services` implementan `SoftDeletes` (`deleted_at` nullable).
- Los clientes o vehículos desactivados no pueden ser seleccionados para nuevas órdenes, pero las órdenes históricas conservan su integridad referencial intacta sin arrojar excepciones de clave foránea.
- Los registros eliminados lógicamente quedan excluidos de los listados y búsquedas de la API por defecto.

#### 2.4. Precisión Monetaria
Todos los campos de tarifas, precios, impuestos y totales utilizan `DECIMAL(12, 2)`. Se prohíben tipos de coma flotante (`FLOAT` o `DOUBLE`) para garantizar cero errores por redondeo en auditorías y facturación.

#### 2.5. Bitácoras e Inmutabilidad
- **`order_status_history`:** Bitácora inmutable de toda transición de estado (`PENDIENTE` $\rightarrow$ `EN_DIAGNOSTICO` $\rightarrow$ `EN_REPARACION` $\rightarrow$ `EN_ESPERA_APROBACION` $\rightarrow$ `FINALIZADA` $\rightarrow$ `ENTREGADA` / `CANCELADA`). Deshabilita `$timestamps = false` y solo registra `created_at`.
- **`audit_logs`:** Registra operaciones críticas almacenando `previous_values` y `new_values` en columnas nativas `JSON` de MySQL, con IP y agente de usuario para cumplimiento normativo de la Ley 1581 (Habeas Data). Incluye auditoría obligatoria de eventos de seguridad: `login`, `login_failed`, `logout` y `access_denied`.
- **`ai_generations`:** Registro desacoplado de telemetría de IA con tiempos de respuesta en milisegundos (`execution_time_ms`), tokens utilizados y estado, garantizando que los fallos del LLM no bloqueen las operaciones del taller.

---

### 3. Matriz de las 13+1 Tablas

1. `users`: Autenticación, credenciales protegidas con Bcrypt/Argon2.
2. `roles`: Matriz RBAC (`admin`, `receptionist`, `mechanic`, `client`).
3. `role_user`: Pivote N:M entre usuarios y roles con `UNIQUE(user_id, role_id)`.
4. `clients`: Datos de contacto del cliente, índice único compuesto `(document_type, document_number)`.
5. `vehicles`: Flota vehicular, índice único de placa `(plate)`, kilometraje actual.
6. `mechanics`: Personal técnico, documento único, vínculo 1:1 opcional con usuario.
7. `services`: Catálogo de mano de obra y operaciones, `base_price DECIMAL(12,2)`.
8. `orders`: Orden de servicio central, folio único `order_number`, máquina de estados tipada.
9. `order_services`: Detalle de servicios en orden, snapshot inmutable de precios.
10. `order_mechanic`: Asignación de técnicos con restricción única compuesta anti-duplicados.
11. `order_status_history`: Historial inmutable de cambios de estado con motivo y responsable.
12. `ai_generations`: Historial de prompts, respuestas generadas y telemetría de IA.
13. `audit_logs`: Auditoría de modificaciones críticas con snapshots JSON previo y nuevo.
14. `personal_access_tokens`: Tokens de autenticación Bearer de Laravel Sanctum.

---

### 4. Arquitectura de Seguridad, Autenticación y RBAC

#### 4.1. Laravel Sanctum
- **Login (`POST /api/v1/auth/login`):** Emite tokens Bearer tras validar credenciales con `Hash::check()` y verificar que el usuario esté activo (`status = 'Activo'`). Registra auditoría de acceso exitoso o fallido.
- **Logout (`POST /api/v1/auth/logout`):** Elimina el token actual en uso (`$user->currentAccessToken()->delete()`) y audita el cierre de sesión.
- **Protección de Rutas (`auth:sanctum`):** Cualquier solicitud sin token válido o con token revocado/expirado es rechazada con `HTTP 401 Unauthorized` en formato JSON consistente (`{"success": false, "message": "No autenticado."}`).

#### 4.2. Middleware RBAC (`CheckRole`)
- Valida los roles del usuario contra la base de datos a través de la relación `roles()` en `User`.
- El rol `admin` dispone de privilegios de bypass administrativo en toda la suite.
- Cuando un rol no autorizado intenta invocar un endpoint protegido (ej. Mecánico intentando crear mecánicos o recepcionista intentando eliminar servicios), el middleware responde con `HTTP 403 Forbidden` (`{"success": false, "message": "No tiene permisos para realizar esta acción."}`) y genera automáticamente un registro en `audit_logs` con la acción `access_denied`.

#### 4.3. Scoping de Datos por Rol
- **Administrador:** Acceso irrestricto a todos los registros y operaciones.
- **Recepcionista:** Gestión de clientes, vehículos, servicios y apertura/entrega de órdenes.
- **Mecánico:** Consulta filtrada únicamente a las órdenes donde se encuentre asignado en `order_mechanic`. Solo puede actualizar órdenes asignadas y avanzar estados de diagnóstico y reparación.
- **Cliente Final:** Consulta restringida únicamente a sus propios datos de cliente, vehículos asociados a su email y órdenes de sus vehículos.

---

### 5. Documentación OpenAPI 3.0 y Estrategia de Sincronización Continua

#### 5.1. Artefactos de la Especificación
La API se encuentra formalmente documentada bajo el estándar OpenAPI 3.0.3 en los artefactos `openapi.json` y `openapi.yaml` situados en la raíz del backend. Dichos archivos describen:
- Los 24 endpoints operativos de `/api/v1` con sus parámetros de query, path y esquemas de payload.
- Esquema de seguridad `bearerAuth` basado en tokens de Laravel Sanctum.
- Esquemas de componentes reutilizables (`Client`, `Vehicle`, `Mechanic`, `Service`, `Order`, `OrderStatusHistory`, `User`, `Role`, `ApiSuccessResponse`, `ApiErrorResponse`, etc.).
- Respuestas de error estandarizadas (`401`, `403`, `404`, `422`).

#### 5.2. Mantenimiento y Sincronización Continua con el Código
Para asegurar que la documentación técnica no sufra divergencias respecto al código fuente, se establece la siguiente disciplina de ingeniería:
1. **Verificación de Cobertura en la Suite de Pruebas:**
   El test automatizado `tests/Feature/Api/OpenApiDocumentationTest.php` inspecciona la colección activa de rutas registradas en el router (`Route::getRoutes()`). Cualquier ruta agregada o alterada en `routes/api.php` que no esté declarada en `openapi.json` con sus respectivos métodos HTTP causará un fallo inmediato en la suite de pruebas automatizadas.
2. **Validación Estructural Automática:**
   El script `scratch/validate_openapi.php` verifica la conformidad del documento contra las especificaciones de OpenAPI 3.0.3 (existencia de títulos, versiones, respuestas válidas con descripción y resolución completa de punteros `$ref`).
3. **Flujo de Modificación de Contratos:**
   Al crear o modificar Form Requests o reglas de dominio, el desarrollador debe actualizar el archivo de especificación mediante `php scratch/generate_openapi.php`, exportar a YAML con `php scratch/export_openapi_yaml.php` y ejecutar el validador estructural antes de fusionar cambios a la rama principal.

