import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import type { Bootstrap, SummaryCard } from "../../types";

interface SummarySectionProps {
  bootstrap: Bootstrap;
  cards: SummaryCard[];
}

export function SummarySection({
  bootstrap,
  cards
}: SummarySectionProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const activeCard = cards.find((card) => card.id === activeCardId);

  useEffect(() => {
    setActiveCardId(null);
  }, [cards]);

  return (
    <div className="space-y-3">
      {cards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
          <h3 className="text-lg font-semibold">{bootstrap.labels.noTrafficDataTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {bootstrap.labels.noTrafficDataMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {cards.map((card) => {
              const active = activeCardId === card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-[74px] w-full flex-col items-start justify-between rounded-[1.1rem] border border-border bg-card/90 px-2.5 py-2.5 text-left transition-colors sm:min-h-[82px] sm:px-3 sm:py-3",
                    active && "border-[var(--accent-strong)] bg-card"
                  )}
                  onClick={() => {
                    setActiveCardId((current) => (current === card.id ? null : card.id));
                  }}
                >
                  <span className="text-[10px] font-semibold leading-tight text-muted-foreground sm:text-[11px]">
                    {card.label}
                  </span>
                  <span className="text-[13px] font-semibold leading-tight tracking-tight text-card-foreground sm:text-[15px] md:text-base">
                    {card.formatted.total}
                  </span>
                </button>
              );
            })}
          </div>

          {activeCard ? (
            <div className="grid gap-3 rounded-[1.35rem] border border-border bg-card/95 p-4 shadow-none md:grid-cols-2">
              <div className="rounded-2xl bg-[var(--rx-soft)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {bootstrap.labels.in}
                </p>
                <p className="mt-1.5 font-mono text-sm font-semibold sm:text-base">
                  {activeCard.formatted.rx}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--tx-soft)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {bootstrap.labels.out}
                </p>
                <p className="mt-1.5 font-mono text-sm font-semibold sm:text-base">
                  {activeCard.formatted.tx}
                </p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
