# Entregable 1: Creación de la Base de Datos Relacional
## Sistema de Gestión de Talleres Automotrices (Laravel 13 / PHP 8.5 / MySQL 8.4 LTS)

---

### 1. Resumen y Decisiones de Arquitectura de Persistencia

La base de datos del sistema ha sido diseñada e implementada bajo el motor relacional **MySQL 8.4 LTS**, utilizando obligatoriamente el motor de almacenamiento **InnoDB** con soporte transaccional ACID, claves foráneas con restricción estricta de eliminación (`ON DELETE RESTRICT`) para preservar la integridad histórica, restricciones de unicidad en motor y soporte de borrado lógico (**Soft Deletes**).

El esquema está compuesto por **14 migraciones** estructuradas (13 tablas de dominio de negocio y 1 tabla para tokens de API Sanctum):

```
       ┌───────────────────┐             ┌───────────────────────┐
       │       users       │             │         roles         │
       └───────────────────┘             └───────────────────────┘
       │ PK  id            │<───────┐    │ PK  id                │
       │     name          │        │    │     name              │
       │     email (UK)    │        │    │     slug (UK)         │
       │     status        │        │    └───────────────────────┘
       └───────────────────┘        │                ▲
                 │ 1                │                │ N
                 │                  │      ┌───────────────────┐
                 │ N                └──────│     role_user     │
       ┌───────────────────┐               └───────────────────┘
       │    audit_logs     │               │ FK  user_id (UK)  │
       └───────────────────┘               │ FK  role_id (UK)  │
       │ PK  id            │               └───────────────────┘
       │ FK  user_id       │
       │     action        │
       │     previous_vals │
       │     new_values    │
       └───────────────────┘

       ┌───────────────────┐ 1         N ┌───────────────────────┐
       │      clients      │────────────<│       vehicles        │
       └───────────────────┘             └───────────────────────┘
       │ PK  id            │             │ PK  id                │
       │ UK (doc_type, num)│             │ FK  client_id         │
       │     first_name    │             │     plate (UK)        │
       │     phone         │             │     current_mileage   │
       │     deleted_at    │             │     deleted_at        │
       └───────────────────┘             └───────────────────────┘
                                                     │ 1
                                                     │
                                                     │ N
       ┌───────────────────┐             ┌───────────────────────┐
       │     services      │             │        orders         │
       └───────────────────┘             └───────────────────────┘
       │ PK  id            │             │ PK  id                │
       │     name          │             │ FK  vehicle_id        │
       │     base_price    │             │ FK  client_id         │
       │     status        │             │     order_number (UK) │
       │     deleted_at    │             │     entry_mileage     │
       └───────────────────┘             │     status (ENUM)     │
                 ▲                       │     total             │
                 │ 1                     └───────────────────────┘
                 │                                   │ 1
                 │ N                                 │ N
       ┌───────────────────┐               ┌───────────────────────┐
       │  order_services   │               │ order_status_history  │
       └───────────────────┘               └───────────────────────┘
       │ PK  id            │               │ PK  id                │
       │ FK  order_id      │               │ FK  order_id          │
       │ FK  service_id    │               │ FK  user_id           │
       │     unit_price    │               │     from_status       │
       │     quantity      │               │     to_status         │
       │     subtotal      │               │     reason            │
       └───────────────────┘               └───────────────────────┘
                                                     │ 1
       ┌───────────────────┐                         │
       │     mechanics     │                         │
       └───────────────────┘                         │
       │ PK  id            │                         │
       │ FK  user_id (opt) │                         │
       │     doc_num (UK)  │                         │ N
       │     is_active     │               ┌───────────────────┐
       └───────────────────┘               │  order_mechanic   │
                 ▲                         └───────────────────┘
                 │ 1                       │ PK  id            │
                 │ N                       │ FK  order_id (UK) │
                 └─────────────────────────│ FK  mechanic_id(UK)│
                                           └───────────────────┘
```

---

### 2. Catálogo de Migraciones e Integridad en Motor

#### 2.1. Tabla `users` (`2026_01_01_000001_create_users_table.php`)
- **Campos:** `id`, `name` (VARCHAR 100), `email` (VARCHAR 150), `password` (VARCHAR 255), `status` (VARCHAR 20, default `'Activo'`), `email_verified_at`, `remember_token`, timestamps.
- **Integridad:** Restricción de unicidad `UNIQUE(email)`. Índice sobre `status`.

