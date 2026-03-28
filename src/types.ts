export type PageKey = "s" | "h" | "d" | "m";
export type GraphKey = "large" | "small" | "none";

export interface NavOption {
  id: string;
  label: string;
  meta?: string;
}

export interface Bootstrap {
  request: {
    iface: string;
    page: PageKey;
    graph: GraphKey;
    style: string;
  };
  language: string;
  byteNotation: string | null;
  documentTitle: string;
  options: {
    ifaces: NavOption[];
    pages: NavOption[];
    graphs: NavOption[];
    styles: NavOption[];
  };
  endpoints: {
    data: string;
    legacyGraph: string;
  };
  labels: {
    interfaces: string;
    views: string;
    themes: string;
    chartSize: string;
    overview: string;
    details: string;
    visualization: string;
    trafficChart: string;
    summaryDescription: string;
    loading: string;
    loadingMessage: string;
    retry: string;
    requestFailed: string;
    footer: string;
    period: string;
    themeWord: string;
    summaryView: string;
    compactChart: string;
    fullChart: string;
    chartHidden: string;
    noTrafficDataTitle: string;
    noTrafficDataMessage: string;
    noChartDataTitle: string;
    noChartDataMessage: string;
    summaryTitle: string;
    in: string;
    out: string;
    total: string;
  };
}

export interface FormattedTraffic {
  rx: string;
  tx: string;
  total: string;
}

export interface SummaryCard {
  id: string;
  label: string;
  rx: number;
  tx: number;
  total: number;
  formatted: FormattedTraffic;
}

export interface DetailRow {
  id: string;
  label: string;
  shortLabel: string;
  time: number;
  rx: number;
  tx: number;
  total: number;
  formatted: FormattedTraffic;
}

export interface AppPayload {
  meta: {
    iface: string;
    ifaceTitle: string;
    page: PageKey;
    pageTitle: string;
    graph: GraphKey;
    style: string;
    documentTitle: string;
    language: string;
  };
  summaryCards: SummaryCard[];
  detail: {
    kind: string;
    title: string;
    emptyTitle: string;
    emptyMessage: string;
    rows: DetailRow[];
  };
  chart: {
    enabled: boolean;
    title: string;
    description: string;
    size: GraphKey;
    points: DetailRow[];
  };
}

declare global {
  interface Window {
    __VNSTAT_BOOTSTRAP__?: Bootstrap;
  }
}
