import { useRef } from "react";
import { ChevronDown, Moon, Sun, Activity } from "lucide-react";
import { buildSearch, type AppRoute } from "../../lib/api";
import { cn } from "../../lib/utils";
import type { Bootstrap } from "../../types";

interface TopBarProps {
  bootstrap: Bootstrap;
  navigate: (partial: Partial<AppRoute>) => void;
  route: AppRoute;
}

function navHref(route: AppRoute) {
  return buildSearch(route);
}

export function TopBar({
  bootstrap,
  navigate,
  route
}: TopBarProps) {
  const interfaceMenuRef = useRef<HTMLDetailsElement | null>(null);
  const currentInterface =
    bootstrap.options.ifaces.find((option) => option.id === route.iface) ??
    bootstrap.options.ifaces[0];
  const hasMultipleInterfaces = bootstrap.options.ifaces.length > 1;
  const nextStyle = route.style === "dark" ? "light" : "dark";
  const nextStyleOption =
    bootstrap.options.styles.find((option) => option.id === nextStyle) ??
    bootstrap.options.styles[0];
  const nextStyleHref = navHref({ ...route, style: nextStyleOption?.id ?? nextStyle });

  return (
    <header className="sticky top-0 z-40 surface-glass border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--surface-strong)]">
            <Activity className="h-4 w-4" />
          </div>

          {hasMultipleInterfaces ? (
            <details ref={interfaceMenuRef} className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                <span>{currentInterface?.label ?? route.iface}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-[200px] rounded-xl border border-border bg-card p-1.5 surface-shadow">
                <div className="grid gap-0.5">
                  {bootstrap.options.ifaces.map((option) => {
                    const href = navHref({ ...route, iface: option.id });
                    const active = route.iface === option.id;

                    return (
                      <a
                        key={option.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-[var(--accent-soft)] font-medium"
                            : "hover:bg-[var(--accent-soft)]"
                        )}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          interfaceMenuRef.current?.removeAttribute("open");
                          navigate({ iface: option.id });
                        }}
                      >
                        <span>{option.label}</span>
                        {option.meta ? (
                          <span className="text-xs text-muted-foreground">
                            {option.meta}
                          </span>
                        ) : null}
                      </a>
                    );
                  })}
                </div>
              </div>
            </details>
          ) : (
            <span className="text-sm font-semibold">
              {currentInterface?.label ?? route.iface}
            </span>
          )}
        </div>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[var(--accent-soft)] hover:text-foreground"
          aria-label={`${bootstrap.labels.themeWord}: ${nextStyleOption?.label ?? nextStyle}`}
          title={`${bootstrap.labels.themeWord}: ${nextStyleOption?.label ?? nextStyle}`}
          onClick={(event) => {
            event.preventDefault();
            navigate({ style: nextStyleOption?.id ?? nextStyle });
          }}
        >
          {route.style === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
