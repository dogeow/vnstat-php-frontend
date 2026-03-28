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
    // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    // GNU General Public License for more details.
    //
    // You should have received a copy of the GNU General Public License
    // along with this program; if not, write to the Free Software
    // Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
    //
    // see file COPYING or at http://www.gnu.org/licenses/gpl.html
    // for more information.

    error_reporting(E_ALL | E_NOTICE);
    date_default_timezone_set('Europe/Amsterdam');

    return [
        'locale' => 'en_US.UTF-8',
        'language' => 'cn',
        'ifaceList' => ['eth0', 'sixxs'],
        'ifaceTitle' => [
            'eth0' => 'Internal',
            'sixxs' => 'SixXS IPv6',
        ],
        'vnstatBin' => '/usr/bin/vnstat',
        'dataDir' => './dumps',
        'byteNotation' => null,
        'defaultStyle' => 'light',
        'pageList' => ['s', 'h', 'd', 'm'],
        'graphList' => ['small'],
        'styleList' => ['light', 'dark'],
    ];
