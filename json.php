<?php
    require 'config.php';
    require 'localize.php';
    require 'vnstat.php';

    validate_input();

    function iface_label($if)
    {
        global $iface_title;

        if (isset($iface_title[$if]) && $iface_title[$if] !== '') {
            return $iface_title[$if];
        }

        return $if;
    }

    function kbytes_to_string($kb)
    {
        global $byte_notation;

        $units = array('TB', 'GB', 'MB', 'KB');
        $scale = 1024 * 1024 * 1024;
        $ui = 0;

        $custom_size = isset($byte_notation) && in_array($byte_notation, $units);

        while ((($kb < $scale) && ($scale > 1)) || $custom_size) {
            $ui++;
            $scale = $scale / 1024;

            if ($custom_size && $units[$ui] == $byte_notation) {
                break;
            }
        }

        return sprintf('%0.2f %s', ($kb / $scale), $units[$ui]);
    }

    function active_view_title()
    {
        global $page;

        if ($page == 'h') {
            return T('Last 24 hours');
        }
        if ($page == 'd') {
            return T('Last 30 days');
        }
        if ($page == 'm') {
            return T('Last 12 months');
        }

        return T('Summary');
    }

    function summary_card_record($id, $label, $rx, $tx)
    {
        $total = $rx + $tx;

        return array(
            'id' => $id,
            'label' => $label,
            'rx' => $rx,
            'tx' => $tx,
            'total' => $total,
            'formatted' => array(
                'rx' => kbytes_to_string($rx),
                'tx' => kbytes_to_string($tx),
                'total' => kbytes_to_string($total)
            )
        );
    }

    function detail_row_record($id, $row)
    {
        $rx = isset($row['rx']) ? (float) $row['rx'] : 0;
        $tx = isset($row['tx']) ? (float) $row['tx'] : 0;
        $total = $rx + $tx;

        return array(
            'id' => $id,
            'label' => isset($row['label']) ? $row['label'] : '',
            'shortLabel' => isset($row['img_label']) && $row['img_label'] !== '' ? $row['img_label'] : (isset($row['label']) ? $row['label'] : ''),
            'time' => isset($row['time']) ? (int) $row['time'] : 0,
            'rx' => $rx,
            'tx' => $tx,
            'total' => $total,
            'formatted' => array(
                'rx' => kbytes_to_string($rx),
                'tx' => kbytes_to_string($tx),
                'total' => kbytes_to_string($total)
            )
        );
    }

    function filtered_rows($rows, $prefix)
    {
        $items = array();
        $index = 0;

        foreach ($rows as $row) {
            if (!isset($row['act']) || (int) $row['act'] !== 1) {
                continue;
            }

            $items[] = detail_row_record($prefix.'-'.$index, $row);
            $index++;
        }

        return $items;
    }

    function build_summary_cards()
    {
        global $summary, $day, $hour, $month;

        $cards = array();
        $total_rx = (isset($summary['totalrx']) ? $summary['totalrx'] : 0) * 1024 + (isset($summary['totalrxk']) ? $summary['totalrxk'] : 0);
        $total_tx = (isset($summary['totaltx']) ? $summary['totaltx'] : 0) * 1024 + (isset($summary['totaltxk']) ? $summary['totaltxk'] : 0);

        if (isset($hour[0])) {
            $cards[] = summary_card_record('hour', T('This hour'), $hour[0]['rx'], $hour[0]['tx']);
        }
        if (isset($day[0])) {
            $cards[] = summary_card_record('day', T('This day'), $day[0]['rx'], $day[0]['tx']);
        }
        if (isset($month[0])) {
            $cards[] = summary_card_record('month', T('This month'), $month[0]['rx'], $month[0]['tx']);
        }
        if ($total_rx > 0 || $total_tx > 0 || count($cards) > 0) {
            $cards[] = summary_card_record('total', T('All time'), $total_rx, $total_tx);
        }

        return $cards;
    }

    function build_detail_payload()
    {
        global $page, $top, $hour, $day, $month;

        if ($page == 's') {
            return array(
                'kind' => 'top',
                'title' => T('Top 10 days'),
                'emptyTitle' => T('No data available'),
                'emptyMessage' => T('Daily peak history is not available yet for this interface.'),
                'rows' => filtered_rows($top, 'top')
            );
        }

        if ($page == 'h') {
            return array(
                'kind' => 'hours',
                'title' => T('Last 24 hours'),
                'emptyTitle' => T('No data available'),
                'emptyMessage' => T('Hourly statistics are not available yet for this interface.'),
                'rows' => filtered_rows($hour, 'hour')
            );
        }

        if ($page == 'd') {
            return array(
                'kind' => 'days',
                'title' => T('Last 30 days'),
                'emptyTitle' => T('No data available'),
                'emptyMessage' => T('Daily statistics are not available yet for this interface.'),
                'rows' => filtered_rows($day, 'day')
            );
        }

        return array(
            'kind' => 'months',
            'title' => T('Last 12 months'),
            'emptyTitle' => T('No data available'),
            'emptyMessage' => T('Monthly statistics are not available yet for this interface.'),
            'rows' => filtered_rows($month, 'month')
        );
    }

    function build_chart_payload($detail)
    {
        global $page, $graph;

        return array(
            'enabled' => $page != 's' && $graph != 'none',
            'title' => T('Traffic chart'),
            'description' => T('Interactive traffic bars rendered directly in React from vnStat JSON data.'),
            'size' => $graph,
            'points' => $page == 's' ? array() : $detail['rows']
        );
    }

    function write_summary_legacy()
    {
        global $summary, $day, $hour, $month;

        $trx = (isset($summary['totalrx']) ? $summary['totalrx'] : 0) * 1024 + (isset($summary['totalrxk']) ? $summary['totalrxk'] : 0);
        $ttx = (isset($summary['totaltx']) ? $summary['totaltx'] : 0) * 1024 + (isset($summary['totaltxk']) ? $summary['totaltxk'] : 0);

        $sum = array();
        $sum['hour'] = array(
            'act' => isset($hour[0]) ? 1 : 0,
            'rx' => isset($hour[0]) ? $hour[0]['rx'] : null,
            'tx' => isset($hour[0]) ? $hour[0]['tx'] : null
        );
        $sum['day'] = array(
            'act' => isset($day[0]) ? 1 : 0,
            'rx' => isset($day[0]) ? $day[0]['rx'] : null,
            'tx' => isset($day[0]) ? $day[0]['tx'] : null
        );
        $sum['month'] = array(
            'act' => isset($month[0]) ? 1 : 0,
            'rx' => isset($month[0]) ? $month[0]['rx'] : null,
            'tx' => isset($month[0]) ? $month[0]['tx'] : null
        );
        $sum['total'] = array(
            'act' => 1,
            'rx' => $trx,
            'tx' => $ttx
        );

        print json_encode($sum);
    }

    get_vnstat_data();

    header('Content-type: application/json; charset=utf-8');

    if (isset($_GET['format']) && $_GET['format'] === 'app') {
        $detail = build_detail_payload();
        print json_encode(array(
            'meta' => array(
                'iface' => $iface,
                'ifaceTitle' => iface_label($iface),
                'page' => $page,
                'pageTitle' => active_view_title(),
                'graph' => $graph,
                'style' => $style,
                'documentTitle' => active_view_title().' - '.T('Traffic data for').' '.iface_label($iface).' ('.$iface.')',
                'language' => $language
            ),
            'summaryCards' => build_summary_cards(),
            'detail' => $detail,
            'chart' => build_chart_payload($detail)
        ));
        exit;
    }

    if ($page == 's') {
        write_summary_legacy();
    } else if ($page == 'h') {
        print json_encode(array('hours' => $hour));
    } else if ($page == 'd') {
        print json_encode(array('days' => $day));
    } else if ($page == 'm') {
        print json_encode(array('months' => $month));
    }
?>
