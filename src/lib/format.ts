import type { DetailRow } from "../types";

function formatUnitParts(
  kbytes: number,
  preferredUnit: string | null
): { value: number; unit: string } {
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

  return {
    value: kbytes / scale,
    unit: units[unitIndex]
  };
}

export function formatKbytes(
  kbytes: number,
  locale: string,
  preferredUnit: string | null
): string {
  const parts = formatUnitParts(kbytes, preferredUnit);

  return `${new Intl.NumberFormat(locale, {
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
  const [value, unit] = text.split(" ");

  if (!value || !unit) {
    return text;
  }

  return `${value}${unit}`;
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

  return `${new Intl.NumberFormat(locale, {
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
