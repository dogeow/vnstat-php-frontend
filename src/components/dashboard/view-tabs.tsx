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

export function ViewTabs({
  bootstrap,
  navigate,
  route
}: ViewTabsProps) {
  return (
    <nav className="flex gap-1 rounded-lg bg-[var(--surface-soft)] p-1">
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
              "flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-all",
              active
                ? "bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={(event) => {
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
