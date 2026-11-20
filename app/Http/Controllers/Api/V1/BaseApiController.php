<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\Response;

abstract class BaseApiController extends Controller
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Retorna una respuesta exitosa estandarizada.
     *
     * @param  mixed  $data
     */
    protected function success(mixed $data = null, string $message = 'Operación completada con éxito.', int $code = Response::HTTP_OK): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Retorna una respuesta de error estandarizada.
     *
     * @param  array<string, mixed>|null  $errors
     */
    protected function error(string $message, int $code = Response::HTTP_BAD_REQUEST, ?array $errors = null): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $code);
    }
}
