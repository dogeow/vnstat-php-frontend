import { ArrowDown, ArrowUp } from "lucide-react";
import type { Bootstrap, SummaryCard } from "../../types";

interface SummarySectionProps {
  bootstrap: Bootstrap;
  cards: SummaryCard[];
}

export function SummarySection({
  bootstrap,
  cards
}: SummarySectionProps) {
  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <h3 className="text-sm font-semibold">{bootstrap.labels.noTrafficDataTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {bootstrap.labels.noTrafficDataMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-xl border border-border bg-card p-4 surface-shadow-sm"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
            {card.formatted.total}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-[var(--rx)]">
              <ArrowDown className="h-3 w-3" />
              <span className="font-medium tabular-nums">{card.formatted.rx}</span>
            </span>
            <span className="flex items-center gap-1 text-[var(--tx)]">
              <ArrowUp className="h-3 w-3" />
              <span className="font-medium tabular-nums">{card.formatted.tx}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
