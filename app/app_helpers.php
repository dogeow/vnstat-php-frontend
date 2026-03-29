<?php
    function app_iface_label($ifaceId, array $appConfig)
    {
        $ifaceTitle = isset($appConfig['ifaceTitle']) && is_array($appConfig['ifaceTitle'])
            ? $appConfig['ifaceTitle']
            : [];

        if (isset($ifaceTitle[$ifaceId]) && $ifaceTitle[$ifaceId] !== '') {
            return $ifaceTitle[$ifaceId];
        }

        return $ifaceId;
    }

    function app_page_order_map()
    {
        return [
            'h' => 0,
            'd' => 1,
            'm' => 2,
            's' => 3,
        ];
    }

    function app_page_ids(array $appConfig)
    {
        $pageOrder = app_page_order_map();
        $configuredPages = isset($appConfig['pageList']) && is_array($appConfig['pageList'])
            ? $appConfig['pageList']
            : array_keys($pageOrder);
        $pageIds = [];

        foreach ($configuredPages as $pageId) {
            if (!isset($pageOrder[$pageId]) || in_array($pageId, $pageIds, true)) {
                continue;
            }

            $pageIds[] = $pageId;
        }

        if ($pageIds === []) {
            return array_keys($pageOrder);
        }

        usort($pageIds, function ($left, $right) use ($pageOrder) {
            return $pageOrder[$left] <=> $pageOrder[$right];
        });

        return $pageIds;
    }

    function app_active_view_title($page, array $pageTitle)
    {
        return isset($pageTitle[$page]) ? ucfirst($pageTitle[$page]) : __('Summary');
    }

    function app_document_title($ifaceId, $page, array $pageTitle, array $appConfig)
    {
        return app_active_view_title($page, $pageTitle)
            .' - '
            .__('Traffic data for')
            .' '
            .app_iface_label($ifaceId, $appConfig)
            .' ('
            .$ifaceId
            .')';
    }

    function app_json_response($payload)
    {
        header('Content-type: application/json; charset=utf-8');
        echo json_encode($payload);
        exit;
    }

    function app_kbytes_to_string($kb, $byteNotation = null)
    {
        $units = ['TB', 'GB', 'MB', 'KB'];
        $targetIndex = $byteNotation !== null ? array_search($byteNotation, $units, true) : false;

        if ($targetIndex !== false) {
            $scale = 1024 ** (count($units) - $targetIndex - 1);
            return sprintf('%0.2f %s', ($kb / $scale), $units[$targetIndex]);
        }

        $scale = 1024 ** (count($units) - 1);
        $unitIndex = 0;
        $maxIndex = count($units) - 1;

        while ($kb < $scale && $scale > 1 && $unitIndex < $maxIndex) {
            $unitIndex++;
            $scale = $scale / 1024;
        }

        return sprintf('%0.2f %s', ($kb / $scale), $units[$unitIndex]);
    }
