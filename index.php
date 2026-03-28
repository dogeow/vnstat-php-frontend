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
    require 'config.php';
    require 'localize.php';
    require 'vnstat.php';

    validate_input();

    require "./themes/$style/theme.php";

    function h($value)
    {
        return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
    }

    function iface_label($if)
    {
        global $iface_title;

        if (isset($iface_title[$if]) && $iface_title[$if] !== '') {
            return $iface_title[$if];
        }

        return $if;
    }

    function build_url($overrides = array())
    {
        global $iface, $page, $graph, $style, $script;

        $params = array(
            'if' => $iface,
            'page' => $page,
            'graph' => $graph,
            'style' => $style
        );

        foreach ($overrides as $key => $value) {
            $params[$key] = $value;
        }

        return $script.'?'.http_build_query($params, '', '&');
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

    function active_view_description()
    {
        global $page;

        if ($page == 'h') {
            return 'Track the last 24 hourly samples for the selected interface.';
        }
        if ($page == 'd') {
            return 'Review the last 30 daily totals and spot short-term spikes.';
        }
        if ($page == 'm') {
            return 'Compare monthly totals across the last 12 billing cycles.';
        }

        return 'A responsive overview of current bandwidth usage and historical peaks.';
    }

    function graph_mode_label()
    {
        global $graph, $page;

        if ($page == 's') {
            return 'Summary view';
        }

        if ($graph == 'small') {
            return 'Compact chart';
        }
        if ($graph == 'none') {
            return 'Chart hidden';
        }

        return 'Full chart';
    }

    function graph_source_url()
    {
        global $iface, $page, $style, $graph, $graph_format;

        $endpoint = ($graph_format == 'svg') ? 'graph_svg.php' : 'graph.php';

        return $endpoint.'?'.http_build_query(array(
            'if' => $iface,
            'page' => $page,
            'graph' => $graph,
            'style' => $style
        ), '', '&');
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

    function build_summary_cards()
    {
        global $summary, $day, $hour, $month;

        $cards = array();
        $total_rx = (isset($summary['totalrx']) ? $summary['totalrx'] : 0) * 1024 + (isset($summary['totalrxk']) ? $summary['totalrxk'] : 0);
        $total_tx = (isset($summary['totaltx']) ? $summary['totaltx'] : 0) * 1024 + (isset($summary['totaltxk']) ? $summary['totaltxk'] : 0);

        if (count($hour) > 0) {
            $cards[] = array(
                'label' => T('This hour'),
                'rx' => $hour[0]['rx'],
                'tx' => $hour[0]['tx']
            );
        }
        if (count($day) > 0) {
            $cards[] = array(
                'label' => T('This day'),
                'rx' => $day[0]['rx'],
                'tx' => $day[0]['tx']
            );
        }
        if (count($month) > 0) {
            $cards[] = array(
                'label' => T('This month'),
                'rx' => $month[0]['rx'],
                'tx' => $month[0]['tx']
            );
        }
        if ($total_rx > 0 || $total_tx > 0 || count($cards) > 0) {
            $cards[] = array(
                'label' => T('All time'),
                'rx' => $total_rx,
                'tx' => $total_tx
            );
        }

        return $cards;
    }

    function write_empty_state($title, $message)
    {
        print "<div class=\"empty-state\">\n";
        print '<h3>'.h($title)."</h3>\n";
        print '<p>'.h($message)."</p>\n";
        print "</div>\n";
    }

    function write_sidebar()
    {
        global $iface, $iface_list, $page, $page_list, $page_title;

        print "<aside class=\"sidebar\">\n";
        print "  <section class=\"nav-card\">\n";
        print "    <p class=\"nav-card-title\">Interfaces</p>\n";
        print "    <ul class=\"iface-list\">\n";
        foreach ($iface_list as $if) {
            $active = ($iface == $if) ? ' active' : '';
            $current = ($iface == $if) ? ' aria-current="page"' : '';
            print "      <li>\n";
            print '        <a class="iface-link'.$active.'"'.$current.' href="'.h(build_url(array('if' => $if)))."\">\n";
            print '          <span class="iface-link-title">'.h(iface_label($if))."</span>\n";
            print '          <span class="iface-link-meta">'.h($if)."</span>\n";
            print "        </a>\n";
            print "      </li>\n";
        }
        print "    </ul>\n";
        print "  </section>\n";

        print "  <section class=\"nav-card\">\n";
        print "    <p class=\"nav-card-title\">Views</p>\n";
        print "    <ul class=\"view-list\">\n";
        foreach ($page_list as $pg) {
            $active = ($page == $pg) ? ' active' : '';
            $current = ($page == $pg) ? ' aria-current="page"' : '';
            print "      <li>\n";
            print '        <a class="view-link'.$active.'"'.$current.' href="'.h(build_url(array('page' => $pg))).'">'.h(ucfirst($page_title[$pg]))."</a>\n";
            print "      </li>\n";
        }
        print "    </ul>\n";
        print "  </section>\n";
        print "</aside>\n";
    }

    function write_graph_switcher()
    {
        global $graph, $graph_list;

        $labels = array(
            'large' => 'Large',
            'small' => 'Small',
            'none' => 'Hide'
        );

        print "<div class=\"graph-switcher\">\n";
        print "  <p class=\"switcher-label\">Chart size</p>\n";
        print "  <div class=\"segmented-control\">\n";
        foreach ($graph_list as $graph_option) {
            $active = ($graph == $graph_option) ? ' active' : '';
            $current = ($graph == $graph_option) ? ' aria-current="page"' : '';
            print '    <a class="segment'.$active.'"'.$current.' href="'.h(build_url(array('graph' => $graph_option))).'">'.h($labels[$graph_option])."</a>\n";
        }
        print "  </div>\n";
        print "</div>\n";
    }

    function write_summary_cards()
    {
        $cards = build_summary_cards();

        print "<section class=\"panel\">\n";
        print "  <div class=\"panel-header\">\n";
        print "    <div>\n";
        print "      <p class=\"panel-kicker\">Overview</p>\n";
        print '      <h2>'.h(T('Summary'))."</h2>\n";
        print "    </div>\n";
        print "    <p class=\"panel-description\">Current usage rolled up by hour, day, month and total lifetime traffic.</p>\n";
        print "  </div>\n";

        if (count($cards) === 0) {
            write_empty_state('No traffic data yet', 'vnStat returned no current counters for this interface.');
            print "</section>\n";
            return;
        }

        print "  <div class=\"summary-grid\">\n";
        foreach ($cards as $card) {
            $rx = isset($card['rx']) ? $card['rx'] : 0;
            $tx = isset($card['tx']) ? $card['tx'] : 0;
            $total = $rx + $tx;

            print "    <article class=\"metric-card\">\n";
            print '      <p class="metric-label">'.h($card['label'])."</p>\n";
            print '      <p class="metric-total">'.h(kbytes_to_string($total))."</p>\n";
            print "      <div class=\"metric-breakdown\">\n";
            print "        <div class=\"metric-pair metric-pair-in\">\n";
            print "          <span class=\"metric-caption\">".h(T('In'))."</span>\n";
            print '          <strong>'.h(kbytes_to_string($rx))."</strong>\n";
            print "        </div>\n";
            print "        <div class=\"metric-pair metric-pair-out\">\n";
            print "          <span class=\"metric-caption\">".h(T('Out'))."</span>\n";
            print '          <strong>'.h(kbytes_to_string($tx))."</strong>\n";
            print "        </div>\n";
            print "      </div>\n";
            print "    </article>\n";
        }
        print "  </div>\n";
        print "</section>\n";
    }

    function write_data_table($caption, $tab, $empty_message)
    {
        print "<section class=\"panel\">\n";
        print "  <div class=\"panel-header\">\n";
        print "    <div>\n";
        print "      <p class=\"panel-kicker\">Details</p>\n";
        print '      <h2>'.h($caption)."</h2>\n";
        print "    </div>\n";
        print "  </div>\n";

        if (count($tab) === 0) {
            write_empty_state('No data available', $empty_message);
            print "</section>\n";
            return;
        }

        print "  <div class=\"table-scroll\">\n";
        print "    <table class=\"traffic-table\">\n";
        print '      <caption class="sr-only">'.h($caption)."</caption>\n";
        print "      <thead>\n";
        print "        <tr>\n";
        print "          <th scope=\"col\">Period</th>\n";
        print '          <th scope="col">'.h(T('In'))."</th>\n";
        print '          <th scope="col">'.h(T('Out'))."</th>\n";
        print '          <th scope="col">'.h(T('Total'))."</th>\n";
        print "        </tr>\n";
        print "      </thead>\n";
        print "      <tbody>\n";

        for ($i = 0; $i < count($tab); $i++) {
            if (!isset($tab[$i]['act']) || $tab[$i]['act'] != 1) {
                continue;
            }

            $label = isset($tab[$i]['label']) ? $tab[$i]['label'] : '';
            $rx = isset($tab[$i]['rx']) ? $tab[$i]['rx'] : 0;
            $tx = isset($tab[$i]['tx']) ? $tab[$i]['tx'] : 0;
            $total = $rx + $tx;

            print "        <tr>\n";
            print '          <th scope="row">'.h($label)."</th>\n";
            print '          <td class="numeric">'.h(kbytes_to_string($rx))."</td>\n";
            print '          <td class="numeric">'.h(kbytes_to_string($tx))."</td>\n";
            print '          <td class="numeric total-cell">'.h(kbytes_to_string($total))."</td>\n";
            print "        </tr>\n";
        }

        print "      </tbody>\n";
        print "    </table>\n";
        print "  </div>\n";

        print "  <div class=\"traffic-list\">\n";
        for ($i = 0; $i < count($tab); $i++) {
            if (!isset($tab[$i]['act']) || $tab[$i]['act'] != 1) {
                continue;
            }

            $label = isset($tab[$i]['label']) ? $tab[$i]['label'] : '';
            $rx = isset($tab[$i]['rx']) ? $tab[$i]['rx'] : 0;
            $tx = isset($tab[$i]['tx']) ? $tab[$i]['tx'] : 0;
            $total = $rx + $tx;

            print "    <article class=\"traffic-item\">\n";
            print '      <h3>'.h($label)."</h3>\n";
            print "      <dl class=\"traffic-stats\">\n";
            print "        <div>\n";
            print "          <dt>".h(T('In'))."</dt>\n";
            print '          <dd>'.h(kbytes_to_string($rx))."</dd>\n";
            print "        </div>\n";
            print "        <div>\n";
            print "          <dt>".h(T('Out'))."</dt>\n";
            print '          <dd>'.h(kbytes_to_string($tx))."</dd>\n";
            print "        </div>\n";
            print "        <div>\n";
            print "          <dt>".h(T('Total'))."</dt>\n";
            print '          <dd class="traffic-total">'.h(kbytes_to_string($total))."</dd>\n";
            print "        </div>\n";
            print "      </dl>\n";
            print "    </article>\n";
        }
        print "  </div>\n";
        print "</section>\n";
    }

    get_vnstat_data();

    $current_iface_title = iface_label($iface);
    $page_heading = active_view_title();
    $graph_source = graph_source_url();
    $document_title = $page_heading.' - '.T('Traffic data for').' '.$current_iface_title.' ('.$iface.')';

    header('Content-type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title><?php echo h($document_title); ?></title>
  <meta name="description" content="Responsive vnStat traffic dashboard for interface statistics."/>
  <link rel="stylesheet" type="text/css" href="themes/<?php echo h($style); ?>/style.css"/>
</head>
<body class="theme-<?php echo h($style); ?>">
  <div class="page-shell">
    <?php write_sidebar(); ?>

    <main class="content">
      <header class="hero panel">
        <div class="hero-copy">
          <div class="hero-meta">
            <span class="meta-pill"><?php echo h(active_view_title()); ?></span>
            <span class="meta-pill"><?php echo h(graph_mode_label()); ?></span>
            <span class="meta-pill"><?php echo h('Theme: '.ucfirst($style)); ?></span>
          </div>
        </div>
        <?php if ($page != 's') { write_graph_switcher(); } ?>
      </header>

      <?php write_summary_cards(); ?>

      <?php if ($page != 's' && $graph != 'none') { ?>
      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Visualization</p>
            <h2>Traffic chart</h2>
          </div>
          <p class="panel-description">Scales fluidly from phones to large displays without fixed-width breakpoints.</p>
        </div>
        <div class="graph-frame">
          <img class="graph-media" src="<?php echo h($graph_source); ?>" alt="<?php echo h(T('Traffic data for').' '.$current_iface_title); ?>"/>
        </div>
      </section>
      <?php } ?>

      <?php
        if ($page == 's') {
            write_data_table(T('Top 10 days'), $top, 'Daily peak history is not available yet for this interface.');
        } else if ($page == 'h') {
            write_data_table(T('Last 24 hours'), $hour, 'Hourly statistics are not available yet for this interface.');
        } else if ($page == 'd') {
            write_data_table(T('Last 30 days'), $day, 'Daily statistics are not available yet for this interface.');
        } else if ($page == 'm') {
            write_data_table(T('Last 12 months'), $month, 'Monthly statistics are not available yet for this interface.');
        }
      ?>

      <footer class="footer">
        <p>vnStat PHP frontend 1.5.2, refreshed with a responsive layout while keeping the original data interfaces intact.</p>
      </footer>
    </main>
  </div>
</body>
</html>
