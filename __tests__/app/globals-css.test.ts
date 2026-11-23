// Lot 8 : le thème de l'app (src/app/globals.css) reprend les tokens de design-system.html (Papier v2).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const ds = readFileSync("design-system.html", "utf8");

const LIGHT = ":root";
const DARK_SYSTEM = ':root:not([data-theme="light"])';
const DARK_CHOSEN = ':root[data-theme="dark"]';

/** Déclarations `--x: valeur;` du premier bloc dont le sélecteur est exactement `selector`. */
function tokens(source: string, selector: string): Map<string, string> {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) return new Map();
  let depth = 0;
  let end = start;
  for (let i = source.indexOf("{", start); i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) { end = i; break; }
  }
  const body = source.slice(start, end);
  return new Map([...body.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim()]));
}

const REQUIRED = [
  "--background", "--surface", "--card", "--popover", "--muted", "--accent",
  "--foreground", "--muted-foreground", "--subtle-foreground",
  "--border", "--border-strong", "--input",
  "--primary", "--primary-hover", "--primary-foreground", "--primary-soft", "--secondary", "--secondary-foreground", "--ring",
  "--destructive", "--destructive-foreground", "--success",
  "--overdue", "--today", "--today-foreground", "--upcoming",
  "--stage-new", "--stage-contacted", "--stage-meeting", "--stage-won", "--stage-lost",
  "--radius", "--shadow-xs", "--shadow-sm", "--shadow-md", "--shadow-lg", "--overlay",
];

describe("Thème Papier v2 (lot 8)", () => {
  it.each([
    ["clair", LIGHT],
    ["sombre (préférence du système)", DARK_SYSTEM],
    ["sombre (choisi)", DARK_CHOSEN],
  ])("thème %s : mêmes valeurs que design-system.html", (_label, selector) => {
    const app = tokens(css, selector);
    const reference = tokens(ds, selector);
    const required = selector === LIGHT ? REQUIRED : REQUIRED.filter((t) => reference.has(t));

    expect([...required].filter((t) => !app.has(t))).toEqual([]);
    const different = [...reference].filter(([t, v]) => app.has(t) && app.get(t) !== v).map(([t]) => t);
    expect(different).toEqual([]);
  });

  it("le sombre choisi et le sombre du système ont exactement les mêmes valeurs", () => {
    expect(Object.fromEntries(tokens(css, DARK_CHOSEN))).toEqual(Object.fromEntries(tokens(css, DARK_SYSTEM)));
  });

  it("sans choix, le sombre suit la préférence du système (sauf si le clair est choisi)", () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)\s*\{/);
  });

  it("les classes dark: (composants shadcn) suivent le même choix", () => {
    const variant = css.match(/@custom-variant dark\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(variant).toContain('[data-theme="dark"]');
    expect(variant).toContain('prefers-color-scheme: dark');
    expect(variant).toContain(':root:not([data-theme="light"])');
    expect(variant).toContain("@slot");
  });

  it("coins arrondis v2 et plus d'ombre décalée", () => {
    expect(tokens(css, LIGHT).get("--radius")).toBe("0.625rem");
    expect(css).not.toMatch(/\d+px \d+px 0 oklch/);
    expect(css).toMatch(/--shadow-card:\s*var\(--shadow-sm\);/);
  });

  it.each(["surface", "subtle-foreground", "border-strong", "overdue", "upcoming", "success", "primary-hover", "primary-soft"])(
    "le token %s est utilisable en classe Tailwind",
    (name) => {
      expect(css).toContain(`--color-${name}: var(--${name});`);
    },
  );
});

describe("Variante dark: compilée par Tailwind (#15)", () => {
  /** Compile la variante `dark` de globals.css avec le vrai Tailwind, pour une classe dark:. */
  async function compiled(candidate: string) {
    const { compile } = await import("tailwindcss");
    const variant = css.match(/@custom-variant dark \{[\s\S]*?\n\}/)?.[0];
    expect(variant).toBeDefined();
    const compiler = await compile(`@tailwind utilities;\n${variant}`);
    return compiler.build([candidate]).replace(/\s+/g, " ");
  }

  it("branche « Sombre » choisie : [data-theme=dark]", async () => {
    const out = await compiled("dark:hidden");
    expect(out).toMatch(/\.dark\\:hidden:where\(\[data-theme="?dark"?\], \[data-theme="?dark"?\] \*\) \{ display: none; \}/);
  });

  it("branche « Système » : sous @media (prefers-color-scheme: dark), sauf si « Clair » est choisi", async () => {
    const out = await compiled("dark:hidden");
    expect(out).toMatch(
      /@media \(prefers-color-scheme: dark\) \{ \.dark\\:hidden:where\(:root:not\(\[data-theme="?light"?\]\), :root:not\(\[data-theme="?light"?\]\) \*\) \{ display: none; \} \}/,
    );
  });
});
