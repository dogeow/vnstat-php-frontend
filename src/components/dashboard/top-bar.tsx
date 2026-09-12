import { Activity, ChevronDown, Moon, Sun } from "lucide-react";
import type { AppRoute } from "../../lib/api";
import type { Bootstrap } from "../../types";

interface TopBarProps {
  bootstrap: Bootstrap;
  navigate: (partial: Partial<AppRoute>) => void;
  route: AppRoute;
}

export function TopBar({ bootstrap, navigate, route }: TopBarProps) {
  const currentInterface = bootstrap.options.ifaces.find(
    (option) => option.id === route.iface
  );
  const styles = bootstrap.options.styles;
  const styleIndex = styles.findIndex((option) => option.id === route.style);
  const nextStyle = styles[(styleIndex + 1) % styles.length];

  return (
    <header className="sticky top-0 z-40 border-b border-border surface-glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)]">
            <Activity aria-hidden="true" className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">vnStat</span>
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {bootstrap.options.ifaces.length > 1 ? (
            <label className="relative min-w-0">
              <span className="sr-only">{bootstrap.labels.interfaces}</span>
              <select
                className="h-10 w-full max-w-[min(48vw,22rem)] appearance-none truncate rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-sm font-medium sm:max-w-sm"
                value={route.iface}
                onChange={(event) => navigate({ iface: event.target.value })}
              >
                {bootstrap.options.ifaces.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                    {option.label !== option.id ? ` · ${option.id}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-muted-foreground"
              />
            </label>
          ) : (
            <span className="truncate text-sm font-medium">
              {currentInterface?.label ?? route.iface}
            </span>
          )}
          {styles.length > 1 && nextStyle ? (
            <button
              type="button"
              className="control-button h-10 w-10 shrink-0 px-0"
              aria-label={`${bootstrap.labels.themeWord}: ${nextStyle.label}`}
              title={`${bootstrap.labels.themeWord}: ${nextStyle.label}`}
              onClick={() => navigate({ style: nextStyle.id })}
            >
              {route.style === "dark" ? (
                <Sun aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Moon aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
