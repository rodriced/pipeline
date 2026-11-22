import vm from "node:vm";
import { describe, expect, it } from "vitest";
import {
  THEME_KEY,
  applyTheme,
  parseTheme,
  readStoredTheme,
  selectTheme,
  themeInitScript,
  type ThemeRoot,
  type ThemeStorage,
} from "@/components/theme/theme";

function fakeRoot(initial?: string) {
  const attrs = new Map<string, string>(initial ? [["data-theme", initial]] : []);
  const root: ThemeRoot & { theme: () => string | null } = {
    setAttribute: (name, value) => void attrs.set(name, value),
    removeAttribute: (name) => void attrs.delete(name),
    theme: () => attrs.get("data-theme") ?? null,
  };
  return root;
}

function fakeStorage(initial?: string) {
  const values = new Map<string, string>(initial === undefined ? [] : [[THEME_KEY, initial]]);
  const storage: ThemeStorage & { values: Map<string, string> } = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    values,
  };
  return storage;
}

const brokenStorage: ThemeStorage = {
  getItem: () => { throw new Error("stockage bloqué"); },
  setItem: () => { throw new Error("stockage bloqué"); },
};

/** Exécute le script inline comme le ferait le navigateur avant l'affichage. */
function runInitScript(storage: ThemeStorage) {
  const root = fakeRoot();
  vm.runInNewContext(themeInitScript, { document: { documentElement: root }, localStorage: storage });
  return root.theme();
}

describe("Choix du thème (lot 8)", () => {
  it.each([
    ["light", "light"],
    ["dark", "dark"],
    ["system", "system"],
    [null, "system"],
    ["", "system"],
    ["DARK", "system"],
    ["bleu", "system"],
    [42, "system"],
  ])("parseTheme(%j) → %s", (value, expected) => {
    expect(parseTheme(value)).toBe(expected);
  });

  it("appliquer « Sombre » ou « Clair » pose data-theme ; « Système » le retire", () => {
    const root = fakeRoot();
    applyTheme(root, "dark");
    expect(root.theme()).toBe("dark");
    applyTheme(root, "light");
    expect(root.theme()).toBe("light");
    applyTheme(root, "system");
    expect(root.theme()).toBeNull();
  });

  it("choisir un thème l'applique aussitôt et l'enregistre", () => {
    const root = fakeRoot();
    const storage = fakeStorage();

    selectTheme("dark", { root, storage });

    expect(root.theme()).toBe("dark");
    expect(storage.values.get(THEME_KEY)).toBe("dark");
  });

  it("si le stockage est indisponible, le thème est quand même appliqué", () => {
    const root = fakeRoot();
    expect(() => selectTheme("light", { root, storage: brokenStorage })).not.toThrow();
    expect(root.theme()).toBe("light");
  });

  it("relit le choix enregistré ; « system » si absent, invalide ou illisible", () => {
    expect(readStoredTheme(fakeStorage("dark"))).toBe("dark");
    expect(readStoredTheme(fakeStorage())).toBe("system");
    expect(readStoredTheme(fakeStorage("violet"))).toBe("system");
    expect(readStoredTheme(brokenStorage)).toBe("system");
  });

  describe("script exécuté avant l'affichage (rechargement)", () => {
    it.each([
      ["dark", "dark"],
      ["light", "light"],
    ])("choix « %s » enregistré → data-theme=%s", (stored, expected) => {
      expect(runInitScript(fakeStorage(stored))).toBe(expected);
    });

    it.each([[undefined], ["system"], ["violet"]])("aucun choix valide (%j) → pas de data-theme : le système décide", (stored) => {
      expect(runInitScript(fakeStorage(stored))).toBeNull();
    });

    it("stockage illisible → pas d'erreur, pas de data-theme", () => {
      expect(() => runInitScript(brokenStorage)).not.toThrow();
      expect(runInitScript(brokenStorage)).toBeNull();
    });
  });
});