#### 2.2. Tablas RBAC `roles` y `role_user` (`...000002` y `...000003`)
- **`roles`:** `id`, `name` (VARCHAR 50), `slug` (VARCHAR 50, UNIQUE), `description`, timestamps.
- **`role_user`:** Pivote N:M con claves foráneas `user_id` y `role_id` con `cascadeOnDelete()`, e índice único compuesto:
  ```php
  $table->unique(['user_id', 'role_id'], 'role_user_unique');
  ```

#### 2.3. Tabla `clients` (`2026_01_01_000004_create_clients_table.php`)
- **Campos:** `id`, `first_name` (VARCHAR 100), `last_name` (VARCHAR 100), `document_type` (VARCHAR 20), `document_number` (VARCHAR 50), `phone` (VARCHAR 50), `email` (VARCHAR 150 nullable), `address` (VARCHAR 255 nullable), `status` (VARCHAR 20 default `'active'`), timestamps, `deleted_at`.
- **Integridad:**
  - Restricción única compuesta requerida por PRD CA-1.1.2:
    ```php
    $table->unique(['document_type', 'document_number'], 'clients_doc_type_number_unique');
    ```
  - Soporte de **Soft Deletes** para desactivación lógica sin romper historial de órdenes.
  - Índices sobre `phone`, `email` e índice compuesto `['last_name', 'first_name']` para búsqueda en tiempo real.

#### 2.4. Tabla `vehicles` (`2026_01_01_000005_create_vehicles_table.php`)
- **Campos:** `id`, `client_id` (FK `clients`), `plate` (VARCHAR 15), `brand` (VARCHAR 80), `model` (VARCHAR 80), `year` (SMALLINT UNSIGNED), `color` (VARCHAR 50 nullable), `vin` (VARCHAR 50 nullable), `current_mileage` (INTEGER UNSIGNED default 0), `status` (VARCHAR 20 default `'active'`), timestamps, `deleted_at`.
- **Integridad:**
  - `UNIQUE(plate)` con normalización a mayúsculas (PRD CA-2.1.1).
  - `current_mileage UNSIGNED` que prohíbe valores negativos en motor (PRD CA-2.1.3).
  - Clave foránea `client_id` con `restrictOnDelete()`.

#### 2.5. Tabla `mechanics` (`2026_01_01_000006_create_mechanics_table.php`)
- **Campos:** `id`, `user_id` (FK `users` nullable), `document_type` (VARCHAR 20), `document_number` (VARCHAR 50), `first_name` (VARCHAR 100 nullable), `last_name` (VARCHAR 100 nullable), `name` (VARCHAR 150), `phone` (VARCHAR 50 nullable), `specialty` (VARCHAR 100 nullable), `is_active` (BOOLEAN default true), timestamps.
- **Integridad:** `UNIQUE(document_number)` para evitar duplicidad técnica (PRD CA-3.1.1).

#### 2.6. Tabla `services` (`2026_01_01_000007_create_services_table.php`)
- **Campos:** `id`, `name` (VARCHAR 150), `description` (TEXT nullable), `category` (VARCHAR 100 nullable), `base_price` (DECIMAL 12,2 default 0.00), `status` (VARCHAR 20 default `'Activo'`), timestamps, `deleted_at`.
- **Integridad:** Precios en `DECIMAL(12,2)` para exactitud monetaria; Soft Deletes para no alterar órdenes pasadas.

#### 2.7. Tabla `orders` (`2026_01_01_000008_create_orders_table.php`)
- **Campos:** `id`, `order_number` (VARCHAR 30, UNIQUE), `vehicle_id` (FK `vehicles`), `client_id` (FK `clients`), `receptionist_id` (FK `users` nullable), `entry_mileage` (INTEGER UNSIGNED), `status` (VARCHAR 30, enum `OrderStatus`), `subtotal` (DECIMAL 12,2), `tax` (DECIMAL 12,2), `total` (DECIMAL 12,2), `client_notes` (TEXT nullable), `entry_at` (TIMESTAMP), `delivered_at` (TIMESTAMP nullable), timestamps.
- **Integridad:** Folio correlativo atómico único `UNIQUE(order_number)` con formato `ORD-YYYY-XXXX`.

