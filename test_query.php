<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apps = \App\Models\Application::with('event')->where('status', 'approved')->get();
foreach ($apps as $a) {
    echo 'App: ' . $a->id . ' user: ' . $a->user_id . ' Event: ' . ($a->event ? $a->event->id . ' Sem: ' . $a->event->semester_id : 'null') . PHP_EOL;
}
