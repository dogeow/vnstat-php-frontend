const STORAGE_KEY = "vnstat-theme";

export function readSavedTheme(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function syncTheme(style: string) {
  if (!/^[a-z0-9_-]+$/i.test(style)) return;
  const link = document.getElementById(
    "theme-stylesheet"
  ) as HTMLLinkElement | null;
  const href = `themes/${style}/style.css`;
  if (link && link.getAttribute("href") !== href) link.href = href;
  try {
    window.localStorage.setItem(STORAGE_KEY, style);
  } catch {
    // Theme switching also works when browser storage is unavailable.
  }
}
