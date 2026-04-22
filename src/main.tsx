import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import type { Bootstrap } from "./types";

function readRequestedStyle(): string {
  const style = new URLSearchParams(window.location.search).get("style");

  if (style && /^[a-z0-9_-]+$/i.test(style)) {
    return style;
  }

  return "light";
}

function syncTheme(style: string) {
  const link = document.getElementById("theme-stylesheet") as HTMLLinkElement | null;

  if (link) {
    link.href = `themes/${style}/style.css`;
  }
}

function buildBootstrapUrl(): string {
  const params = new URLSearchParams(window.location.search);
  params.set("format", "bootstrap");

  return `api/traffic.php?${params.toString()}`;
}

async function fetchBootstrap(): Promise<Bootstrap> {
  const response = await fetch(buildBootstrapUrl(), {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status}`);
  }

  return (await response.json()) as Bootstrap;
}

function BootLoadingScreen() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="rounded-xl border border-border bg-card p-6 surface-shadow-sm">
          <p className="text-sm font-medium">Loading dashboard...</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Preparing the React application.
          </p>
        </div>
      </section>
    </main>
  );
}

function BootErrorScreen({ message }: { message: string }) {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 surface-shadow-sm">
          <p className="text-sm font-medium">Unable to start the dashboard.</p>
          <p className="mt-1 text-xs text-muted-foreground">{message}</p>
        </div>
      </section>
    </main>
  );
}

const rootElement = document.getElementById("app-root");

if (!rootElement) {
  throw new Error("Missing React mount node.");
}

const root = ReactDOM.createRoot(rootElement);

syncTheme(readRequestedStyle());

root.render(
  <React.StrictMode>
    <BootLoadingScreen />
  </React.StrictMode>
);

fetchBootstrap()
  .then((bootstrap) => {
    syncTheme(bootstrap.request.style);

    root.render(
      <React.StrictMode>
        <App bootstrap={bootstrap} />
      </React.StrictMode>
    );
  })
  .catch((reason: unknown) => {
    const message =
      reason instanceof Error
        ? reason.message
        : "Unable to load dashboard bootstrap.";

    root.render(
      <React.StrictMode>
        <BootErrorScreen message={message} />
      </React.StrictMode>
    );
  });
