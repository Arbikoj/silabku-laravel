# Docker + Cloudflare Tunnel (labsd.web.id)

Dokumen ini menjelaskan cara menjalankan project **Silabku** lewat **Cloudflare Tunnel** menggunakan Docker Compose.

## Prasyarat

- Domain sudah ada di Cloudflare: `labsd.web.id`
- Cloudflare Zero Trust aktif (menu **Access > Tunnels**)
- Docker & Docker Compose terpasang di server

## 1) Buat Tunnel & Hostname di Cloudflare

1. Cloudflare Dashboard → **Zero Trust** → **Networks > Tunnels**
2. **Create a tunnel**
3. Pilih konektor **Docker** (atau copy token tunnel)
4. Di pengaturan Tunnel, buat **Public Hostname**:
   - Hostname: `labsd.web.id`
   - Service: `http://silabku_web:80`

Catatan: `silabku_web` adalah nama service Nginx pada `docker-compose.yml`.

## 2) Isi environment di server

Di server, buat/isi `.env`. Disarankan mulai dari template `C:\Users\Arbi J\project\laravel\silabku\.env.deploy.example`, lalu sesuaikan.

Minimal bagian ini:

- `APP_URL=https://labsd.web.id`
- `VITE_APP_URL=https://labsd.web.id`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `CLOUDFLARE_TUNNEL_TOKEN=...` (token dari Cloudflare)

Jika di server sudah ada aplikasi lain yang memakai port 80, ubah:

- `WEB_PORT=8081` (atau port lain yang kosong)

## 3) Jalankan Docker Compose

Untuk mode server (tanpa Vite dev server):

```bash
docker compose up -d --build
```

Untuk mode development (ikut Vite container):

```bash
docker compose --profile dev up -d --build
```

## Catatan penting (deployment)

- Secara default container `app` hanya menjalankan `php artisan migrate --force` saat startup.
- Untuk development lokal kalau ingin reset DB + seed, set di `.env`:
  - `APP_STARTUP_ARTISAN_COMMAND=migrate:fresh --seed --force`

## Troubleshooting singkat

- Tunnel jalan tapi domain tidak bisa diakses:
  - cek `CLOUDFLARE_TUNNEL_TOKEN` sudah benar
  - pastikan **Public Hostname** `labsd.web.id` mengarah ke `http://silabku_web:80`
- Jika container `tunnel` restart terus:
  - lihat log: `docker compose logs -f tunnel`
