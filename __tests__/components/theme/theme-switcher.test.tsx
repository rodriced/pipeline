import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

describe("ThemeSwitcher (lot 8)", () => {
  const html = renderToStaticMarkup(<ThemeSwitcher />);
  const buttons = [...html.matchAll(/<button([^>]*)>/g)].map((m) => m[1]);

  it("propose Clair, Sombre et Système dans un groupe étiqueté « Thème »", () => {
    expect(html).toMatch(/role="group"[^>]*aria-label="Thème"|aria-label="Thème"[^>]*role="group"/);
    expect(buttons.map((b) => b.match(/aria-label="([^"]+)"/)?.[1])).toEqual(["Clair", "Sombre", "Système"]);
    expect(buttons.every((b) => b.includes('type="button"'))).toBe(true);
  });

  it("au rendu serveur, « Système » est le choix affiché (le vrai choix est relu dans le navigateur)", () => {
    expect(buttons.map((b) => b.match(/aria-pressed="(true|false)"/)?.[1])).toEqual(["false", "false", "true"]);
  });
});

describe("ThemeSwitcher · composant Button et focus visible (#14)", () => {
  const html = renderToStaticMarkup(<ThemeSwitcher />);
  const buttons = [...html.matchAll(/<button([^>]*)>/g)].map((m) => m[1]);

  it("chaque option est un Button shadcn (ghost, icon-sm) avec l'anneau de focus", () => {
    expect(buttons).toHaveLength(3);
    for (const b of buttons) {
      expect(b).toContain('data-slot="button"');
      expect(b).toContain("focus-visible:ring-3");
      expect(b).toContain("size-7");
    }
  });
});
