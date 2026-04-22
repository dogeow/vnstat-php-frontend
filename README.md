# vnStat PHP Frontend React

A modern vnStat dashboard with a React frontend and a small PHP backend.

## Overview

- Page entry: `index.html`
- Data API: `api/traffic.php`
- Frontend source: `src/`
- Internal PHP helpers: `app/`
- Themes: `themes/light`, `themes/dark`

## Requirements

- `vnstat` installed and already collecting traffic data
- PHP-enabled web server
- Node.js and npm only if you want to rebuild the frontend bundle

## Install

1. Put the repository inside your web root.
2. Edit `config.php`.
3. If you changed frontend code, build the React bundle:

```bash
npm install
npm run build
```

4. Open `index.html` in the browser, or use the site root if your web server maps it there.

## Deployment

Runtime responsibilities:

- Nginx serves `index.html`, `dist/`, and `themes/`
- PHP-FPM executes `api/traffic.php`
- `vnstat` is called by PHP to read traffic data

Build responsibilities:

- Use Node.js and npm only when you run `npm install` and `npm run build`
- After build, deploy the generated `dist/` folder together with the PHP files

### Suggested production layout

Example deployment path:

```text
/var/www/vnstat/
```

That directory should contain at least:

- `index.html`
- `index.php`
- `api/`
- `app/`
- `dist/`
- `themes/`
- `lang/`
- `config.php`

### Nginx example

```nginx
server {
    listen 443 ssl http2;
    server_name vnstat.example.com;

    root /var/www/vnstat;
    index index.html index.php;
    charset utf-8;

    ssl_certificate /root/.acme.sh/example.com_ecc/fullchain.cer;
    ssl_certificate_key /root/.acme.sh/example.com_ecc/example.com.key;
    ssl_client_certificate /root/.acme.sh/example.com_ecc/ca.cer;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    location / {
        try_files $uri $uri/ /index.html?$query_string;
    }

    location ~ \.php$ {
        try_files $uri =404;
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 7d;
        access_log off;
    }
}
```

If you want HTTP to HTTPS redirection, add a separate port 80 server block.

### PHP-FPM

Any normal PHP-FPM setup is fine. PHP 7.4 may work, but a newer supported PHP version is recommended.

What PHP-FPM must be able to access:

- `api/traffic.php`
- `config.php`
- `app/`
- `lang/`
- the `vnstat` binary configured in `config.php`

### File permissions

If you see `403 Forbidden`, check permissions before anything else.

Typical safe permissions:

```bash
sudo find /var/www/vnstat -type d -exec chmod 755 {} \;
sudo find /var/www/vnstat -type f -exec chmod 644 {} \;
sudo chown -R www-data:www-data /var/www/vnstat
```

Also make sure the parent directories are searchable by Nginx:

```bash
ls -ld /var /var/www /var/www/vnstat
```

The web server user needs execute permission on each directory in that path.

### Deployment steps

Typical production flow:

```bash
cd /var/www/vnstat
npm install
npm run build
sudo systemctl reload nginx
sudo systemctl reload php7.4-fpm
```

If you build elsewhere, copy the built `dist/` folder to the server together with the PHP files.

## Configuration

Main options live in `config.php`:

- `locale`: locale used for date formatting
- `language`: UI language, for example `cn`, `en`, `nl`
- `ifaceList`: list of vnStat interfaces
- `ifaceTitle`: display names for interfaces
- `vnstatBin`: path to the `vnstat` binary
- `dataDir`: fallback directory for dump files
- `byteNotation`: force a preferred unit or leave `null`
- `defaultStyle`: default theme, currently `light`
- `pageList`: available views, `h`, `d`, `m`, `s`
- `styleList`: available themes, currently `light`, `dark`

## URLs

The UI still uses query parameters:

- `if`: interface
- `page`: `s`, `h`, `d`, `m`
- `style`: `light` or `dark`

Example:

```text
/index.html?if=eth0&page=d&style=light
```

Legacy links that still point at `index.php` are redirected to `index.html` with the same query string.

The app data endpoint is:

```text
/api/traffic.php?if=eth0&page=d&style=light&format=app
```

The bootstrap endpoint used before the app renders is:

```text
/api/traffic.php?if=eth0&page=d&style=light&format=bootstrap
```

## Development

Frontend commands:

```bash
npm install
npm run build
```

The repository already includes built assets in `dist/`, but if you change anything in `src/`, rebuild before deployment.

## Troubleshooting

### 403 Forbidden

If opening the site returns `403`, check these items in order:

1. `root` points to the project directory that contains `index.html`.
2. Nginx uses `index index.html index.php;` instead of only `index.php`.
3. The `location /` block includes `try_files $uri $uri/ /index.html?$query_string;`.
4. The project files and parent directories are readable and searchable by the Nginx user.
5. `dist/manifest.json` and `dist/assets/` exist after build.
6. PHP-FPM socket path is correct, for example `/var/run/php/php7.4-fpm.sock`.

Useful checks:

```bash
ls -lah /var/www/vnstat
ls -lah /var/www/vnstat/dist
php -l /var/www/vnstat/api/traffic.php
sudo nginx -t
```

If `/index.php` works but `/` returns `403`, the problem is usually the Nginx `index` or `try_files` configuration, not the application code.

### No traffic data

Check that vnStat works for the configured interface:

```bash
vnstat --json -i eth0
```

If the page still shows old behavior after deployment, refresh PHP opcache or restart PHP-FPM / the web server.

### Wrong interface name

Many modern systems no longer use `eth0`. Verify the actual name:

```bash
vnstat --iflist
```

Then update `ifaceList` and `ifaceTitle` in `config.php`.

## License

This project continues to use the original GPL licensing terms from the upstream vnStat PHP frontend. See `COPYING`.
