import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const appUrl = env.APP_URL || 'http://localhost';
    const appHost = env.VITE_ASSET_HOST || new URL(appUrl).hostname;
    const appProtocol = env.VITE_ASSET_PROTOCOL || new URL(appUrl).protocol.replace(':', '');
    const devServerPort = Number(env.VITE_PORT || '5173');
    const isSecure = appProtocol === 'https';

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: 'resources/js/ssr.tsx',
                refresh: true,
            }),
            react(),
            tailwindcss(),
        ],
        esbuild: {
            jsx: 'automatic',
        },
        resolve: {
            alias: {
                'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            },
        },
        server: {
            host: '0.0.0.0',
            port: devServerPort,
            strictPort: true,
            origin: `${appProtocol}://${appHost}`,
            cors: {
                origin: true,
                credentials: true,
            },
            hmr: {
                host: appHost,
                protocol: isSecure ? 'wss' : 'ws',
                clientPort: isSecure ? 443 : devServerPort,
            },
        },
    };
});
