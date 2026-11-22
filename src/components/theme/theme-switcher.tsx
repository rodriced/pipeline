"use client";

// Couche présentation : sélecteur Clair / Sombre / Système (lot 8).
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { applyTheme, readStoredTheme, selectTheme, THEME_KEY, type Theme, type ThemeStorage } from "@/components/theme/theme";

const OPTIONS: { theme: Theme; label: string; Icon: typeof SunIcon }[] = [
  { theme: "light", label: "Clair", Icon: SunIcon },
  { theme: "dark", label: "Sombre", Icon: MoonIcon },
  { theme: "system", label: "Système", Icon: MonitorIcon },
];

const noStorage: ThemeStorage = { getItem: () => null, setItem: () => {} };
function storage(): ThemeStorage {
  try {
    return window.localStorage;
  } catch {
    return noStorage;
  }
}

const listeners = new Set<() => void>();
function subscribe(onChange: () => void) {
  // Un choix fait dans un autre onglet s'applique aussi ici.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY) return;
    applyTheme(document.documentElement, readStoredTheme(storage()));
    onChange();
  };
  listeners.add(onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}
const getSnapshot = () => readStoredTheme(storage());
const getServerSnapshot = (): Theme => "system";

export function ThemeSwitcher() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function choose(theme: Theme) {
    selectTheme(theme, { root: document.documentElement, storage: storage() });
    listeners.forEach((listener) => listener());
  }

  return (
    <div role="group" aria-label="Thème" className="inline-flex gap-0.5 rounded-lg bg-muted p-0.5">
      {OPTIONS.map(({ theme, label, Icon }) => (
        <button
          key={theme}
          type="button"
          aria-label={label}
          title={label}
          aria-pressed={current === theme}
          onClick={() => choose(theme)}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-xs"
        >
          <Icon className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}
