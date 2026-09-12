import { buildSearch, type AppRoute } from "../../lib/api";
import { cn } from "../../lib/utils";
import type { Bootstrap } from "../../types";

interface ViewTabsProps {
  bootstrap: Bootstrap;
  navigate: (partial: Partial<AppRoute>) => void;
  route: AppRoute;
}

function navHref(route: AppRoute) {
  return buildSearch(route);
}

export function ViewTabs({ bootstrap, navigate, route }: ViewTabsProps) {
  return (
    <nav
      aria-label={bootstrap.labels.views}
      className="flex gap-1 rounded-xl border border-border bg-[var(--surface-soft)] p-1 sm:w-fit sm:min-w-[400px]"
    >
      {bootstrap.options.pages.map((option) => {
        const href = navHref({
          ...route,
          page: option.id as AppRoute["page"]
        });
        const active = route.page === option.id;

        return (
          <a
            key={option.id}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 flex-1 items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
              active
                ? "bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              navigate({ page: option.id as AppRoute["page"] });
            }}
          >
            {option.label}
          </a>
        );
      })}
    </nav>
  );
}
