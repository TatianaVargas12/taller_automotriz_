-- ==============================================================================
-- SISTEMA DE GESTIÓN DE TALLERES AUTOMOTRICES & ASISTENTE IA
-- Esquema Relacional de Base de Datos (DDL) y Semillas Iniciales (DML)
-- Motor: MySQL 8.4 LTS / InnoDB / UTF8MB4
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Creación de la Base de Datos
CREATE DATABASE IF NOT EXISTS `taller_automotriz`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `taller_automotriz`;

-- ------------------------------------------------------------------------------
-- Tabla 1: users (Identidad, credenciales y autenticación)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  INDEX `users_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 2: roles (Matriz de Control de Acceso Basado en Roles - RBAC)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`),
  UNIQUE KEY `roles_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 3: role_user (Pivote N:M para asignación de roles a usuarios)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `role_user`;
CREATE TABLE `role_user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_user_user_role_unique` (`user_id`, `role_id`),
  CONSTRAINT `fk_role_user_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_user_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 4: clients (Módulo de Clientes con Soft Deletes)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `document_type` VARCHAR(20) NOT NULL COMMENT 'CC, CE, NIT, PP, TI',
  `document_number` VARCHAR(50) NOT NULL COMMENT 'Documento único por tipo',
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NULL DEFAULT NULL,
  `address` VARCHAR(255) NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clients_doc_type_number_unique` (`document_type`, `document_number`),
  INDEX `clients_phone_index` (`phone`),
  INDEX `clients_email_index` (`email`),
  INDEX `clients_status_index` (`status`),
  INDEX `clients_full_name_index` (`last_name`, `first_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 5: vehicles (Flota Vehicular con Soft Deletes y regla ON DELETE RESTRICT)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` BIGINT UNSIGNED NOT NULL,
  `plate` VARCHAR(20) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `year` SMALLINT UNSIGNED NOT NULL,
  `color` VARCHAR(50) NULL DEFAULT NULL,
  `type` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Sedán, SUV, Camioneta, Hatchback',
  `vin` VARCHAR(50) NULL DEFAULT NULL,
  `current_mileage` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicles_plate_unique` (`plate`),
  INDEX `vehicles_vin_index` (`vin`),
  INDEX `vehicles_status_index` (`status`),
  INDEX `vehicles_client_status_index` (`client_id`, `status`),
  CONSTRAINT `fk_vehicles_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 6: mechanics (Personal Técnico con documento único)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `mechanics`;
CREATE TABLE `mechanics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `document_number` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NULL DEFAULT NULL,
  `specialty` VARCHAR(100) NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mechanics_document_number_unique` (`document_number`),
  UNIQUE KEY `mechanics_user_id_unique` (`user_id`),
  INDEX `mechanics_phone_index` (`phone`),
  INDEX `mechanics_status_index` (`status`),
  INDEX `mechanics_full_name_index` (`last_name`, `first_name`),
  CONSTRAINT `fk_mechanics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 7: services (Catálogo de Servicios y Operaciones con Soft Deletes)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `category` VARCHAR(100) NULL DEFAULT NULL,
  `base_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `services_name_index` (`name`),
  INDEX `services_category_index` (`category`),
  INDEX `services_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 8: orders (Órdenes de Servicio - Entidad Central del Sistema)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(50) NOT NULL,
  `vehicle_id` BIGINT UNSIGNED NOT NULL,
  `client_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `entry_mileage` INT UNSIGNED NOT NULL,
  `reported_issue` TEXT NOT NULL,
  `preliminary_diagnosis` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
  `cancellation_reason` TEXT NULL DEFAULT NULL,
  `cancelled_by_user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `entry_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `finished_at` TIMESTAMP NULL DEFAULT NULL,
  `delivered_at` TIMESTAMP NULL DEFAULT NULL,
  `cancelled_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_unique` (`order_number`),
  INDEX `orders_status_index` (`status`),
  INDEX `orders_vehicle_status_index` (`vehicle_id`, `status`),
  INDEX `orders_client_status_index` (`client_id`, `status`),
  INDEX `orders_entry_at_index` (`entry_at`),
  CONSTRAINT `fk_orders_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_cancelled_by_user` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 9: order_services (Snapshot inmutable de precios por línea de servicio)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_services`;
CREATE TABLE `order_services` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `service_id` BIGINT UNSIGNED NOT NULL,
  `service_name` VARCHAR(150) NOT NULL COMMENT 'Snapshot del nombre en momento de factura',
  `unit_price` DECIMAL(12,2) NOT NULL COMMENT 'Snapshot inmutable de precio',
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(12,2) NOT NULL COMMENT 'quantity * unit_price',
  `notes` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `order_services_order_service_index` (`order_id`, `service_id`),
  CONSTRAINT `fk_order_services_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_services_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 10: order_mechanic (Asignación N:M de mecánicos a órdenes)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_mechanic`;
