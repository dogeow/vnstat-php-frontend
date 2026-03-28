<?php
    function vnstat_request_page_title_map()
    {
        return [
            's' => __('summary'),
            'h' => __('hours'),
            'd' => __('days'),
            'm' => __('months'),
        ];
    }

    function vnstat_request_query_param(array $query, $key)
    {
        return isset($query[$key]) ? trim((string) $query[$key]) : '';
    }

    function vnstat_request_validate(array $query, array $appConfig)
    {
        $pageList = isset($appConfig['pageList']) ? $appConfig['pageList'] : ['s', 'h', 'd', 'm'];
        $graphList = isset($appConfig['graphList']) ? $appConfig['graphList'] : ['small'];
        $styleList = isset($appConfig['styleList']) ? $appConfig['styleList'] : ['light', 'dark'];
        $ifaceList = isset($appConfig['ifaceList']) ? $appConfig['ifaceList'] : [];
        $defaultStyle = isset($appConfig['defaultStyle']) ? $appConfig['defaultStyle'] : 'light';

        $request = [
            'page' => vnstat_request_query_param($query, 'page'),
            'iface' => vnstat_request_query_param($query, 'if'),
            'graph' => vnstat_request_query_param($query, 'graph'),
            'style' => vnstat_request_query_param($query, 'style'),
        ];

        if (!in_array($request['page'], $pageList, true)) {
            $request['page'] = $pageList[0];
        }

        if (!in_array($request['iface'], $ifaceList, true)) {
            $request['iface'] = $ifaceList[0];
        }

        if (!in_array($request['graph'], $graphList, true)) {
            $request['graph'] = $graphList[0];
        }

        $themeDir = dirname(__DIR__).'/themes/'.$request['style'];
        if (
            !in_array($request['style'], $styleList, true)
            || !is_dir($themeDir)
            || !is_file($themeDir.'/theme.php')
            || preg_match('/^[a-z0-9-_]+$/i', $request['style']) !== 1
        ) {
            $request['style'] = $defaultStyle;
        }

        return $request;
    }
