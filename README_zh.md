# vnStat PHP Frontend React

一个基于 React 前端和 PHP 数据层的现代化 vnStat 面板。

## 项目结构

- 页面入口：`index.html`
- 数据接口：`api/traffic.php`
- 前端源码：`src/`
- PHP 内部模块：`app/`
- 主题目录：`themes/light`、`themes/dark`

## 运行要求

- 已安装 `vnstat`，并且已经开始采集流量
- 支持 PHP 的 Web 服务器
- 只有在你要重新构建前端时，才需要 Node.js 和 npm

## 安装步骤

1. 把仓库放到网站目录中。
2. 修改 `config.php`。
3. 如果你改过前端代码，重新构建：

```bash
npm install
npm run build
```

4. 浏览器访问 `index.html`，或者访问已经映射到该静态入口的站点根路径。

## 部署说明

运行时职责：

- Nginx 负责提供 `index.html`、`dist/`、`themes/` 等静态文件
- PHP-FPM 负责执行 `api/traffic.php`
- PHP 在请求时调用 `vnstat` 读取流量数据

构建时职责：

- 只有执行 `npm install` 和 `npm run build` 时才需要 Node.js
- 构建完成后，把生成的 `dist/` 和 PHP 文件一起部署即可

### 推荐目录结构

例如部署到：

```text
/var/www/vnstat/
```

该目录下至少要有：

- `index.html`
- `index.php`
- `api/`
- `app/`
- `dist/`
- `themes/`
- `lang/`
- `config.php`

### Nginx 配置示例

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

如果还要做 80 到 443 的跳转，再单独加一个监听 80 的 server block。

### PHP-FPM 说明

常规 PHP-FPM 即可。PHP 7.4 可能能跑，但更建议使用仍在支持期内的 PHP 版本。

PHP-FPM 至少需要能访问：

- `api/traffic.php`
- `config.php`
- `app/`
- `lang/`
- `config.php` 中配置的 `vnstat` 可执行文件

### 文件权限

如果打开就是 `403 Forbidden`，先查权限，不要先怀疑 React 或 PHP 代码。

常见安全权限：

```bash
sudo find /var/www/vnstat -type d -exec chmod 755 {} \;
sudo find /var/www/vnstat -type f -exec chmod 644 {} \;
sudo chown -R www-data:www-data /var/www/vnstat
```

还要确认上级目录对 Nginx 用户可遍历：

```bash
ls -ld /var /var/www /var/www/vnstat
```

目录至少要给 Web 用户执行权限，否则即使文件存在也会 403。

### 部署步骤示例

典型部署流程：

```bash
cd /var/www/vnstat
npm install
npm run build
sudo systemctl reload nginx
sudo systemctl reload php7.4-fpm
```

如果你是在本地或 CI 构建，也可以只把生成好的 `dist/` 连同 PHP 文件一起上传到服务器。

## 配置说明

主要配置都在 `config.php`：

- `locale`：日期格式化使用的 locale
- `language`：界面语言，例如 `cn`、`en`、`nl`
- `ifaceList`：vnStat 端口列表
- `ifaceTitle`：端口显示名称
- `vnstatBin`：`vnstat` 可执行文件路径
- `dataDir`：dump 文件回退目录
- `byteNotation`：强制流量单位，或保持 `null`
- `defaultStyle`：默认主题，当前为 `light`
- `pageList`：可用视图，`h`、`d`、`m`、`s`
- `styleList`：可用主题，当前为 `light`、`dark`

## 访问参数

当前页面仍然使用查询参数：

- `if`：端口
- `page`：`s`、`h`、`d`、`m`
- `style`：`light` 或 `dark`

示例：

```text
/index.html?if=eth0&page=d&style=light
```

旧的 `index.php` 链接会保留查询参数并重定向到 `index.html`。

React 前端使用的数据接口：

```text
/api/traffic.php?if=eth0&page=d&style=light&format=app
```

React 首次启动时会先请求 bootstrap：

```text
/api/traffic.php?if=eth0&page=d&style=light&format=bootstrap
```

## 前端构建

如果你修改了 `src/` 下的 React 代码，需要重新构建：

```bash
npm install
npm run build
```

仓库已经包含 `dist/`，但只要前端源码有变化，就需要重新 build 后再部署。

## 常见问题

### 打开就是 403 Forbidden

如果站点一打开就是 `403`，按这个顺序查：

1. `root` 是否真的指向包含 `index.html` 的项目目录。
2. `index` 是否写成了 `index index.html index.php;`，而不是只有 `index.php`。
3. `location /` 是否包含 `try_files $uri $uri/ /index.html?$query_string;`。
4. 项目目录和上级目录是否对 Nginx 用户可读、可遍历。
5. `dist/manifest.json` 和 `dist/assets/` 是否已经构建出来。
6. `fastcgi_pass` 指向的 PHP-FPM socket 是否真实存在。

建议直接跑这些检查：

```bash
ls -lah /var/www/vnstat
ls -lah /var/www/vnstat/dist
php -l /var/www/vnstat/api/traffic.php
sudo nginx -t
```

如果 `/index.php` 能打开，但 `/` 返回 403，通常不是应用代码问题，而是 Nginx 的 `index` 或 `try_files` 配置问题。

### 页面没有流量数据

先确认 vnStat 对应端口能返回数据：

```bash
vnstat --json -i eth0
```

如果代码已经部署，但页面还是旧内容，通常是 PHP opcache 没刷新，需要重载 PHP-FPM 或 Web 服务。

### 端口名不对

很多新系统不再使用 `eth0`，先查看实际端口名：

```bash
vnstat --iflist
```

然后把 `config.php` 里的 `ifaceList` 和 `ifaceTitle` 改成真实值。

## 许可证

本项目继续沿用上游 vnStat PHP frontend 的 GPL 许可，详见 `COPYING`。
