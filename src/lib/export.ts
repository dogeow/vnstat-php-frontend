import type { Bootstrap, DetailRow } from "../types";

function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildTrafficCsv(
  rows: DetailRow[],
  labels: Pick<Bootstrap["labels"], "period" | "in" | "out" | "total">
): string {
  // Export raw counters in one explicit unit so spreadsheet values remain comparable.
  const lines = [
    [
      labels.period,
      `${labels.in} (KB)`,
      `${labels.out} (KB)`,
      `${labels.total} (KB)`
    ],
    ...rows.map((row) => [row.label, row.rx, row.tx, row.total])
  ];
  return (
    "\uFEFF" +
    lines.map((line) => line.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}
