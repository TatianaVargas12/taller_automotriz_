<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class OpenApiDocumentationTest extends TestCase
{
    private array $openapi;

    protected function setUp(): void
    {
        parent::setUp();

        $path = base_path('openapi.json');
        $this->assertFileExists($path, 'El archivo openapi.json debe existir en la raíz del proyecto.');

        $content = file_get_contents($path);
        $this->assertIsString($content);

        $decoded = json_decode($content, true);
        $this->assertEquals(JSON_ERROR_NONE, json_last_error(), 'El archivo openapi.json debe ser un JSON válido.');
        $this->assertIsArray($decoded);

        $this->openapi = $decoded;
    }

    /**
     * Valida que la estructura base cumpla con la especificación OpenAPI 3.0.x.
     */
    public function test_openapi_has_valid_3x_root_structure(): void
    {
        $this->assertArrayHasKey('openapi', $this->openapi);
        $this->assertStringStartsWith('3.0', $this->openapi['openapi']);

        $this->assertArrayHasKey('info', $this->openapi);
        $this->assertArrayHasKey('title', $this->openapi['info']);
        $this->assertArrayHasKey('version', $this->openapi['info']);

        $this->assertArrayHasKey('paths', $this->openapi);
        $this->assertNotEmpty($this->openapi['paths']);

        $this->assertArrayHasKey('components', $this->openapi);
        $this->assertArrayHasKey('schemas', $this->openapi['components']);
        $this->assertArrayHasKey('securitySchemes', $this->openapi['components']);
    }

    /**
     * Valida que el esquema de seguridad Bearer Token con Sanctum esté correctamente configurado.
     */
    public function test_openapi_declares_sanctum_bearer_security(): void
    {
        $securitySchemes = $this->openapi['components']['securitySchemes'] ?? [];
        $this->assertArrayHasKey('bearerAuth', $securitySchemes);
        $this->assertEquals('http', $securitySchemes['bearerAuth']['type']);
        $this->assertEquals('bearer', $securitySchemes['bearerAuth']['scheme']);

        $this->assertArrayHasKey('security', $this->openapi);
        $this->assertContains(['bearerAuth' => []], $this->openapi['security']);
    }

    /**
     * Valida que todas las entidades clave tengan sus esquemas de componentes declarados.
     */
    public function test_openapi_contains_all_domain_schemas(): void
    {
        $schemas = $this->openapi['components']['schemas'] ?? [];

        $requiredSchemas = [
            'Client',
            'StoreClientRequest',
            'UpdateClientRequest',
            'Vehicle',
            'StoreVehicleRequest',
            'UpdateVehicleRequest',
            'Mechanic',
            'StoreMechanicRequest',
            'UpdateMechanicRequest',
            'Service',
            'StoreServiceRequest',
            'UpdateServiceRequest',
            'Order',
            'StoreOrderRequest',
            'OrderServiceLine',
            'OrderStatusHistory',
            'AddOrderServiceRequest',
            'AssignOrderMechanicRequest',
            'TransitionOrderStatusRequest',
            'DeliverOrderRequest',
            'CancelOrderRequest',
            'User',
            'Role',
            'LoginRequest',
            'ApiSuccessResponse',
            'ApiErrorResponse',
            'ApiValidationErrorResponse',
            'PaginationMeta',
        ];

        foreach ($requiredSchemas as $schemaName) {
            $this->assertArrayHasKey($schemaName, $schemas, "El esquema {$schemaName} debe estar declarado en components.schemas.");
        }
    }

    /**
     * Valida que cada ruta registrada en el router de Laravel bajo /api/v1 esté documentada en openapi.json.
     */
    public function test_all_registered_api_v1_routes_are_documented_in_openapi(): void
    {
        $routes = Route::getRoutes();
        $documentedPaths = $this->openapi['paths'];

        $apiV1Routes = [];

        foreach ($routes as $route) {
            $uri = $route->uri();

            if (str_starts_with($uri, 'api/v1/')) {
                $subPath = substr($uri, strlen('api/v1'));
                if (! str_starts_with($subPath, '/')) {
                    $subPath = '/' . $subPath;
                }

                $methods = array_filter(
                    $route->methods(),
                    fn ($m) => in_array($m, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
                );

                foreach ($methods as $method) {
                    $apiV1Routes[] = [
                        'method' => strtolower($method),
                        'path' => $subPath,
                    ];
                }
            }
        }

        $this->assertNotEmpty($apiV1Routes, 'Debe haber rutas registradas bajo el prefijo api/v1.');

        foreach ($apiV1Routes as $routeInfo) {
            $method = $routeInfo['method'];
            $path = $routeInfo['path'];

            $this->assertArrayHasKey(
                $path,
                $documentedPaths,
                "La ruta {$path} registrada en Laravel no se encuentra documentada en openapi.json."
            );

            $this->assertArrayHasKey(
                $method,
                $documentedPaths[$path],
                "El método {$method} para la ruta {$path} no se encuentra documentado en openapi.json."
            );
        }
    }

    /**
     * Valida que las reglas de negocio clave estén explicadas en las descripciones de los endpoints.
     */
    public function test_critical_business_invariants_are_explained_in_descriptions(): void
    {
        $paths = $this->openapi['paths'];

        // Entrega solo desde FINALIZADA
        $deliverDesc = $paths['/orders/{order}/deliver']['post']['description'] ?? '';
        $this->assertStringContainsString('FINALIZADA', $deliverDesc);

        // Cancelación con motivo
        $cancelDesc = $paths['/orders/{order}/cancel']['post']['description'] ?? '';
        $this->assertStringContainsString('FINALIZADA', $cancelDesc);

        // Kilometraje no regresivo
        $vehiclePutDesc = $paths['/vehicles/{vehicle}']['put']['description'] ?? '';
        $this->assertStringContainsString('override_mileage', $vehiclePutDesc);

        // Snapshot inmutable de servicios
        $serviceAddDesc = $paths['/orders/{order}/services']['post']['description'] ?? '';
        $this->assertStringContainsString('snapshot', strtolower($serviceAddDesc));
    }
}
