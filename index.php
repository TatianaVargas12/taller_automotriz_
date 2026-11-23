<?php
/**
 * AutoTaller Pro - Entrada Principal para Servidor Local XAMPP
 * Monolito Modular: Frontend Web + API REST + MySQL
 */

declare(strict_types=1);

// Manejo de peticiones API REST
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);

if (strpos($path, '/api/') !== false) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    require_once __DIR__ . '/api_handler.php';
    exit;
}

// Servir la aplicación AutoTaller Pro completa
$previewFile = __DIR__ . '/autotaller_design_preview.html';
if (file_exists($previewFile)) {
    require_once $previewFile;
    exit;
}

// Fallback si no existe la vista previa
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>AutoTaller Pro - Servidor XAMPP</title>
    <style>
        body { font-family: sans-serif; background: #f3f1ea; color: #242720; padding: 40px; text-align: center; }
        .card { background: white; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #d4d3c9; }
        h1 { color: #be401f; }
        a { color: #be401f; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <h1>AutoTaller Pro</h1>
        <p>Servidor XAMPP Local activo correctamente.</p>
        <p><a href="autotaller_design_preview.html">Abrir AutoTaller Pro →</a></p>
    </div>
</body>
</html>
