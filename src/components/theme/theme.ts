// Couche présentation : choix du thème (lot 8). Préférence d'affichage propre au navigateur :
// gardée dans localStorage, appliquée par data-theme sur <html> (« Système » = pas d'attribut).

export type Theme = "light" | "dark" | "system";

export const THEMES: readonly Theme[] = ["light", "dark", "system"];
export const THEME_KEY = "pipeline-theme";

export type ThemeRoot = { setAttribute(name: string, value: string): void; removeAttribute(name: string): void };
export type ThemeStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** Valeur quelconque → thème connu ; tout le reste vaut « Système ». */
export const parseTheme = (value: unknown): Theme =>
  value === "light" || value === "dark" || value === "system" ? value : "system";

export function applyTheme(root: ThemeRoot, theme: Theme) {
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function readStoredTheme(storage: ThemeStorage): Theme {
  try {
    return parseTheme(storage.getItem(THEME_KEY));
  } catch {
    return "system";
  }
}

/** Applique le thème tout de suite, puis l'enregistre (si le stockage est disponible). */
export function selectTheme(theme: Theme, { root, storage }: { root: ThemeRoot; storage: ThemeStorage }) {
  applyTheme(root, theme);
  try {
    storage.setItem(THEME_KEY, theme);
  } catch {
    // stockage indisponible (navigation privée, cookies bloqués) : le choix vaut pour la session en cours
  }
}

/** Script inline exécuté dans <head> avant l'affichage : évite un flash du mauvais thème au chargement. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
