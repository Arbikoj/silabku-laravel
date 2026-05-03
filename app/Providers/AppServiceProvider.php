<?php

namespace App\Providers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->bound('request')) {
            /** @var Request $request */
            $request = app('request');
            $forwardedProto = $request->headers->get('x-forwarded-proto');

            if (!empty($forwardedProto)) {
                $publicRoot = $forwardedProto.'://'.$request->getHost();

                URL::forceRootUrl($publicRoot);
                URL::forceScheme($forwardedProto);
            }
        }

        // Serve Vite assets via relative paths so the app works behind
        // different hostnames (Cloudflare tunnel, localhost, custom domains).
        Vite::createAssetPathsUsing(fn (string $path) => '/'.ltrim($path, '/'));

        try {
            \Illuminate\Support\Facades\Storage::extend('google', function ($app, $config) {
                $options = [];

                if (!empty($config['teamDriveId'] ?? null)) {
                    $options['teamDriveId'] = $config['teamDriveId'];
                }

                $client = new \Google\Client();
                if (!empty($config['serviceAccountJson'])) {
                    $client->setAuthConfig(base_path($config['serviceAccountJson']));
                } else {
                    $client->setClientId($config['clientId'] ?? '');
                    $client->setClientSecret($config['clientSecret'] ?? '');
                    $client->refreshToken($config['refreshToken'] ?? '');
                }
                $client->addScope(\Google\Service\Drive::DRIVE_FILE);

                $service = new \Google\Service\Drive($client);
                $adapter = new \Masbug\Flysystem\GoogleDriveAdapter($service, $config['folderId'] ?? '', $options);
                $driver = new \League\Flysystem\Filesystem($adapter);

                return new \Illuminate\Filesystem\FilesystemAdapter($driver, $adapter);
            });
        } catch (\Exception $e) {
            // Google Drive plugin perhaps not installed or bad config. 
            // Avoid failing the entire app build.
        }
    }
}
