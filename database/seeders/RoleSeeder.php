<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Roles definidos formalmente en PRD (Sección 2) y TRD (Sección 2):
     * 1. Administrador: Control total, supervisión de módulos, catálogo y módulo de IA.
     * 2. Recepcionista: Clientes, vehículos, apertura de órdenes y entrega de vehículos.
     * 3. Mecánico: Órdenes asignadas, diagnóstico y avance de reparaciones.
     * 4. Cliente Final: Consulta de vehículos propios y trazabilidad histórica.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Administrador',
                'slug' => 'admin',
                'description' => 'Acceso total y supervisión de los 5 módulos base, configuración de catálogo, auditoría y módulo de IA.',
            ],
            [
                'name' => 'Recepcionista',
                'slug' => 'receptionist',
                'description' => 'Registro, consulta y actualización de Clientes y Vehículos. Apertura y entrega de órdenes de servicio.',
            ],
            [
                'name' => 'Mecánico',
                'slug' => 'mechanic',
                'description' => 'Consulta exclusiva de órdenes asignadas, registro de diagnósticos, observaciones técnicas y avances.',
            ],
            [
                'name' => 'Cliente Final',
                'slug' => 'client',
                'description' => 'Portal de autoservicio: visualización de vehículos registrados y consulta histórica de órdenes propias.',
            ],
        ];

        foreach ($roles as $roleData) {
            Role::query()->updateOrCreate(
                ['slug' => $roleData['slug']],
                [
                    'name' => $roleData['name'],
                    'description' => $roleData['description'],
                ]
            );
        }
    }
}
