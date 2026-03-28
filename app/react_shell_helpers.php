<?php
    require_once __DIR__.'/app_helpers.php';

    function react_shell_escape($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }

    function react_shell_build_style_options(array $appConfig)
    {
        $styles = [];
        $rootDir = dirname(__DIR__);
        $styleList = isset($appConfig['styleList']) ? $appConfig['styleList'] : [];
        $styleLabels = [
            'light' => __('Light'),
            'dark' => __('Dark'),
        ];

        foreach ($styleList as $styleId) {
            $themeDir = $rootDir.'/themes/'.$styleId;
            if (!is_dir($themeDir) || !is_file($themeDir.'/style.css') || !is_file($themeDir.'/theme.php')) {
                continue;
            }

            $styles[] = [
                'id' => $styleId,
                'label' => isset($styleLabels[$styleId]) ? $styleLabels[$styleId] : ucfirst($styleId),
            ];
        }

        if ($styles === []) {
            $defaultStyle = isset($appConfig['defaultStyle']) ? $appConfig['defaultStyle'] : 'light';
            $styles[] = [
                'id' => $defaultStyle,
                'label' => isset($styleLabels[$defaultStyle]) ? $styleLabels[$defaultStyle] : ucfirst($defaultStyle),
            ];
        }

        return $styles;
    }

    function react_shell_read_manifest_entry()
    {
        $manifestPath = dirname(__DIR__).'/dist/manifest.json';
        if (!is_file($manifestPath)) {
            return null;
        }

        $manifest = json_decode(file_get_contents($manifestPath), true);
        if (!is_array($manifest) || !isset($manifest['src/main.tsx'])) {
            return null;
        }

        return $manifest['src/main.tsx'];
    }

    function react_shell_render_assets($manifestEntry)
    {
        if (!is_array($manifestEntry)) {
            return;
        }

        if (isset($manifestEntry['css']) && is_array($manifestEntry['css'])) {
            foreach ($manifestEntry['css'] as $cssFile) {
                echo '  <link rel="stylesheet" href="'.react_shell_escape('dist/'.$cssFile)."\"/>\n";
            }
        }

        if (isset($manifestEntry['file'])) {
            echo '  <script type="module" src="'.react_shell_escape('dist/'.$manifestEntry['file'])."\"></script>\n";
        }
    }

    function react_shell_build_bootstrap_payload(array $request, array $appConfig, array $pageTitle)
    {
        $graphLabelMap = [
            'large' => 'Large',
            'small' => 'Small',
            'none' => 'Hide',
        ];
        $pageOrder = [
            'h' => 0,
            'd' => 1,
            'm' => 2,
            's' => 3,
        ];
        $activeViewTitle = app_active_view_title($request['page'], $pageTitle);
        $documentTitle = app_document_title($request['iface'], $request['page'], $pageTitle, $appConfig);

        $payload = [
            'request' => $request,
            'language' => isset($appConfig['language']) ? $appConfig['language'] : 'en',
            'byteNotation' => isset($appConfig['byteNotation']) ? $appConfig['byteNotation'] : null,
            'documentTitle' => $documentTitle,
            'options' => [
                'ifaces' => [],
                'pages' => [],
                'graphs' => [],
                'styles' => react_shell_build_style_options($appConfig),
            ],
            'endpoints' => [
                'data' => 'api/traffic.php',
            ],
            'labels' => [
                'interfaces' => __('Interfaces'),
                'views' => __('Views'),
                'settings' => __('Settings'),
                'themes' => __('Themes'),
                'chartSize' => __('Chart size'),
                'showSettings' => __('Show settings'),
                'hideSettings' => __('Hide settings'),
                'overview' => __('Overview'),
                'details' => __('Details'),
                'visualization' => __('Visualization'),
                'trafficChart' => __('Traffic chart'),
                'summaryTitle' => __('Summary'),
                'loading' => __('Loading traffic data...'),
                'loadingMessage' => __('Requesting the current vnStat view for this interface.'),
                'retry' => __('Retry'),
                'requestFailed' => __('Unable to load traffic data.'),
                'footer' => __('vnStat React frontend powered by the original PHP data layer.'),
                'period' => __('Period'),
                'themeWord' => __('Theme'),
                'summaryView' => __('Summary view'),
                'compactChart' => __('Compact chart'),
                'fullChart' => __('Full chart'),
                'chartHidden' => __('Chart hidden'),
                'noTrafficDataTitle' => __('No traffic data yet'),
                'noTrafficDataMessage' => __('vnStat returned no current counters for this interface.'),
                'noChartDataTitle' => __('No chart data available'),
                'noChartDataMessage' => __('vnStat has not returned enough samples to draw this time range yet.'),
                'topDaysChartDescription' => __('Peak traffic days rendered as an interactive chart for quick comparison.'),
                'in' => __('In'),
                'out' => __('Out'),
                'total' => __('Total'),
            ],
            'meta' => [
                'ifaceTitle' => app_iface_label($request['iface'], $appConfig),
                'viewTitle' => $activeViewTitle,
            ],
        ];

        foreach (isset($appConfig['ifaceList']) ? $appConfig['ifaceList'] : [] as $ifaceId) {
            $payload['options']['ifaces'][] = [
                'id' => $ifaceId,
                'label' => app_iface_label($ifaceId, $appConfig),
                'meta' => $ifaceId,
            ];
        }

        foreach (isset($appConfig['pageList']) ? $appConfig['pageList'] : [] as $pageId) {
            $payload['options']['pages'][] = [
                'id' => $pageId,
                'label' => isset($pageTitle[$pageId]) ? ucfirst($pageTitle[$pageId]) : $pageId,
            ];
        }

        usort($payload['options']['pages'], function ($left, $right) use ($pageOrder) {
            $leftRank = isset($pageOrder[$left['id']]) ? $pageOrder[$left['id']] : 99;
            $rightRank = isset($pageOrder[$right['id']]) ? $pageOrder[$right['id']] : 99;

            return $leftRank <=> $rightRank;
        });

        foreach (isset($appConfig['graphList']) ? $appConfig['graphList'] : [] as $graphId) {
            $payload['options']['graphs'][] = [
                'id' => $graphId,
                'label' => isset($graphLabelMap[$graphId]) ? $graphLabelMap[$graphId] : ucfirst($graphId),
            ];
        }

        return $payload;
    }
