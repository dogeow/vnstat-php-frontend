import { Fragment, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import type { AppPayload, Bootstrap } from "../../types";

interface DetailSectionProps {
  bootstrap: Bootstrap;
  payload: AppPayload;
}

export function DetailSection({
  bootstrap,
  payload
}: DetailSectionProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedRowId(null);
  }, [payload.detail.kind, payload.detail.rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{payload.detail.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {payload.detail.rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
            <h3 className="text-lg font-semibold">{payload.detail.emptyTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {payload.detail.emptyMessage}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="overflow-hidden rounded-[24px] border border-border bg-card/90">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{bootstrap.labels.period}</TableHead>
                      <TableHead className="text-right">{bootstrap.labels.total}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payload.detail.rows.map((row) => (
                      <Fragment key={row.id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => {
                            setExpandedRowId((current) =>
                              current === row.id ? null : row.id
                            );
                          }}
                        >
                          <TableCell className="font-semibold">{row.label}</TableCell>
                          <TableCell className="text-right font-mono text-[var(--accent-strong)]">
                            {row.formatted.total}
                          </TableCell>
                        </TableRow>
                        {expandedRowId === row.id ? (
                          <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                            <TableCell colSpan={2}>
                              <div className="grid gap-3 py-2 md:grid-cols-2">
                                <div className="rounded-2xl bg-[var(--rx-soft)] px-4 py-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {bootstrap.labels.in}
                                  </p>
                                  <p className="mt-1 font-mono text-sm font-semibold">
                                    {row.formatted.rx}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-[var(--tx-soft)] px-4 py-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {bootstrap.labels.out}
                                  </p>
                                  <p className="mt-1 font-mono text-sm font-semibold">
                                    {row.formatted.tx}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {payload.detail.rows.map((row) => (
                <Card
                  key={`${row.id}-mobile`}
                  className="rounded-[22px] border-border/80 bg-card/95 shadow-none"
                >
                  <CardContent className="p-4">
                    <button
                      className="flex w-full items-center justify-between gap-4 text-left"
                      type="button"
                      onClick={() => {
                        setExpandedRowId((current) =>
                          current === row.id ? null : row.id
                        );
                      }}
                    >
                      <span className="text-base font-semibold">{row.label}</span>
                      <span className="font-mono text-sm font-semibold text-[var(--accent-strong)]">
                        {row.formatted.total}
                      </span>
                    </button>
                    {expandedRowId === row.id ? (
                      <dl className="mt-4 grid gap-2">
                        <div className="flex items-center justify-between rounded-2xl bg-[var(--rx-soft)] px-4 py-3">
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {bootstrap.labels.in}
                          </dt>
                          <dd className="font-mono text-sm">{row.formatted.rx}</dd>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-[var(--tx-soft)] px-4 py-3">
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {bootstrap.labels.out}
                          </dt>
                          <dd className="font-mono text-sm">{row.formatted.tx}</dd>
                        </div>
                      </dl>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
