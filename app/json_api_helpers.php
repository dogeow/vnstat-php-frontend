<?php
    require_once __DIR__.'/app_helpers.php';

    function json_api_summary_card_record($id, $label, $rx, $tx, $byteNotation)
    {
        $total = $rx + $tx;

        return [
            'id' => $id,
            'label' => $label,
            'rx' => $rx,
            'tx' => $tx,
            'total' => $total,
            'formatted' => [
                'rx' => app_kbytes_to_string($rx, $byteNotation),
                'tx' => app_kbytes_to_string($tx, $byteNotation),
                'total' => app_kbytes_to_string($total, $byteNotation),
            ],
        ];
    }

    function json_api_detail_row_record($id, $row, $byteNotation)
    {
        $rx = isset($row['rx']) ? (float) $row['rx'] : 0;
        $tx = isset($row['tx']) ? (float) $row['tx'] : 0;
        $total = $rx + $tx;
        $label = isset($row['label']) ? $row['label'] : '';
        $shortLabel = isset($row['img_label']) && $row['img_label'] !== '' ? $row['img_label'] : $label;

        return [
            'id' => $id,
            'label' => $label,
            'shortLabel' => $shortLabel,
            'time' => isset($row['time']) ? (int) $row['time'] : 0,
            'rx' => $rx,
            'tx' => $tx,
            'total' => $total,
            'formatted' => [
                'rx' => app_kbytes_to_string($rx, $byteNotation),
                'tx' => app_kbytes_to_string($tx, $byteNotation),
                'total' => app_kbytes_to_string($total, $byteNotation),
            ],
        ];
    }

    function json_api_filtered_rows($rows, $prefix, $byteNotation)
    {
        $items = [];
        $index = 0;

        foreach ($rows as $row) {
            if (!isset($row['act']) || (int) $row['act'] !== 1) {
                continue;
            }

            $items[] = json_api_detail_row_record($prefix.'-'.$index, $row, $byteNotation);
            $index++;
        }

        return $items;
    }

    function json_api_limited_rows($rows, $prefix, $byteNotation, $limit)
    {
        return array_slice(
            json_api_filtered_rows($rows, $prefix, $byteNotation),
            0,
            $limit
        );
    }

    function json_api_build_summary_cards(array $trafficData, $byteNotation)
    {
        $cards = [];
        $summary = isset($trafficData['summary']) ? $trafficData['summary'] : [];
        $hour = isset($trafficData['hour']) ? $trafficData['hour'] : [];
        $day = isset($trafficData['day']) ? $trafficData['day'] : [];
        $month = isset($trafficData['month']) ? $trafficData['month'] : [];
        $totalRx = (isset($summary['totalrx']) ? $summary['totalrx'] : 0) * 1024 + (isset($summary['totalrxk']) ? $summary['totalrxk'] : 0);
        $totalTx = (isset($summary['totaltx']) ? $summary['totaltx'] : 0) * 1024 + (isset($summary['totaltxk']) ? $summary['totaltxk'] : 0);

        if (isset($hour[0])) {
            $cards[] = json_api_summary_card_record('hour', __('This hour'), $hour[0]['rx'], $hour[0]['tx'], $byteNotation);
        }
        if (isset($day[0])) {
            $cards[] = json_api_summary_card_record('day', __('This day'), $day[0]['rx'], $day[0]['tx'], $byteNotation);
        }
        if (isset($month[0])) {
            $cards[] = json_api_summary_card_record('month', __('This month'), $month[0]['rx'], $month[0]['tx'], $byteNotation);
        }
        if ($totalRx > 0 || $totalTx > 0) {
            $cards[] = json_api_summary_card_record('total', __('All time'), $totalRx, $totalTx, $byteNotation);
        }

        return $cards;
    }

    function json_api_build_detail_payload($page, array $trafficData, $byteNotation)
    {
        if ($page === 's') {
            return [
                'kind' => 'top',
                'title' => __('Top 10 days'),
                'emptyTitle' => __('No data available'),
                'emptyMessage' => __('Daily peak history is not available yet for this interface.'),
                'rows' => json_api_limited_rows(
                    isset($trafficData['top']) ? $trafficData['top'] : [],
                    'top',
                    $byteNotation,
                    10
                ),
            ];
        }

        if ($page === 'h') {
            return [
                'kind' => 'hours',
                'title' => __('Last 24 hours'),
                'emptyTitle' => __('No data available'),
                'emptyMessage' => __('Hourly statistics are not available yet for this interface.'),
                'rows' => json_api_limited_rows(
                    isset($trafficData['hour']) ? $trafficData['hour'] : [],
                    'hour',
                    $byteNotation,
                    24
                ),
            ];
        }

        if ($page === 'd') {
            return [
                'kind' => 'days',
                'title' => __('Last 30 days'),
                'emptyTitle' => __('No data available'),
                'emptyMessage' => __('Daily statistics are not available yet for this interface.'),
                'rows' => json_api_limited_rows(
                    isset($trafficData['day']) ? $trafficData['day'] : [],
                    'day',
                    $byteNotation,
                    30
                ),
            ];
        }

        return [
            'kind' => 'months',
            'title' => __('Last 12 months'),
            'emptyTitle' => __('No data available'),
            'emptyMessage' => __('Monthly statistics are not available yet for this interface.'),
            'rows' => json_api_limited_rows(
                isset($trafficData['month']) ? $trafficData['month'] : [],
                'month',
                $byteNotation,
                12
            ),
        ];
    }

    function json_api_build_chart_payload($page, $graph, array $detail)
    {
        $points = $detail['rows'];

        if ($page !== 's') {
            $points = array_values(array_reverse($points));
        }

        return [
            'enabled' => $graph !== 'none',
            'title' => $page === 's' ? __('Top 10 days') : __('Traffic chart'),
            'description' => $page === 's'
                ? __('Peak traffic days rendered as an interactive chart for quick comparison.')
                : __('Interactive traffic bars rendered directly in React from vnStat JSON data.'),
            'size' => $graph,
            'points' => $points,
        ];
    }

    function json_api_summary_legacy_payload(array $trafficData)
    {
        $summary = isset($trafficData['summary']) ? $trafficData['summary'] : [];
        $hour = isset($trafficData['hour']) ? $trafficData['hour'] : [];
        $day = isset($trafficData['day']) ? $trafficData['day'] : [];
        $month = isset($trafficData['month']) ? $trafficData['month'] : [];
        $trx = (isset($summary['totalrx']) ? $summary['totalrx'] : 0) * 1024 + (isset($summary['totalrxk']) ? $summary['totalrxk'] : 0);
        $ttx = (isset($summary['totaltx']) ? $summary['totaltx'] : 0) * 1024 + (isset($summary['totaltxk']) ? $summary['totaltxk'] : 0);

        return [
            'hour' => [
                'act' => isset($hour[0]) ? 1 : 0,
                'rx' => isset($hour[0]) ? $hour[0]['rx'] : null,
                'tx' => isset($hour[0]) ? $hour[0]['tx'] : null,
            ],
            'day' => [
                'act' => isset($day[0]) ? 1 : 0,
                'rx' => isset($day[0]) ? $day[0]['rx'] : null,
                'tx' => isset($day[0]) ? $day[0]['tx'] : null,
            ],
            'month' => [
                'act' => isset($month[0]) ? 1 : 0,
                'rx' => isset($month[0]) ? $month[0]['rx'] : null,
                'tx' => isset($month[0]) ? $month[0]['tx'] : null,
            ],
            'total' => [
                'act' => 1,
                'rx' => $trx,
                'tx' => $ttx,
            ],
        ];
    }

    function json_api_build_app_payload(array $request, array $appConfig, array $pageTitle, array $trafficData)
    {
        $byteNotation = isset($appConfig['byteNotation']) ? $appConfig['byteNotation'] : null;
        $detail = json_api_build_detail_payload($request['page'], $trafficData, $byteNotation);

        return [
            'meta' => [
                'iface' => $request['iface'],
                'ifaceTitle' => app_iface_label($request['iface'], $appConfig),
                'page' => $request['page'],
                'pageTitle' => app_active_view_title($request['page'], $pageTitle),
                'graph' => $request['graph'],
                'style' => $request['style'],
                'documentTitle' => app_document_title($request['iface'], $request['page'], $pageTitle, $appConfig),
                'language' => isset($appConfig['language']) ? $appConfig['language'] : 'en',
            ],
            'summaryCards' => json_api_build_summary_cards($trafficData, $byteNotation),
            'detail' => $detail,
            'chart' => json_api_build_chart_payload($request['page'], $request['graph'], $detail),
        ];
    }
