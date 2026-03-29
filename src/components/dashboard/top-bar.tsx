import { useRef } from "react";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { buttonVariants } from "../ui/button";
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
    <header className="sticky top-0 z-40 border-b border-border bg-[color:var(--surface)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {hasMultipleInterfaces ? (
          <details ref={interfaceMenuRef} className="group relative shrink-0">
            <summary
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "flex h-auto min-w-[180px] list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left shadow-none [&::-webkit-details-marker]:hidden"
              )}
            >
              <span className="flex flex-col items-start gap-1">
                <span className="flex items-center gap-2">
                  <span>{currentInterface?.label ?? route.iface}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {currentInterface?.meta ?? route.iface}
                  </span>
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-72 rounded-[1.35rem] border border-border bg-card p-2 shadow-[var(--shadow)]">
              <div className="grid gap-1">
                {bootstrap.options.ifaces.map((option) => {
                  const href = navHref({ ...route, iface: option.id });
                  const active = route.iface === option.id;

                  return (
                    <a
                      key={option.id}
                      className={cn(
                        buttonVariants({
                          variant: active ? "secondary" : "ghost",
                          size: "sm"
                        }),
                        "h-auto justify-between rounded-xl px-3 py-3 text-left"
                      )}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        interfaceMenuRef.current?.removeAttribute("open");
                        navigate({ iface: option.id });
                      }}
                    >
                      <span className="flex flex-col items-start gap-1">
                        <span>{option.label}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {option.meta ?? option.id}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </details>
        ) : (
          <div
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-auto min-w-[180px] justify-start rounded-2xl px-4 py-3 text-left shadow-none"
            )}
          >
            <span className="flex items-center gap-2">
              <span>{currentInterface?.label ?? route.iface}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {currentInterface?.meta ?? route.iface}
              </span>
            </span>
          </div>
        )}

        <a
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "shrink-0 rounded-full"
          )}
          href={nextStyleHref}
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
        </a>
      </div>
    </header>
  );
}
