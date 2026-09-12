<?php
require __DIR__.'/../app/app_localize.php';
require __DIR__.'/../app/vnstat_request.php';
require __DIR__.'/../app/vnstat_data_helpers.php';
require __DIR__.'/../app/json_api_helpers.php';
require __DIR__.'/../app/react_shell_helpers.php';

set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});
app_localize_load('en_US.UTF-8', 'cn');
date_default_timezone_set('UTC');
$config = ['ifaceList' => ['eth0', 'sixxs'], 'pageList' => ['h', 'd', 'm', 's'], 'styleList' => ['light', 'dark'], 'locale' => 'en_US.UTF-8', 'language' => 'cn'];
$checks = 0;
function check($condition, $message) {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}

$request = vnstat_request_validate(['if' => ['eth0'], 'page' => ['d'], 'style' => ['dark']], $config);
check($request === ['page' => 'h', 'iface' => 'eth0', 'style' => 'light'], 'Array query parameters must safely use defaults.');
try {
    vnstat_request_validate([], array_merge($config, ['ifaceList' => []]));
    throw new LogicException('Empty interface configuration was accepted.');
} catch (RuntimeException $error) {
    check(strpos($error->getMessage(), '网络接口') !== false, 'Missing interface configuration has a useful error.');
}
check(app_kbytes_to_string(1073741824, 'TB') === '1.00 TB', 'PHP forced TB agrees with the frontend.');
$now = strtotime('2026-09-12 12:30:00 UTC');
$source = ['interfaces' => [['traffic' => [
    'hour' => [
        ['timestamp' => $now - 3600, 'rx' => 1024, 'tx' => 2048],
        ['timestamp' => $now, 'rx' => 4096, 'tx' => 8192],
    ],
    'day' => [['date' => ['year' => 2026, 'month' => 9, 'day' => 12], 'rx' => 1048576, 'tx' => 2048]],
    'month' => [['date' => ['year' => 2026, 'month' => 9], 'rx' => 1048576, 'tx' => 2048]],
    'total' => ['rx' => 1073741824, 'tx' => 2147483648],
]]]];
$data = vnstat_data_parse_json(json_encode($source), true, $config);
check($data['hour'][0]['rx'] === 4, 'JSON converts bytes to KB and sorts newest first.');
check($data['day'][0]['label'] === '09月12日', 'Chinese dates do not mix English month names.');
$cards = json_api_build_summary_cards($data, null, $now);
check(count($cards) === 4 && $cards[0]['label'] === '本小时', 'Current summaries contain four accurate periods.');
$older = json_api_build_summary_cards($data, null, strtotime('2026-10-01 UTC'));
check($older[0]['label'] === '最近小时' && $older[1]['label'] === '最近一天' && $older[2]['label'] === '最近月份', 'Stale counters are not mislabeled as current.');
$data['hour'][0]['act'] = 0;
$cards = json_api_build_summary_cards($data, null, $now);
check($cards[0]['rx'] === 1, 'Inactive summary rows are excluded.');
$zero = vnstat_data_empty();
$zero['summary'] = ['totalrx' => 0, 'totaltx' => 0];
check(count(json_api_build_summary_cards($zero, null, $now)) === 1, 'Real zero counters remain visible.');
check(json_api_build_summary_cards(vnstat_data_empty(), null) === [], 'Missing data is not rendered as zero counters.');
foreach (['h', 'd', 'm', 's'] as $page) {
    $payload = json_api_build_app_payload(['iface' => 'eth0', 'page' => $page, 'style' => 'light'], $config, vnstat_request_page_title_map(), $data);
    check($payload['meta']['page'] === $page && is_array($payload['chart']['points']), 'Every view returns a valid payload.');
    $times = array_column($payload['chart']['points'], 'time');
    $sorted = $times;
    sort($sorted);
    check($times === $sorted, 'Chart points are chronological.');
}
$dumpDir = sys_get_temp_dir().'/vnstat-dump-test-'.uniqid();
mkdir($dumpDir);
file_put_contents($dumpDir.'/vnstat_dump_eth0', "totalrx;1\ntotaltx;2\nh;0;$now;32;64\n");
try {
    $cwd = getcwd();
    chdir(__DIR__.'/../api');
    $root = dirname(__DIR__);
    $relative = str_repeat('../', count(array_filter(explode('/', $root)))).ltrim($dumpDir, '/');
    $fallback = vnstat_data_fetch('eth0', ['vnstatBin' => '/missing/vnstat', 'dataDir' => $relative]);
    check($fallback['hour'][0]['rx'] === 32, 'Relative dump paths resolve from the project root, including API requests.');
    chdir($cwd);
} finally {
    unlink($dumpDir.'/vnstat_dump_eth0');
    rmdir($dumpDir);
}
try {
    vnstat_data_fetch('eth0', ['vnstatBin' => '/missing/vnstat', 'dataDir' => '']);
    throw new LogicException('Missing vnStat was accepted as empty traffic.');
} catch (RuntimeException $error) {
    check(strpos($error->getMessage(), 'vnStat') !== false, 'Missing data source returns a meaningful failure.');
}
echo "PHP: $checks checks passed.\n";
