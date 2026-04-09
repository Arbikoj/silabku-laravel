# ===========================================
# Stage 1: Build frontend assets (Node.js)
# ===========================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy package files for dependency cache
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source and build
COPY . .
ARG VITE_APP_URL
ENV VITE_APP_URL=${VITE_APP_URL}
RUN npm run build

# ===========================================
# Stage 2: Build PHP app (production)
# ===========================================
FROM php:8.4-fpm-alpine AS app

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    icu-dev \
    postgresql-dev \
    linux-headers

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    zip \
    bcmath \
    pcntl \
    exif \
    gd \
    mbstring \
    intl

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files and install PHP dependencies (no dev)
COPY composer.json composer.lock ./
RUN composer install \
    --optimize-autoloader \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist

# Copy the rest of the application
COPY . .

# Copy frontend build output from frontend-builder stage
COPY --from=frontend-builder /app/public/build ./public/build

# Create required directories and set permissions BEFORE running artisan
RUN mkdir -p /var/www/html/bootstrap/cache \
    && mkdir -p /var/www/html/storage/framework/cache \
    && mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && mkdir -p /var/www/html/storage/logs \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Run composer post-install scripts (needs bootstrap/cache to exist)
RUN composer run-script post-autoload-dump

# Set ownership
RUN chown -R www-data:www-data /var/www/html

# Copy & set entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["/entrypoint.sh"]
