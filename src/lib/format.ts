import type { DetailRow } from "../types";

export function formatKbytes(
  kbytes: number,
  locale: string,
  preferredUnit: string | null
): string {
  const units = ["TB", "GB", "MB", "KB"] as const;
  let scale = 1024 * 1024 * 1024;
  let unitIndex = 0;
  const hasPreferredUnit =
    preferredUnit !== null &&
    units.includes(preferredUnit as (typeof units)[number]);

  while (((kbytes < scale) && scale > 1) || hasPreferredUnit) {
    unitIndex += 1;
    scale /= 1024;

    if (hasPreferredUnit && units[unitIndex] === preferredUnit) {
      break;
    }
  }

  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(kbytes / scale)} ${units[unitIndex]}`;
}

export function formatCompactKbytes(
  kbytes: number,
  locale: string,
  preferredUnit: string | null
): string {
  const text = formatKbytes(kbytes, locale, preferredUnit);
  const [value, unit] = text.split(" ");

  if (!value || !unit) {
    return text;
  }

  return `${value}${unit}`;
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
