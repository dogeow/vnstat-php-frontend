<?php
    function vnstat_data_empty()
    {
        return [
            'summary' => [],
            'hour' => [],
            'day' => [],
            'month' => [],
            'top' => [],
        ];
    }

    function vnstat_data_read_dump($iface, array $appConfig)
    {
        $dataDir = isset($appConfig['dataDir']) ? $appConfig['dataDir'] : '';
        if ($dataDir === '') {
            return [];
        }

        $dumpFile = rtrim($dataDir, '/').'/vnstat_dump_'.$iface;
        if (is_file($dumpFile)) {
            return file($dumpFile);
        }

        return [];
    }

    function vnstat_data_run_command($arguments, array $appConfig)
    {
        $vnstatBin = isset($appConfig['vnstatBin']) ? $appConfig['vnstatBin'] : '';
        if ($vnstatBin === '' || !is_executable($vnstatBin)) {
            return '';
        }

        $command = escapeshellarg($vnstatBin).' '.$arguments.' 2>/dev/null';
        $fd = popen($command, 'r');
        if (!is_resource($fd)) {
            return '';
        }

        $buffer = '';
        while (!feof($fd)) {
            $buffer .= fgets($fd);
        }
        pclose($fd);

        return $buffer;
    }

    function vnstat_data_bytes_to_kbytes($bytes)
    {
        return $bytes / 1024;
    }

    function vnstat_data_json_timestamp_from_parts(array $entry, $type)
    {
        if (!isset($entry['date']) || !is_array($entry['date'])) {
            return 0;
        }

        $date = $entry['date'];
        $year = isset($date['year']) ? (int) $date['year'] : 0;
        $month = isset($date['month']) ? (int) $date['month'] : 1;
        $day = isset($date['day']) ? (int) $date['day'] : 1;

        if ($year <= 0 || $month <= 0 || $day <= 0 || !checkdate($month, $day, $year)) {
            return 0;
        }

        $hour = 0;
        $minute = 0;

        if ($type === 'hour') {
            if (isset($entry['time']) && is_array($entry['time'])) {
                $hour = isset($entry['time']['hour']) ? (int) $entry['time']['hour'] : 0;
                $minute = isset($entry['time']['minute']) ? (int) $entry['time']['minute'] : 0;
            } elseif (isset($entry['hour'])) {
                $hour = (int) $entry['hour'];
            }
        }

        return mktime($hour, $minute, 0, $month, $day, $year);
    }

    function vnstat_data_json_timestamp($entry, $type)
    {
        if (isset($entry['timestamp']) && (int) $entry['timestamp'] > 0) {
            return (int) $entry['timestamp'];
        }

        return vnstat_data_json_timestamp_from_parts($entry, $type);
    }

    function vnstat_data_summary_totals_from_bytes($rxBytes, $txBytes)
    {
        $rxKbytes = (int) floor(vnstat_data_bytes_to_kbytes($rxBytes));
        $txKbytes = (int) floor(vnstat_data_bytes_to_kbytes($txBytes));

        return [
            'totalrx' => (int) floor($rxKbytes / 1024),
            'totalrxk' => $rxKbytes % 1024,
            'totaltx' => (int) floor($txKbytes / 1024),
            'totaltxk' => $txKbytes % 1024,
        ];
    }

    function vnstat_data_normalize_json_list($entries, $type)
    {
        if (!is_array($entries)) {
            return [];
        }

        if ($type === 'top') {
            return $entries;
        }

        usort($entries, function ($left, $right) use ($type) {
            $leftTimestamp = vnstat_data_json_timestamp($left, $type);
            $rightTimestamp = vnstat_data_json_timestamp($right, $type);

            if ($leftTimestamp === $rightTimestamp) {
                return 0;
            }

            return ($leftTimestamp > $rightTimestamp) ? -1 : 1;
        });

        return $entries;
    }

    function vnstat_data_icu_pattern($pattern)
    {
        return strtr($pattern, [
            '%a' => 'EEE',
            '%A' => 'EEEE',
            '%b' => 'LLL',
            '%B' => 'LLLL',
            '%d' => 'dd',
            '%e' => 'd',
            '%m' => 'MM',
            '%Y' => 'yyyy',
            '%H' => 'HH',
            '%k' => 'H',
            '%I' => 'hh',
            '%l' => 'h',
            '%M' => 'mm',
            '%p' => 'a',
        ]);
    }

    function vnstat_data_php_date_pattern($pattern)
    {
        return strtr($pattern, [
            '%a' => 'D',
            '%A' => 'l',
            '%b' => 'M',
            '%B' => 'F',
            '%d' => 'd',
            '%e' => 'j',
            '%m' => 'm',
            '%Y' => 'Y',
            '%H' => 'H',
            '%k' => 'G',
            '%I' => 'h',
            '%l' => 'g',
            '%M' => 'i',
            '%p' => 'A',
        ]);
    }

    function vnstat_data_format_time($pattern, $timestamp, $locale)
    {
        static $formatters = [];

        $timezone = date_default_timezone_get();
        $cacheKey = $locale.'|'.$timezone.'|'.$pattern;

        if (class_exists('IntlDateFormatter')) {
            if (!isset($formatters[$cacheKey])) {
                $formatters[$cacheKey] = new IntlDateFormatter(
                    $locale,
                    IntlDateFormatter::NONE,
                    IntlDateFormatter::NONE,
                    $timezone,
                    null,
                    vnstat_data_icu_pattern($pattern)
                );
            }

            if ($formatters[$cacheKey] instanceof IntlDateFormatter) {
                $formatted = $formatters[$cacheKey]->format($timestamp);
                if ($formatted !== false) {
                    return $formatted;
                }
            }
        }

        return date(vnstat_data_php_date_pattern($pattern), $timestamp);
    }

    function vnstat_data_top_img_label($timestamp, $locale)
    {
        if (!$timestamp) {
            return '';
        }

        return vnstat_data_format_time('%m/%d', $timestamp, $locale);
    }

    function vnstat_data_bucket_labels($type, $timestamp, $locale)
    {
        if ($timestamp <= 0) {
            return [
                'label' => '',
                'img_label' => '',
            ];
        }

        if ($type === 'day') {
            return [
                'label' => vnstat_data_format_time(__('datefmt_days'), $timestamp, $locale),
                'img_label' => vnstat_data_format_time(__('datefmt_days_img'), $timestamp, $locale),
            ];
        }

        if ($type === 'month') {
            return [
                'label' => vnstat_data_format_time(__('datefmt_months'), $timestamp, $locale),
                'img_label' => vnstat_data_format_time(__('datefmt_months_img'), $timestamp, $locale),
            ];
        }

        if ($type === 'hour') {
            $startTime = $timestamp - ($timestamp % 3600);
            $endTime = $startTime + 3600;

            return [
                'label' => vnstat_data_format_time(__('datefmt_hours'), $startTime, $locale).' - '.vnstat_data_format_time(__('datefmt_hours'), $endTime, $locale),
                'img_label' => vnstat_data_format_time(__('datefmt_hours_img'), $timestamp, $locale),
            ];
        }

        if ($type === 'top') {
            return [
                'label' => vnstat_data_format_time(__('datefmt_top'), $timestamp, $locale),
                'img_label' => vnstat_data_top_img_label($timestamp, $locale),
            ];
        }

        return [];
    }

    function vnstat_data_build_json_bucket($entries, $type, $useLabel, $locale)
    {
        $bucket = [];

        foreach (vnstat_data_normalize_json_list($entries, $type) as $index => $entry) {
            $timestamp = vnstat_data_json_timestamp($entry, $type);
            $row = [
                'time' => $timestamp,
                'rx' => isset($entry['rx']) ? vnstat_data_bytes_to_kbytes($entry['rx']) : 0,
                'tx' => isset($entry['tx']) ? vnstat_data_bytes_to_kbytes($entry['tx']) : 0,
                'act' => 1,
            ];

            if ($useLabel) {
                $row = array_merge($row, vnstat_data_bucket_labels($type, $timestamp, $locale));
            }

            $bucket[$index] = $row;
        }

        return $bucket;
    }

    function vnstat_data_parse_json($json, $useLabel, array $appConfig)
    {
        $decoded = json_decode($json, true);
        if (!is_array($decoded) || !isset($decoded['interfaces'][0]['traffic'])) {
            return null;
        }

        $traffic = $decoded['interfaces'][0]['traffic'];
        $locale = isset($appConfig['locale']) ? $appConfig['locale'] : 'en_US.UTF-8';
        $data = vnstat_data_empty();

        $data['hour'] = vnstat_data_build_json_bucket(isset($traffic['hour']) ? $traffic['hour'] : [], 'hour', $useLabel, $locale);
        $data['day'] = vnstat_data_build_json_bucket(isset($traffic['day']) ? $traffic['day'] : [], 'day', $useLabel, $locale);
        $data['month'] = vnstat_data_build_json_bucket(isset($traffic['month']) ? $traffic['month'] : [], 'month', $useLabel, $locale);
        $data['top'] = vnstat_data_build_json_bucket(isset($traffic['top']) ? $traffic['top'] : [], 'top', $useLabel, $locale);

        if (isset($traffic['total']) && is_array($traffic['total'])) {
            $data['summary'] = vnstat_data_summary_totals_from_bytes(
                isset($traffic['total']['rx']) ? (int) $traffic['total']['rx'] : 0,
                isset($traffic['total']['tx']) ? (int) $traffic['total']['tx'] : 0
            );
        }

        return $data;
    }

    function vnstat_data_legacy_metric_row($timestamp, $rx, $tx, $act, $type, $useLabel, $locale)
    {
        $row = [
            'time' => $timestamp,
            'rx' => $rx,
            'tx' => $tx,
            'act' => $act,
        ];

        if ($useLabel) {
            $row = array_merge($row, vnstat_data_bucket_labels($type, (int) $timestamp, $locale));
        }

        return $row;
    }

    function vnstat_data_parse_legacy_lines(array $lines, $useLabel, array $appConfig)
    {
        $locale = isset($appConfig['locale']) ? $appConfig['locale'] : 'en_US.UTF-8';
        $data = vnstat_data_empty();

        foreach ($lines as $line) {
            $parts = explode(';', trim($line));
            if (!isset($parts[0], $parts[1]) || $parts[0] === '') {
                continue;
            }

            $kind = $parts[0];
            $index = $parts[1];
            $timestamp = isset($parts[2]) ? (int) $parts[2] : 0;

            if ($kind === 'd') {
                $data['day'][$index] = vnstat_data_legacy_metric_row(
                    $timestamp,
                    (isset($parts[3]) ? (int) $parts[3] : 0) * 1024 + (isset($parts[5]) ? (int) $parts[5] : 0),
                    (isset($parts[4]) ? (int) $parts[4] : 0) * 1024 + (isset($parts[6]) ? (int) $parts[6] : 0),
                    isset($parts[7]) ? (int) $parts[7] : 0,
                    'day',
                    $useLabel,
                    $locale
                );
                continue;
            }

            if ($kind === 'm') {
                $data['month'][$index] = vnstat_data_legacy_metric_row(
                    $timestamp,
                    (isset($parts[3]) ? (int) $parts[3] : 0) * 1024 + (isset($parts[5]) ? (int) $parts[5] : 0),
                    (isset($parts[4]) ? (int) $parts[4] : 0) * 1024 + (isset($parts[6]) ? (int) $parts[6] : 0),
                    isset($parts[7]) ? (int) $parts[7] : 0,
                    'month',
                    $useLabel,
                    $locale
                );
                continue;
            }

            if ($kind === 'h') {
                $data['hour'][$index] = vnstat_data_legacy_metric_row(
                    $timestamp,
                    isset($parts[3]) ? (int) $parts[3] : 0,
                    isset($parts[4]) ? (int) $parts[4] : 0,
                    1,
                    'hour',
                    $useLabel,
                    $locale
                );
                continue;
            }

            if ($kind === 't') {
                $data['top'][$index] = vnstat_data_legacy_metric_row(
                    $timestamp,
                    (isset($parts[3]) ? (int) $parts[3] : 0) * 1024 + (isset($parts[5]) ? (int) $parts[5] : 0),
                    (isset($parts[4]) ? (int) $parts[4] : 0) * 1024 + (isset($parts[6]) ? (int) $parts[6] : 0),
                    isset($parts[7]) ? (int) $parts[7] : 0,
                    'top',
                    $useLabel,
                    $locale
                );
                continue;
            }

            $data['summary'][$kind] = isset($parts[1]) ? $parts[1] : '';
        }

        rsort($data['day']);
        rsort($data['month']);
        rsort($data['hour']);

        return $data;
    }

    function vnstat_data_output_has_error(array $lines)
    {
        return isset($lines[0]) && strpos($lines[0], 'Error') !== false;
    }

    function vnstat_data_fetch($iface, array $appConfig, $useLabel = true)
    {
        $jsonOutput = vnstat_data_run_command('--json -i '.escapeshellarg($iface), $appConfig);
        if ($jsonOutput !== '') {
            $jsonData = vnstat_data_parse_json($jsonOutput, $useLabel, $appConfig);
            if (is_array($jsonData)) {
                return $jsonData;
            }
        }

        $legacyOutput = vnstat_data_run_command('--dumpdb -i '.escapeshellarg($iface), $appConfig);
        $legacyLines = $legacyOutput !== '' ? explode("\n", $legacyOutput) : [];

        if ($legacyLines === []) {
            $legacyLines = vnstat_data_read_dump($iface, $appConfig);
        }

        if (vnstat_data_output_has_error($legacyLines)) {
            $dumpLines = vnstat_data_read_dump($iface, $appConfig);
            if ($dumpLines !== []) {
                $legacyLines = $dumpLines;
            }
        }

        if (vnstat_data_output_has_error($legacyLines)) {
            return vnstat_data_empty();
        }

        return vnstat_data_parse_legacy_lines($legacyLines, $useLabel, $appConfig);
    }
