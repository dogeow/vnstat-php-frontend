<?php
    $appConfig = require __DIR__.'/config.php';

    require_once __DIR__.'/app/app_localize.php';
    require_once __DIR__.'/app/vnstat_request.php';
    require_once __DIR__.'/app/vnstat_data_helpers.php';
    require_once __DIR__.'/app/react_shell_helpers.php';

    $appConfig['language'] = app_localize_load($appConfig['locale'], $appConfig['language']);
    $pageTitle = vnstat_request_page_title_map();
    $request = vnstat_request_validate($_GET, $appConfig);
    $manifestEntry = react_shell_read_manifest_entry();
    $bootstrap = react_shell_build_bootstrap_payload($request, $appConfig, $pageTitle);
    $htmlLang = react_shell_escape(strtolower(substr($appConfig['language'], 0, 2)));
    $themeStyle = react_shell_escape($request['style']);

    header('Content-type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="<?php echo $htmlLang; ?>">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title><?php echo react_shell_escape($bootstrap['documentTitle']); ?></title>
  <meta name="description" content="React-based vnStat traffic dashboard with PHP-backed data endpoints."/>
  <link id="theme-stylesheet" rel="stylesheet" href="themes/<?php echo $themeStyle; ?>/style.css"/>
<?php react_shell_render_assets($manifestEntry); ?>
</head>
<body>
  <?php if ($manifestEntry === null) { ?>
  <main class="build-warning">
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Build required</p>
          <h2>React assets are missing</h2>
        </div>
      </div>
      <div class="empty-state">
        <h3>The PHP shell is ready, but the frontend bundle has not been built yet.</h3>
        <p>Install Node dependencies and build the React app before loading this page in production.</p>
      </div>
      <pre>npm install
npm run build</pre>
    </section>
  </main>
  <?php } ?>
  <div id="app-root"></div>
  <script>
    window.__VNSTAT_BOOTSTRAP__ = <?php echo json_encode($bootstrap, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
  </script>
  <noscript>
    <main class="build-warning">
      <section class="panel">
        <div class="empty-state">
          <h3>JavaScript is required</h3>
          <p>The React frontend needs JavaScript enabled to render the vnStat dashboard.</p>
        </div>
      </section>
    </main>
  </noscript>
</body>
</html>
