<?php
    require 'config.php';
    require 'localize.php';
    require 'vnstat.php';

    validate_input();

    function h($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }

    function iface_label($if)
    {
        global $iface_title;

        if (isset($iface_title[$if]) && $iface_title[$if] !== '') {
            return $iface_title[$if];
        }

        return $if;
    }

    function active_view_title()
    {
        global $page, $page_title;

        return isset($page_title[$page]) ? ucfirst($page_title[$page]) : T('Summary');
    }

    function available_styles()
    {
        $styles = array();
        $entries = @scandir(__DIR__.'/themes');

        if ($entries === false) {
            return array(array('id' => DEFAULT_COLORSCHEME, 'label' => ucfirst(DEFAULT_COLORSCHEME)));
        }

        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..' || $entry === 'common.css') {
                continue;
            }

            $theme_dir = __DIR__.'/themes/'.$entry;
            if (is_dir($theme_dir) && file_exists($theme_dir.'/style.css') && file_exists($theme_dir.'/theme.php')) {
                $styles[] = array(
                    'id' => $entry,
                    'label' => ucfirst($entry)
                );
            }
        }

        if (count($styles) === 0) {
            $styles[] = array('id' => DEFAULT_COLORSCHEME, 'label' => ucfirst(DEFAULT_COLORSCHEME));
        }

        usort($styles, function ($left, $right) {
            return strcmp($left['label'], $right['label']);
        });

        return $styles;
    }

    function read_asset_manifest()
    {
        $manifest_path = __DIR__.'/dist/manifest.json';
        if (!file_exists($manifest_path)) {
            return null;
        }

        $manifest = json_decode(file_get_contents($manifest_path), true);
        if (!is_array($manifest) || !isset($manifest['src/main.tsx'])) {
            return null;
        }

        return $manifest['src/main.tsx'];
    }

    function render_react_assets($manifest_entry)
    {
        if (!is_array($manifest_entry)) {
            return;
        }

        if (isset($manifest_entry['css']) && is_array($manifest_entry['css'])) {
            foreach ($manifest_entry['css'] as $css_file) {
                print '  <link rel="stylesheet" href="'.h('dist/'.$css_file)."\"/>\n";
            }
        }

        if (isset($manifest_entry['file'])) {
            print '  <script type="module" src="'.h('dist/'.$manifest_entry['file'])."\"></script>\n";
        }
    }

    function bootstrap_payload()
    {
        global $iface, $page, $graph, $style, $iface_list, $page_list, $page_title;
        global $language, $byte_notation;

        $graph_labels = array(
            'large' => 'Large',
            'small' => 'Small',
            'none' => 'Hide'
        );

        $payload = array(
            'request' => array(
                'iface' => $iface,
                'page' => $page,
                'graph' => $graph,
                'style' => $style
            ),
            'language' => $language,
            'byteNotation' => $byte_notation,
            'documentTitle' => active_view_title().' - '.T('Traffic data for').' '.iface_label($iface).' ('.$iface.')',
            'options' => array(
                'ifaces' => array(),
                'pages' => array(),
                'graphs' => array(),
                'styles' => available_styles()
            ),
            'endpoints' => array(
                'data' => 'json.php',
                'legacyGraph' => 'graph_svg.php'
            ),
            'labels' => array(
                'interfaces' => T('Interfaces'),
                'views' => T('Views'),
                'settings' => T('Settings'),
                'themes' => T('Themes'),
                'chartSize' => T('Chart size'),
                'showSettings' => T('Show settings'),
                'hideSettings' => T('Hide settings'),
                'overview' => T('Overview'),
                'details' => T('Details'),
                'visualization' => T('Visualization'),
                'trafficChart' => T('Traffic chart'),
                'summaryTitle' => T('Summary'),
                'summaryDescription' => T('Current usage rolled up by hour, day, month and total lifetime traffic.'),
                'loading' => T('Loading traffic data...'),
                'loadingMessage' => T('Requesting the current vnStat view for this interface.'),
                'retry' => T('Retry'),
                'requestFailed' => T('Unable to load traffic data.'),
                'footer' => T('vnStat React frontend powered by the original PHP data layer.'),
                'period' => T('Period'),
                'themeWord' => T('Theme'),
                'summaryView' => T('Summary view'),
                'compactChart' => T('Compact chart'),
                'fullChart' => T('Full chart'),
                'chartHidden' => T('Chart hidden'),
                'noTrafficDataTitle' => T('No traffic data yet'),
                'noTrafficDataMessage' => T('vnStat returned no current counters for this interface.'),
                'noChartDataTitle' => T('No chart data available'),
                'noChartDataMessage' => T('vnStat has not returned enough samples to draw this time range yet.'),
                'topDaysChartDescription' => T('Peak traffic days rendered as an interactive chart for quick comparison.'),
                'in' => T('In'),
                'out' => T('Out'),
                'total' => T('Total')
            )
        );

        foreach ($iface_list as $if) {
            $payload['options']['ifaces'][] = array(
                'id' => $if,
                'label' => iface_label($if),
                'meta' => $if
            );
        }

        foreach ($page_list as $pg) {
            $payload['options']['pages'][] = array(
                'id' => $pg,
                'label' => isset($page_title[$pg]) ? ucfirst($page_title[$pg]) : $pg
            );
        }

        foreach ($graph_labels as $graph_key => $graph_label) {
            $payload['options']['graphs'][] = array(
                'id' => $graph_key,
                'label' => $graph_label
            );
        }

        return $payload;
    }

    $manifest_entry = read_asset_manifest();
    $bootstrap = bootstrap_payload();

    header('Content-type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="<?php echo h(strtolower(substr($language, 0, 2))); ?>">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title><?php echo h($bootstrap['documentTitle']); ?></title>
  <meta name="description" content="React-based vnStat traffic dashboard with PHP-backed data endpoints."/>
  <link id="theme-stylesheet" rel="stylesheet" href="themes/<?php echo h($style); ?>/style.css"/>
<?php render_react_assets($manifest_entry); ?>
</head>
<body>
  <?php if ($manifest_entry === null) { ?>
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
