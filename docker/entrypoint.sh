#!/bin/sh
set -e

echo "==> Waiting for PostgreSQL to be ready..."
until php -r "
try {
    \$pdo = new PDO(
        'pgsql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD')
    );
    echo 'Connected!';
} catch (Exception \$e) {
    exit(1);
}
" 2>/dev/null; do
    echo "Waiting for database connection..."
    sleep 2
done

echo "==> Database is ready!"

echo "==> Syncing public assets to shared volume..."
cp -a /var/www/html/public/. /var/www/html/public-shared/

echo "==> Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Starting PHP-FPM..."
exec php-fpm
