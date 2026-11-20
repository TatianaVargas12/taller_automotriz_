<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MechanicController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\OrderStatusController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\VehicleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Monolito Modular Taller Automotriz (v1)
|--------------------------------------------------------------------------
|
| Todas las rutas responden con formato JSON bajo el prefijo /api/v1.
| Control de Acceso Basado en Roles (RBAC) y tokens vía Laravel Sanctum.
|
*/

Route::prefix('v1')->group(function () {
    // -------------------------------------------------------------
    // Rutas Públicas (Sin sesión requerida)
    // -------------------------------------------------------------
    Route::post('/auth/login', [AuthController::class, 'login'])->name('api.v1.auth.login');
    Route::get('/health', [HealthController::class, 'check'])->name('api.v1.health');

    // -------------------------------------------------------------
    // Rutas Protegidas por Autenticación Sanctum (auth:sanctum)
    // -------------------------------------------------------------
    Route::middleware('auth:sanctum')->group(function () {
        // Sesión y Perfil
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
        Route::get('/auth/me', [AuthController::class, 'me'])->name('api.v1.auth.me');

        // ---------------------------------------------------------
        // Módulo 1: Clientes (CRUD y Búsqueda)
        // ---------------------------------------------------------
        Route::middleware('role:admin,receptionist')->group(function () {
            Route::get('/clients', [ClientController::class, 'index'])->name('api.v1.clients.index');
            Route::post('/clients', [ClientController::class, 'store'])->name('api.v1.clients.store');
            Route::put('/clients/{client}', [ClientController::class, 'update'])->name('api.v1.clients.update');
        });

        Route::middleware('role:admin,receptionist,client')->group(function () {
            Route::get('/clients/{client}', [ClientController::class, 'show'])->name('api.v1.clients.show');
        });

        Route::middleware('role:admin')->group(function () {
            Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('api.v1.clients.destroy');
        });

        // ---------------------------------------------------------
        // Módulo 2: Vehículos (CRUD, Kilometraje e Historial)
        // ---------------------------------------------------------
        Route::middleware('role:admin,receptionist')->group(function () {
            Route::get('/vehicles', [VehicleController::class, 'index'])->name('api.v1.vehicles.index');
            Route::post('/vehicles', [VehicleController::class, 'store'])->name('api.v1.vehicles.store');
            Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update'])->name('api.v1.vehicles.update');
        });

        Route::middleware('role:admin,receptionist,client')->group(function () {
            Route::get('/vehicles/{vehicle}', [VehicleController::class, 'show'])->name('api.v1.vehicles.show');
        });

        Route::middleware('role:admin,receptionist,mechanic,client')->group(function () {
            Route::get('/vehicles/{vehicle}/history', [VehicleController::class, 'history'])->name('api.v1.vehicles.history');
        });

        Route::middleware('role:admin')->group(function () {
            Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy'])->name('api.v1.vehicles.destroy');
        });

        // ---------------------------------------------------------
        // Módulo 3: Mecánicos (Personal Técnico)
        // ---------------------------------------------------------
        Route::middleware('role:admin,receptionist')->group(function () {
            Route::get('/mechanics', [MechanicController::class, 'index'])->name('api.v1.mechanics.index');
            Route::get('/mechanics/{mechanic}', [MechanicController::class, 'show'])->name('api.v1.mechanics.show');
        });

        Route::middleware('role:admin')->group(function () {
            Route::post('/mechanics', [MechanicController::class, 'store'])->name('api.v1.mechanics.store');
            Route::put('/mechanics/{mechanic}', [MechanicController::class, 'update'])->name('api.v1.mechanics.update');
            Route::patch('/mechanics/{mechanic}/status', [MechanicController::class, 'status'])->name('api.v1.mechanics.status');
            Route::delete('/mechanics/{mechanic}', [MechanicController::class, 'destroy'])->name('api.v1.mechanics.destroy');
        });

        // ---------------------------------------------------------
        // Módulo 4: Catálogo de Servicios
        // ---------------------------------------------------------
        Route::middleware('role:admin,receptionist,mechanic')->group(function () {
            Route::get('/services', [ServiceController::class, 'index'])->name('api.v1.services.index');
            Route::get('/services/{service}', [ServiceController::class, 'show'])->name('api.v1.services.show');
        });

        Route::middleware('role:admin')->group(function () {
            Route::post('/services', [ServiceController::class, 'store'])->name('api.v1.services.store');
            Route::put('/services/{service}', [ServiceController::class, 'update'])->name('api.v1.services.update');
            Route::delete('/services/{service}', [ServiceController::class, 'destroy'])->name('api.v1.services.destroy');
        });

        // ---------------------------------------------------------
        // Módulo 5: Órdenes de Servicio & Máquina de Estados
        // ---------------------------------------------------------
        // Consulta general de órdenes
        Route::middleware('role:admin,receptionist,mechanic,client')->group(function () {
            Route::get('/orders', [OrderController::class, 'index'])->name('api.v1.orders.index');
            Route::get('/orders/{order}', [OrderController::class, 'show'])->name('api.v1.orders.show');
            Route::get('/orders/{order}/history', [OrderController::class, 'history'])->name('api.v1.orders.history');
        });

        // Apertura de orden y gestión de ítems operativos
        Route::middleware('role:admin,receptionist')->group(function () {
            Route::post('/orders', [OrderController::class, 'store'])->name('api.v1.orders.store');

            // Asignación de servicios con snapshot
            Route::post('/orders/{order}/services', [OrderController::class, 'addService'])->name('api.v1.orders.services.add');
            Route::delete('/orders/{order}/services/{orderService}', [OrderController::class, 'removeService'])->name('api.v1.orders.services.remove');

            // Asignación de mecánicos
            Route::post('/orders/{order}/mechanics', [OrderController::class, 'assignMechanic'])->name('api.v1.orders.mechanics.assign');
            Route::delete('/orders/{order}/mechanics/{mechanic}', [OrderController::class, 'unassignMechanic'])->name('api.v1.orders.mechanics.unassign');

            // Entrega del vehículo (Solo desde FINALIZADA; rechazo 422 en otros estados)
            Route::post('/orders/{order}/deliver', [OrderStatusController::class, 'deliver'])->name('api.v1.orders.deliver');

            // Cancelación de orden con motivo justificado (Solo estados previos a FINALIZADA)
            Route::post('/orders/{order}/cancel', [OrderStatusController::class, 'cancel'])->name('api.v1.orders.cancel');
        });

        // Edición ordinaria y avance de estado técnico
        Route::middleware('role:admin,receptionist,mechanic')->group(function () {
            Route::put('/orders/{order}', [OrderController::class, 'update'])->name('api.v1.orders.update');
            Route::post('/orders/{order}/transition', [OrderStatusController::class, 'transition'])->name('api.v1.orders.transition');
        });
    });
});
