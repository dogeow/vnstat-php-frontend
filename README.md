# vnStat PHP Frontend React

A modern vnStat dashboard with a React frontend and a small PHP backend.

## Overview

- Page entry: `index.html`
- Data API: `api/traffic.php`
- Frontend source: `src/`
- Internal PHP helpers: `app/`
- Themes: `themes/light`, `themes/dark`

`index.php` is kept only as a compatibility redirect to `index.html`.

## Requirements

- `vnstat` installed and already collecting traffic data
- PHP-enabled web server
- Node.js and npm only if you want to rebuild the frontend bundle

You do not need Node.js at runtime if `dist/` is already built.

## Install

1. Put the repository inside your web root.
2. Edit `config.php`.
3. If you changed frontend code, build the React bundle:

```bash
npm install
npm run build
```

4. Open `index.html` in the browser, or use the site root if your web server maps it there.

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
