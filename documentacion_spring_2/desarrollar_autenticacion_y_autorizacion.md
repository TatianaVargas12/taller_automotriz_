# Entregable 3: Desarrollo de Autenticación y Autorización RBAC
## Sistema de Gestión de Talleres Automotrices (Laravel 13 / PHP 8.5 / MySQL 8.4 LTS)

---

### 1. Sistema de Autenticación con Laravel Sanctum

La autenticación de la API REST se implementa mediante **Laravel Sanctum**, empleando tokens de acceso personal de tipo Bearer almacenados en la tabla `personal_access_tokens`.

#### 1.1. Emisión de Tokens (`POST /api/v1/auth/login`)
- **Controlador:** `AuthController::login(LoginRequest $request)`
- **Validación:**
  1. Busca el usuario por correo electrónico e incluye sus roles.
  2. Valida la contraseña mediante `Hash::check()`.
  3. Comprueba el estado de la cuenta (`status === 'Activo'`).
- **Auditoría de Seguridad:**
  - Si las credenciales fallan: registra un evento en `audit_logs` con `action = 'login_failed'` y responde con **HTTP 401 Unauthorized**:
    ```json
    {
      "success": false,
      "message": "Credenciales de acceso inválidas."
    }
    ```
  - Si el usuario está inactivo: registra `action = 'login_denied_inactive'` y responde **HTTP 403 Forbidden**.
  - Si la autenticación es exitosa: genera el token con `$user->createToken($deviceName)->plainTextToken`, registra `action = 'login'` y responde con **HTTP 200 OK**:
    ```json
    {
      "success": true,
      "message": "Autenticación exitosa.",
      "data": {
        "token": "1|abcdef1234567890sanctumtokenhash",
        "token_type": "Bearer",
        "user": {
          "id": 1,
          "name": "Administrador Principal",
          "email": "admin@autotaller.pro",
          "roles": [{ "id": 1, "name": "Administrador", "slug": "admin" }]
        }
      }
    }
    ```

#### 1.2. Uso del Token en Headers
Para invocar cualquier endpoint protegido, el cliente HTTP debe adjuntar el token en el encabezado de autorización:
```http
Authorization: Bearer 1|abcdef1234567890sanctumtokenhash
Accept: application/json
```

#### 1.3. Revocación de Tokens (`POST /api/v1/auth/logout`)
- **Controlador:** `AuthController::logout(Request $request)`
- **Comportamiento:**
  1. Obtiene el token activo con `$request->user()->currentAccessToken()`.
  2. Ejecuta `$token->delete()`, eliminando físicamente el registro de la tabla `personal_access_tokens`.
  3. Registra en `audit_logs` el evento con `action = 'logout'`.
- **Efecto de Revocación:** Cualquier solicitud subsiguiente con el token revocado o un token expirado es interceptada por el middleware `auth:sanctum` respondiendo **HTTP 401 Unauthorized**.

#### 1.4. Consulta de Perfil en Sesión (`GET /api/v1/auth/me`)
- Retorna el usuario autenticado con su colección de roles y su perfil técnico vinculado si posee perfil de mecánico.

---

### 2. Modelo de Autorización RBAC (Role-Based Access Control)

El sistema implementa un control de acceso basado en roles almacenado en las tablas relacionales `roles` y `role_user`:

#### 2.1. Matriz de Roles Canónicos
1. **`admin` (Administrador):** Posee bypass de supervisión total sobre todos los módulos y operaciones críticas (gestión de técnicos, modificación forzada de odómetros, soft deletes y auditoría).
2. **`receptionist` (Recepcionista / Asesor de Servicio):** Gestión de clientes, registro de vehículos, apertura de órdenes (`ORD-YYYY-XXXX`), asignación de servicios/mecánicos y entrega de vehículos (`deliver`).
3. **`mechanic` (Mecánico / Personal Técnico):** Consulta de órdenes asignadas a su perfil técnico, adición de notas de diagnóstico y avance de estados operativos (`EN_DIAGNOSTICO`, `EN_REPARACION`, `EN_ESPERA_APROBACION`).
4. **`client` (Cliente Final):** Consulta exclusiva de sus propios datos personales, vehículos vinculados a su email y estado de sus órdenes de servicio.

