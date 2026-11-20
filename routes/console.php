<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment('Mecánica de barrio. Bien hecha.');
})->purpose('Muestra una frase inspiradora del taller');
