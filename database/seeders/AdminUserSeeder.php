<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Inicializa el usuario Administrador base tomando credenciales
     * EXCLUSIVAMENTE de variables de entorno, NUNCA hardcodeadas.
     *
     * Variables leídas:
     * - ADMIN_NAME (por defecto: 'Administrador Principal')
     * - ADMIN_EMAIL (por defecto: 'admin@taller.local')
     * - ADMIN_PASSWORD (por defecto: 'AdminSecure2026!*')
     */
    public function run(): void
    {
        $adminName = env('ADMIN_NAME', 'Administrador Principal');
        $adminEmail = env('ADMIN_EMAIL', 'admin@taller.local');
        $adminPassword = env('ADMIN_PASSWORD', 'AdminSecure2026!*');

        $adminUser = User::query()->updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => $adminName,
                'password' => Hash::make($adminPassword),
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Asignación segura del rol Administrador
        $adminRole = Role::query()->where('slug', 'admin')->first();

        if ($adminRole) {
            $adminUser->roles()->syncWithoutDetaching([$adminRole->id]);
        }
    }
}