#### 2.2. Middleware `CheckRole` (`app/Http/Middleware/CheckRole.php`)
Registrado con el alias `'role'` en `bootstrap/app.php`:
```php
public function handle(Request $request, Closure $next, string ...$roles): Response
{
    $user = $request->user();

    if (! $user) {
        return response()->json([
            'success' => false,
            'message' => 'No autenticado.',
        ], Response::HTTP_UNAUTHORIZED);
    }

    // El Administrador posee acceso total en los 5 módulos base (PRD 2.0)
    if ($user->isAdmin()) {
        return $next($request);
    }

    foreach ($roles as $roleGroup) {
        $roleList = explode(',', $roleGroup);
        foreach ($roleList as $role) {
            if ($user->hasRole(trim($role))) {
                return $next($request);
            }
        }
    }

    // Auditoría obligatoria de acceso denegado (PRD 2.0)
    $this->auditService->log(
        entityType: 'Security',
        entityId: null,
        action: 'access_denied',
        previousValues: null,
        newValues: [
            'user_id' => $user->id,
            'email' => $user->email,
            'route' => $request->path(),
            'method' => $request->method(),
            'required_roles' => $roles,
        ],
        userId: $user->id
    );

    return response()->json([
        'success' => false,
        'message' => 'No tiene permisos para realizar esta acción.',
    ], Response::HTTP_FORBIDDEN);
}
```

---

### 3. Scoping de Datos y Protección a Nivel de Controlador

Además del middleware de ruta, los controladores aplican reglas de aislamiento según el rol del usuario autenticado:

1. **Aislamiento de Mecánicos:**
   - En `OrderController::index`: Si el usuario es mecánico, se aplica automáticamente el filtro `mechanic_id = $user->mechanic->id`.
   - En `OrderController::show`, `update` y `transition`: Se verifica que el técnico esté asignado en `order_mechanic`. Si no está asignado, responde **HTTP 403 Forbidden**.
2. **Aislamiento de Clientes:**
   - En `ClientController::show`: Si el usuario es un cliente, se valida `$client->email === $user->email`. Si intenta ver un cliente ajeno, responde **HTTP 403 Forbidden**.
   - En `VehicleController::show` e `history`: Se valida que el vehículo pertenezca al cliente en sesión. De lo contrario responde **HTTP 403**.
   - En `OrderController::index` y `show`: Los clientes solo pueden visualizar órdenes asociadas a sus vehículos. Intentos de consulta ajenos responden **HTTP 403**.

---

### 4. Trazabilidad y Registro de Auditoría (`audit_logs`)

La tabla `audit_logs` registra automáticamente:
- **`login`:** Conexión exitosa con ID de usuario, IP y User-Agent.
- **`login_failed`:** Intentos fallidos por contraseña errónea o usuario inexistente.
- **`logout`:** Cierre de sesión y revocación del token.
- **`access_denied`:** Intentos de acceso a endpoints protegidos por usuarios sin los permisos requeridos.
- **Acciones Críticas de Dominio:** Modificación de odómetro con motivo (`override_mileage`), cambios de estado de órdenes, entrega y cancelaciones.

---

### 5. Suite de Pruebas de Seguridad y RBAC

1. **`tests/Feature/Api/AuthApiTest.php`:**
   - `test_user_can_login_with_valid_credentials`: Verifica emisión de Bearer token y log `login`.
   - `test_login_fails_with_invalid_credentials`: Verifica respuesta HTTP 401 y log `login_failed`.
   - `test_unauthenticated_request_is_rejected`: Verifica rechazo HTTP 401 sin token.
   - `test_authenticated_user_can_retrieve_profile`: Verifica consulta en `/me`.
   - `test_user_can_logout_and_revoke_token`: Verifica revocación en BD, log `logout` y rechazo HTTP 401 en peticiones posteriores.
2. **`tests/Feature/Api/RbacApiTest.php`:**
   - `test_unauthenticated_request_returns_401`: Petición a ruta protegida sin sesión.
   - `test_mechanic_attempting_to_access_admin_route_returns_403_and_audits`: Un mecánico intentando crear otro mecánico recibe HTTP 403 y se genera auditoría de `access_denied`.
   - `test_receptionist_cannot_delete_service_from_catalog`: Recepcionista intentando eliminar servicios recibe HTTP 403.
   - `test_client_cannot_access_mechanics_management`: Cliente intentando listar mecánicos recibe HTTP 403.
   - `test_client_cannot_view_other_clients_data`: Cliente intentando consultar datos de otro cliente recibe HTTP 403.
   - `test_client_can_view_own_data`: Cliente consultando sus propios datos recibe HTTP 200.
   - `test_admin_has_full_access_to_all_modules`: Administrador operando sin restricciones.