#### 2.8. Tabla `order_services` (`2026_01_01_000009_create_order_services_table.php`)
- **Campos:** `id`, `order_id` (FK `orders`), `service_id` (FK `services`), `service_name` (VARCHAR 150), `unit_price` (DECIMAL 12,2), `quantity` (INTEGER UNSIGNED), `subtotal` (DECIMAL 12,2), `notes` (TEXT nullable), timestamps.
- **Integridad:** **Snapshot inmutable de tarifa** (PRD RF-4.2 y PT-007). Congela el precio unitario y subtotal al momento de cargar la línea; cambios posteriores al catálogo no alteran órdenes existentes.

#### 2.9. Tabla `order_mechanic` (`2026_01_01_000010_create_order_mechanic_table.php`)
- **Campos:** `id`, `order_id` (FK `orders`), `mechanic_id` (FK `mechanics`), `role_description` (VARCHAR 100 nullable), `assigned_at` (TIMESTAMP).
- **Integridad:** Restricción única en motor para prevenir duplicados técnicos (PRD PT-005):
  ```php
  $table->unique(['order_id', 'mechanic_id'], 'order_mechanic_unique');
  ```

#### 2.10. Tabla `order_status_history` (`2026_01_01_000011_create_order_status_history_table.php`)
- **Campos:** `id`, `order_id` (FK `orders`), `user_id` (FK `users` nullable), `from_status` (VARCHAR 30 nullable), `to_status` (VARCHAR 30), `reason` (TEXT nullable), `created_at` (TIMESTAMP).
- **Integridad:** **Bitácora inmutable append-only** ($timestamps = false).

#### 2.11. Tablas Auxiliares
- **`ai_generations` (`...000012`):** Historial y telemetría de invocaciones de IA (`execution_time_ms`, tokens, payload JSON).
- **`audit_logs` (`...000013`):** Trazabilidad obligatoria con columnas nativas `previous_values JSON` y `new_values JSON`.
- **`personal_access_tokens` (`...000014`):** Tabla de tokens Bearer de Laravel Sanctum.

---

### 3. Modelos Eloquent y Relaciones

Ubicados en `app/Models/` con `declare(strict_types=1);`:
- **`Client`:** `hasMany(Vehicle::class)`, `hasMany(Order::class)`.
- **`Vehicle`:** `belongsTo(Client::class)`, `hasMany(Order::class)`.
- **`Mechanic`:** `belongsTo(User::class)`, `belongsToMany(Order::class, 'order_mechanic')`.
- **`Service`:** `belongsToMany(Order::class, 'order_services')`. Cast `base_price => 'decimal:2'`.
- **`Order`:** `belongsTo(Vehicle::class)`, `belongsTo(Client::class)`, `belongsToMany(Service::class, 'order_services')`, `belongsToMany(Mechanic::class, 'order_mechanic')`, `hasMany(OrderStatusHistory::class)`. Cast `status => OrderStatus::class`.
- **`OrderStatus` (Enum PHP 8.5):** `PENDIENTE`, `EN_DIAGNOSTICO`, `EN_REPARACION`, `EN_ESPERA_APROBACION`, `FINALIZADA`, `ENTREGADA`, `CANCELADA`.

---

### 4. Seeders Idempotentes

1. **`RoleSeeder` (`database/seeders/RoleSeeder.php`):**
   Crea los 4 roles canónicos (`admin`, `receptionist`, `mechanic`, `client`) con `firstOrCreate`.
2. **`AdminUserSeeder` (`database/seeders/AdminUserSeeder.php`):**
   Crea el usuario administrador leyendo variables de entorno (`ADMIN_DEFAULT_EMAIL`, `ADMIN_DEFAULT_PASSWORD`), sin contraseñas hardcodeadas, y le vincula el rol `admin`.
3. **`DatabaseSeeder` (`database/seeders/DatabaseSeeder.php`):**
   Orquesta la ejecución limpia e idempotente con `php artisan migrate:fresh --seed`.

---

### 5. Verificación de Integridad

El archivo de prueba `tests/Feature/DatabaseIntegrityTest.php` valida en suite automatizada:
- Creación de tablas e índices en MySQL 8.4.
- Unicidad de placa vehicular (`UNIQUE(plate)`).
- Unicidad de documento compuesto de cliente (`UNIQUE(document_type, document_number)`).
- Bloqueo en motor de mecánicos duplicados en la misma orden (`UNIQUE(order_id, mechanic_id)`).
- Persistencia del snapshot inmutable de precios en `order_services`.
- Soft Deletes en clientes, vehículos y catálogo de servicios.