CREATE TABLE `order_mechanic` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `mechanic_id` BIGINT UNSIGNED NOT NULL,
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_mechanic_order_mech_unique` (`order_id`, `mechanic_id`),
  CONSTRAINT `fk_order_mechanic_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_mechanic_mechanic` FOREIGN KEY (`mechanic_id`) REFERENCES `mechanics` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 11: order_status_history (Bitácora inmutable de transiciones de órdenes)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_status_history`;
CREATE TABLE `order_status_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `previous_status` VARCHAR(30) NULL DEFAULT NULL,
  `new_status` VARCHAR(30) NOT NULL,
  `reason` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `order_history_order_created_index` (`order_id`, `created_at`),
  CONSTRAINT `fk_order_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 12: ai_generations (Diccionario de Datos y Generaciones IA)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `ai_generations`;
CREATE TABLE `ai_generations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `module_name` VARCHAR(50) NOT NULL,
  `generation_type` VARCHAR(50) NOT NULL,
  `prompt` TEXT NOT NULL,
  `generated_content` LONGTEXT NULL DEFAULT NULL,
  `provider` VARCHAR(50) NOT NULL DEFAULT 'openai',
  `model` VARCHAR(50) NULL DEFAULT NULL,
  `execution_time_ms` INT UNSIGNED NULL DEFAULT NULL,
  `tokens_used` INT UNSIGNED NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'success',
  `error_message` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `ai_gen_module_type_index` (`module_name`, `generation_type`),
  INDEX `ai_gen_created_at_index` (`created_at`),
  CONSTRAINT `fk_ai_gen_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 13: audit_logs (Auditoría con valores previos y nuevos en JSON)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `previous_values` JSON NULL DEFAULT NULL,
  `new_values` JSON NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `audit_logs_entity_index` (`entity_type`, `entity_id`),
  INDEX `audit_logs_created_at_index` (`created_at`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Tabla 14: personal_access_tokens (Autenticación API Bearer Laravel Sanctum)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255) NOT NULL,
  `tokenable_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `abilities` TEXT NULL DEFAULT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  INDEX `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- SEMILLAS INICIALES (DML) - ROLES, USUARIO ADMINISTRADOR Y CATÁLOGO
-- ==============================================================================

-- 1. Roles del Sistema RBAC
INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `created_at`, `updated_at`) VALUES
  (1, 'Administrador', 'admin', 'Control total de usuarios, roles, auditoría y configuración del taller', NOW(), NOW()),
  (2, 'Recepcionista', 'receptionist', 'Gestión de clientes, recepción vehicular, apertura y entrega de órdenes', NOW(), NOW()),
  (3, 'Mecánico', 'mechanic', 'Inspección técnica, ejecución de servicios y actualización de órdenes', NOW(), NOW()),
  (4, 'Cliente Final', 'client', 'Consulta del estado de su vehículo e historial de reparaciones', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Usuario Administrador Inicial
-- Password por defecto: AdminSecure2026!* (Hash bcrypt con 12 rondas)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `status`, `created_at`, `updated_at`) VALUES
  (1, 'Administrador Principal', 'admin@taller.local', '$2y$12$NlmjN0x9Yq7ZgP3wz0xSgeK/H64pXJb5.yG5Pz8gQ8H4uB0Pz8gQ8', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- 3. Asignación de Rol de Administrador
INSERT INTO `role_user` (`user_id`, `role_id`, `created_at`, `updated_at`) VALUES
  (1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- 4. Catálogo Base de Servicios del Taller
INSERT INTO `services` (`id`, `name`, `description`, `category`, `base_price`, `status`, `created_at`, `updated_at`) VALUES
  (1, 'Mantenimiento Preventivo 10.000 km', 'Cambio de aceite sintético, filtro de aceite, filtro de aire y revisión de 25 puntos de seguridad', 'Mantenimiento', 280000.00, 'active', NOW(), NOW()),
  (2, 'Cambio de Pastillas de Freno Delanteras', 'Sustitución de pastillas de freno cerámicas, limpieza de calipers y purgado de circuito hidráulico', 'Frenos', 185000.00, 'active', NOW(), NOW()),
  (3, 'Alineación y Balanceo Láser', 'Alineación 3D en 4 ruedas y balanceo dinámico computarizado de neumáticos', 'Suspensión', 120000.00, 'active', NOW(), NOW()),
  (4, 'Diagnóstico Electrónico Computarizado OBD-II', 'Escaneo completo de centralitas (ECU, ABS, Airbag, BCM), borrado de códigos de falla y telemetría en vivo', 'Diagnóstico', 95000.00, 'active', NOW(), NOW()),
  (5, 'Sincronización de Motor', 'Lavado de inyectores por ultrasonido, cambio de bujías de iridio y calibración de cuerpo de aceleración', 'Motor', 340000.00, 'active', NOW(), NOW()),
  (6, 'Inspección Multipunto Digital (DVI)', 'Revisión técnica de 50 puntos con registro fotográfico de evidencias y semaforización de desgaste', 'Inspección', 80000.00, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

SET FOREIGN_KEY_CHECKS = 1;
