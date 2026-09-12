import { ArrowDown, ArrowUp } from "lucide-react";
import type { Bootstrap, SummaryCard } from "../../types";

export function SummarySection({
  bootstrap,
  cards
}: {
  bootstrap: Bootstrap;
  cards: SummaryCard[];
}) {
  return (
    <section
      aria-label={bootstrap.labels.summaryTitle}
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {cards.map((card) => (
        <article
          key={card.id}
          className="min-w-0 rounded-xl border border-border bg-card p-4 surface-shadow-sm sm:p-5"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-3 break-words text-xl font-semibold tabular-nums tracking-tight sm:text-2xl xl:text-[1.7rem]">
            {card.formatted.total}
          </p>
          <div
            className="mb-3 mt-4 flex h-1 overflow-hidden rounded-full bg-[var(--surface-soft)]"
            aria-hidden="true"
          >
            {card.total > 0 ? (
              <>
                <span
                  className="bg-[var(--rx-bar)]"
                  style={{ width: `${(card.rx / card.total) * 100}%` }}
                />
                <span
                  className="bg-[var(--tx-bar)]"
                  style={{ width: `${(card.tx / card.total) * 100}%` }}
                />
              </>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5 text-xs">
            <span className="flex items-center gap-1 text-[var(--rx)]">
              <ArrowDown aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="sr-only">{bootstrap.labels.in}: </span>
              <span className="break-all font-medium tabular-nums">
                {card.formatted.rx}
              </span>
            </span>
            <span className="flex items-center gap-1 text-[var(--tx)]">
              <ArrowUp aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="sr-only">{bootstrap.labels.out}: </span>
              <span className="break-all font-medium tabular-nums">
                {card.formatted.tx}
              </span>
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}
