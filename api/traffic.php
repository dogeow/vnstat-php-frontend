<?php
    $appConfig = require __DIR__.'/../config.php';

    require_once __DIR__.'/../app/app_localize.php';
    require_once __DIR__.'/../app/vnstat_request.php';
    require_once __DIR__.'/../app/vnstat_data_helpers.php';
    require_once __DIR__.'/../app/json_api_helpers.php';
    require_once __DIR__.'/../app/react_shell_helpers.php';

    $appConfig['language'] = app_localize_load($appConfig['locale'], $appConfig['language']);
    $pageTitle = vnstat_request_page_title_map();
    $request = vnstat_request_validate($_GET, $appConfig);
    $format = isset($_GET['format']) ? trim((string) $_GET['format']) : '';

    if ($format === 'bootstrap') {
        app_json_response(react_shell_build_bootstrap_payload($request, $appConfig, $pageTitle));
    }

    $trafficData = vnstat_data_fetch($request['iface'], $appConfig);

    if ($format === 'app') {
        app_json_response(json_api_build_app_payload($request, $appConfig, $pageTitle, $trafficData));
    }

    switch ($request['page']) {
        case 's':
            app_json_response(json_api_summary_legacy_payload($trafficData));
            break;
        case 'h':
            app_json_response(['hours' => $trafficData['hour']]);
            break;
        case 'd':
            app_json_response(['days' => $trafficData['day']]);
            break;
        case 'm':
            app_json_response(['months' => $trafficData['month']]);
            break;
    }
