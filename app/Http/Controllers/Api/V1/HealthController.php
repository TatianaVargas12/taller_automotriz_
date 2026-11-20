<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class HealthController extends BaseApiController
{
    /**
     * Endpoint de salud del sistema (TRD Sección 5.2).
     */
    public function check(): JsonResponse
    {
        $dbStatus = 'ok';
        $dbMessage = 'Connected to MySQL 8.4 database.';

        try {
            DB::select('SELECT 1');
        } catch (\Throwable $e) {
            $dbStatus = 'error';
            $dbMessage = $e->getMessage();
        }

        $storageWritable = is_writable(storage_path('framework'));

        $isHealthy = ($dbStatus === 'ok' && $storageWritable);

        return response()->json([
            'status' => $isHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toISOString(),
            'services' => [
                'database' => [
                    'status' => $dbStatus,
                    'message' => $dbMessage,
                ],
                'storage' => [
                    'status' => $storageWritable ? 'ok' : 'error',
                    'path' => 'storage/framework',
                ],
            ],
            'version' => '1.0.0-MVP',
        ], $isHealthy ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE);
    }
}
