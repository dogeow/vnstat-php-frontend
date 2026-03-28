<?php
    //
    // vnStat PHP frontend (c)2006-2010 Bjorge Dijkstra (bjd@jooz.net)
    //
    // This program is free software; you can redistribute it and/or modify
    // it under the terms of the GNU General Public License as published by
    // the Free Software Foundation; either version 2 of the License, or
    // (at your option) any later version.
    //
    // This program is distributed in the hope that it will be useful,
    // but WITHOUT ANY WARRANTY; without even the implied warranty of
    // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    // GNU General Public License for more details.
    //
    // You should have received a copy of the GNU General Public License
    // along with this program; if not, write to the Free Software
    // Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
    //
    //
    // see file COPYING or at http://www.gnu.org/licenses/gpl.html
    // for more information.
    //

    //
    // Valid values for other parameters you can pass to the script.
    // Input parameters will always be limited to one of the values listed here.
    // If a parameter is not provided or invalid it will revert to the default,
    // the first parameter in the list.
    //
    if (isset($_SERVER['PHP_SELF']))
    {
	$script = $_SERVER['PHP_SELF'];
    }
    elseif (isset($_SERVER['SCRIPT_NAME']))
    {
	$script = $_SERVER['SCRIPT_NAME'];
    }
    else
    {
	die('can\'t determine script name!');
    }

    $page_list  = array('s','h','d','m');

    $graph_list = array('large','small','none');
    $style_list = array('light', 'dark');

    $page_title['s'] = T('summary');
    $page_title['h'] = T('hours');
    $page_title['d'] = T('days');
    $page_title['m'] = T('months');


    //
    // functions
    //
    function validate_input()
    {
        global $page,  $page_list;
        global $iface, $iface_list;
        global $graph, $graph_list;
	global $colorscheme, $style, $style_list;
        //
        // get interface data
        //
        $page = isset($_GET['page']) ? $_GET['page'] : '';
        $iface = isset($_GET['if']) ? $_GET['if'] : '';
        $graph = isset($_GET['graph']) ? $_GET['graph'] : '';
        $style = isset($_GET['style']) ? $_GET['style'] : '';

        if (!in_array($page, $page_list))
        {
            $page = $page_list[0];
        }

        if (!in_array($iface, $iface_list))
        {
            $iface = $iface_list[0];
        }

        if (!in_array($graph, $graph_list))
        {
            $graph = $graph_list[0];
        }

	$tp = "./themes/$style";
        if (!in_array($style, $style_list) || !is_dir($tp) || !file_exists("$tp/theme.php") || !preg_match('/^[a-z0-9-_]+$/i', $style))
        {
	    $style = DEFAULT_COLORSCHEME;
        }
    }


    function read_vnstat_dump($iface)
    {
        global $data_dir;

        $dump_file = "$data_dir/vnstat_dump_$iface";

        if (file_exists($dump_file)) {
            return file($dump_file);
        }

        return array();
    }


    function run_vnstat_command($arguments)
    {
        global $vnstat_bin;

        if (!isset($vnstat_bin) || $vnstat_bin == '' || !is_executable($vnstat_bin)) {
            return '';
        }

        $command = escapeshellarg($vnstat_bin).' '.$arguments.' 2>/dev/null';
        $fd = popen($command, "r");
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


    function bytes_to_kbytes($bytes)
    {
        return $bytes / 1024;
    }


    function fill_summary_totals_from_bytes($rx_bytes, $tx_bytes)
    {
        global $summary;

        $rx_kbytes = (int) floor(bytes_to_kbytes($rx_bytes));
        $tx_kbytes = (int) floor(bytes_to_kbytes($tx_bytes));

        $summary['totalrx'] = (int) floor($rx_kbytes / 1024);
        $summary['totalrxk'] = $rx_kbytes % 1024;
        $summary['totaltx'] = (int) floor($tx_kbytes / 1024);
        $summary['totaltxk'] = $tx_kbytes % 1024;
    }


    function normalize_vnstat_json_list($entries)
    {
        if (!is_array($entries)) {
            return array();
        }

        usort($entries, function ($left, $right) {
            $left_ts = isset($left['timestamp']) ? (int) $left['timestamp'] : 0;
            $right_ts = isset($right['timestamp']) ? (int) $right['timestamp'] : 0;
            if ($left_ts == $right_ts) {
                return 0;
            }

            return ($left_ts > $right_ts) ? -1 : 1;
        });

        return $entries;
    }


    function build_vnstat_json_bucket($entries, $type, $use_label)
    {
        $bucket = array();
        $entries = normalize_vnstat_json_list($entries);

        for ($i = 0; $i < count($entries); $i++) {
            $entry = $entries[$i];
            $timestamp = isset($entry['timestamp']) ? (int) $entry['timestamp'] : 0;
            $rx = isset($entry['rx']) ? bytes_to_kbytes($entry['rx']) : 0;
            $tx = isset($entry['tx']) ? bytes_to_kbytes($entry['tx']) : 0;

            $bucket[$i]['time'] = $timestamp;
            $bucket[$i]['rx'] = $rx;
            $bucket[$i]['tx'] = $tx;
            $bucket[$i]['act'] = 1;

            if (!$use_label) {
                continue;
            }

            if ($type == 'day') {
                $bucket[$i]['label'] = $timestamp ? vnstat_format_time(T('datefmt_days'), $timestamp) : '';
                $bucket[$i]['img_label'] = $timestamp ? vnstat_format_time(T('datefmt_days_img'), $timestamp) : '';
            } else if ($type == 'month') {
                $bucket[$i]['label'] = $timestamp ? vnstat_format_time(T('datefmt_months'), $timestamp) : '';
                $bucket[$i]['img_label'] = $timestamp ? vnstat_format_time(T('datefmt_months_img'), $timestamp) : '';
            } else if ($type == 'hour') {
                $start = $timestamp ? ($timestamp - ($timestamp % 3600)) : 0;
                $end = $start + 3600;
                $bucket[$i]['label'] = $timestamp ? vnstat_format_time(T('datefmt_hours'), $start).' - '.vnstat_format_time(T('datefmt_hours'), $end) : '';
                $bucket[$i]['img_label'] = $timestamp ? vnstat_format_time(T('datefmt_hours_img'), $timestamp) : '';
            } else if ($type == 'top') {
                $bucket[$i]['label'] = $timestamp ? vnstat_format_time(T('datefmt_top'), $timestamp) : '';
                $bucket[$i]['img_label'] = '';
            }
        }

        return $bucket;
    }


    function parse_vnstat_json_data($json, $use_label)
    {
        global $hour, $day, $month, $top, $summary;

        $decoded = json_decode($json, true);
        if (!is_array($decoded) || !isset($decoded['interfaces'][0]['traffic'])) {
            return false;
        }

        $traffic = $decoded['interfaces'][0]['traffic'];

        $summary = array();
        $hour = build_vnstat_json_bucket(isset($traffic['hour']) ? $traffic['hour'] : array(), 'hour', $use_label);
        $day = build_vnstat_json_bucket(isset($traffic['day']) ? $traffic['day'] : array(), 'day', $use_label);
        $month = build_vnstat_json_bucket(isset($traffic['month']) ? $traffic['month'] : array(), 'month', $use_label);
        $top = build_vnstat_json_bucket(isset($traffic['top']) ? $traffic['top'] : array(), 'top', $use_label);

        if (isset($traffic['total']) && is_array($traffic['total'])) {
            fill_summary_totals_from_bytes(
                isset($traffic['total']['rx']) ? (int) $traffic['total']['rx'] : 0,
                isset($traffic['total']['tx']) ? (int) $traffic['total']['tx'] : 0
            );
        }

        return true;
    }


    function vnstat_icu_pattern($pattern)
    {
        return strtr($pattern, array(
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
            '%p' => 'a'
        ));
    }


    function vnstat_php_date_pattern($pattern)
    {
        return strtr($pattern, array(
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
            '%p' => 'A'
        ));
    }


    function vnstat_format_time($pattern, $timestamp)
    {
        global $locale;

        static $formatters = array();
        $timezone = date_default_timezone_get();
        $cache_key = $locale.'|'.$timezone.'|'.$pattern;

        if (class_exists('IntlDateFormatter'))
        {
            if (!isset($formatters[$cache_key]))
            {
                $formatters[$cache_key] = new IntlDateFormatter(
                    $locale,
                    IntlDateFormatter::NONE,
                    IntlDateFormatter::NONE,
                    $timezone,
                    null,
                    vnstat_icu_pattern($pattern)
                );
            }

            if ($formatters[$cache_key] instanceof IntlDateFormatter)
            {
                $formatted = $formatters[$cache_key]->format($timestamp);
                if ($formatted !== false)
                {
                    return $formatted;
                }
            }
        }

        return date(vnstat_php_date_pattern($pattern), $timestamp);
    }


    function get_vnstat_data($use_label=true)
    {
        global $iface, $vnstat_bin, $data_dir;
        global $hour,$day,$month,$top,$summary;

        $summary = array();
        $day = array();
        $hour = array();
        $month = array();
        $top = array();

        $json_output = run_vnstat_command('--json -i '.escapeshellarg($iface));
        if ($json_output !== '' && parse_vnstat_json_data($json_output, $use_label))
        {
            return;
        }

	$vnstat_data = array();
        $legacy_output = run_vnstat_command('--dumpdb -i '.escapeshellarg($iface));
        if ($legacy_output !== '')
        {
            $vnstat_data = explode("\n", $legacy_output);
        }

        if (count($vnstat_data) === 0)
        {
	    $vnstat_data = read_vnstat_dump($iface);
        }

        if (isset($vnstat_data[0]) && strpos($vnstat_data[0], 'Error') !== false)
        {
            $dump_data = read_vnstat_dump($iface);
            if (count($dump_data) > 0)
            {
                $vnstat_data = $dump_data;
            }
        }


        if (isset($vnstat_data[0]) && strpos($vnstat_data[0], 'Error') !== false) {
          return;
        }

        //
        // extract data
        //
        foreach($vnstat_data as $line)
        {
            $d = explode(';', trim($line));
            if ($d[0] == 'd')
            {
                $day[$d[1]]['time']  = $d[2];
                $day[$d[1]]['rx']    = $d[3] * 1024 + $d[5];
                $day[$d[1]]['tx']    = $d[4] * 1024 + $d[6];
                $day[$d[1]]['act']   = $d[7];
                if ($d[2] != 0 && $use_label)
                {
                    $day[$d[1]]['label'] = vnstat_format_time(T('datefmt_days'), $d[2]);
                    $day[$d[1]]['img_label'] = vnstat_format_time(T('datefmt_days_img'), $d[2]);
                }
                elseif($use_label)
                {
                    $day[$d[1]]['label'] = '';
                    $day[$d[1]]['img_label'] = '';
                }
            }
            else if ($d[0] == 'm')
            {
                $month[$d[1]]['time'] = $d[2];
                $month[$d[1]]['rx']   = $d[3] * 1024 + $d[5];
                $month[$d[1]]['tx']   = $d[4] * 1024 + $d[6];
                $month[$d[1]]['act']  = $d[7];
                if ($d[2] != 0 && $use_label)
                {
                    $month[$d[1]]['label'] = vnstat_format_time(T('datefmt_months'), $d[2]);
                    $month[$d[1]]['img_label'] = vnstat_format_time(T('datefmt_months_img'), $d[2]);
                }
                else if ($use_label)
                {
                    $month[$d[1]]['label'] = '';
                    $month[$d[1]]['img_label'] = '';
                }
            }
            else if ($d[0] == 'h')
            {
                $hour[$d[1]]['time'] = $d[2];
                $hour[$d[1]]['rx']   = $d[3];
                $hour[$d[1]]['tx']   = $d[4];
                $hour[$d[1]]['act']  = 1;
                if ($d[2] != 0 && $use_label)
                {
                    $st = $d[2] - ($d[2] % 3600);
                    $et = $st + 3600;
                    $hour[$d[1]]['label'] = vnstat_format_time(T('datefmt_hours'), $st).' - '.vnstat_format_time(T('datefmt_hours'), $et);
                    $hour[$d[1]]['img_label'] = vnstat_format_time(T('datefmt_hours_img'), $d[2]);
                }
                else if ($use_label)
                {
                    $hour[$d[1]]['label'] = '';
                    $hour[$d[1]]['img_label'] = '';
                }
            }
            else if ($d[0] == 't')
            {
                $top[$d[1]]['time'] = $d[2];
                $top[$d[1]]['rx']   = $d[3] * 1024 + $d[5];
                $top[$d[1]]['tx']   = $d[4] * 1024 + $d[6];
                $top[$d[1]]['act']  = $d[7];
                if($use_label)
                {
                    $top[$d[1]]['label'] = vnstat_format_time(T('datefmt_top'), $d[2]);
                    $top[$d[1]]['img_label'] = '';
                }
            }
            else
            {
                $summary[$d[0]] = isset($d[1]) ? $d[1] : '';
            }
        }

        rsort($day);
        rsort($month);
        rsort($hour);
    }
?>
