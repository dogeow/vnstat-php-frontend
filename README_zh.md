# vnStat PHP Frontend React

一个基于 React 前端和 PHP 数据层的现代化 vnStat 面板。

## 项目结构

这个项目保留了 vnStat 的 PHP 取数逻辑，只把界面改成了 React。

- 页面入口：`index.php`
- 数据接口：`api/traffic.php`
- 前端源码：`src/`
- PHP 内部模块：`app/`
- 主题目录：`themes/light`、`themes/dark`

当前界面已适配手机端，应用内图表尺寸固定为 `small`。

## 运行要求

- 已安装 `vnstat`，并且已经开始采集流量
- 支持 PHP 的 Web 服务器
- 只有在你要重新构建前端时，才需要 Node.js 和 npm

如果仓库里的 `dist/` 已经存在，线上运行时不需要 Node.js。

## 安装步骤

1. 把仓库放到网站目录中。
2. 修改 `config.php`。
3. 如果你改过前端代码，重新构建：

```bash
npm install
npm run build
```

4. 浏览器访问 `index.php`。

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
- `pageList`：可用视图，`s`、`h`、`d`、`m`
- `graphList`：当前固定为 `small`
- `styleList`：可用主题，当前为 `light`、`dark`

## 访问参数

当前页面仍然使用查询参数：

- `if`：端口
- `page`：`s`、`h`、`d`、`m`
- `graph`：当前为 `small`
- `style`：`light` 或 `dark`

示例：

```text
/index.php?if=eth0&page=d&graph=small&style=light
```

React 前端使用的数据接口：

```text
/api/traffic.php?if=eth0&page=d&graph=small&style=light&format=app
```

## 前端构建

如果你修改了 `src/` 下的 React 代码，需要重新构建：

```bash
npm install
npm run build
```

仓库已经包含 `dist/`，但只要前端源码有变化，就需要重新 build 后再部署。

## 常见问题

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
