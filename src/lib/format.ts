import type { DetailRow } from "../types";

function formatUnitParts(
  kbytes: number,
  preferredUnit: string | null
): { value: number; unit: string } {
  const units = ["KB", "MB", "GB", "TB"];
  const safeValue = Number.isFinite(kbytes) ? Math.max(0, kbytes) : 0;
  const preferredIndex = preferredUnit ? units.indexOf(preferredUnit) : -1;
  const unitIndex =
    preferredIndex >= 0
      ? preferredIndex
      : Math.min(
          3,
          Math.max(0, Math.floor(Math.log(safeValue || 1) / Math.log(1024)))
        );

  return {
    value: safeValue / 1024 ** unitIndex,
    unit: units[unitIndex]
  };
}

export function resolveLocale(language: string): string {
  const aliases: Record<string, string> = { cn: "zh-CN", br: "pt-BR" };
  const locale = aliases[language] ?? language;
  try {
    return Intl.NumberFormat.supportedLocalesOf([locale])[0] ?? "en";
  } catch {
    return "en";
  }
}

export function formatKbytes(
  kbytes: number,
  locale: string,
  preferredUnit: string | null
): string {
  const parts = formatUnitParts(kbytes, preferredUnit);

  return `${new Intl.NumberFormat(resolveLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parts.value)} ${parts.unit}`;
}

export function formatCompactKbytes(
  kbytes: number,
  locale: string,
  preferredUnit: string | null
): string {
  const text = formatKbytes(kbytes, locale, preferredUnit);
  return text.replace(/ (KB|MB|GB|TB)$/, "$1");
}

export function formatAxisKbytes(
  kbytes: number,
  locale: string,
  preferredUnit: string | null
): string {
  const parts = formatUnitParts(kbytes, preferredUnit);
  let maximumFractionDigits = 2;

  if (parts.value >= 100) {
    maximumFractionDigits = 0;
  } else if (parts.value >= 10) {
    maximumFractionDigits = 1;
  }

  return `${new Intl.NumberFormat(resolveLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(parts.value)}${parts.unit}`;
}

export function tooltipRows(
  row: DetailRow,
  labels: { in: string; out: string; total: string }
) {
  return [
    { label: labels.in, value: row.formatted.rx },
    { label: labels.out, value: row.formatted.tx },
    { label: labels.total, value: row.formatted.total }
  ];
}
