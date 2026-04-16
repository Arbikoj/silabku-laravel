<?php
$logPath = __DIR__ . '/storage/logs/laravel.log';
if (!file_exists($logPath)) die("No log.");
$lines = file($logPath);
$count = count($lines);
$errors = [];
for ($i = $count - 1; $i >= max(0, $count - 500); $i--) {
    if (strpos($lines[$i], 'local.ERROR:') !== false) {
        $errors[] = $lines[$i];
    }
}
print_r($errors);
