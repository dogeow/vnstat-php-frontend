import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { buildSearch, type AppRoute } from "../../lib/api";
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
    <Tabs value={route.page} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-4 gap-2 bg-transparent p-0">
        {bootstrap.options.pages.map((option) => {
          const href = navHref({
            ...route,
            page: option.id as AppRoute["page"]
          });

          return (
            <TabsTrigger
              key={option.id}
              value={option.id}
              className="w-full min-w-0 rounded-full border border-border bg-card/90 px-2 py-2.5 text-xs data-[state=active]:border-[var(--accent-strong)] data-[state=active]:bg-card sm:px-4 sm:py-3 sm:text-sm"
              asChild
            >
              <a
                href={href}
                aria-current={route.page === option.id ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  navigate({ page: option.id as AppRoute["page"] });
                }}
              >
                {option.label}
              </a>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
