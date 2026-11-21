import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StageSelector } from "@/components/stage-selector";

const action = async () => {};

// Attribut HTML disabled (et pas la classe Tailwind « disabled:… »).
const DISABLED = /(^|\s)disabled(=|\s|$)/;

/** Boutons d'étape : [valeur, attributs, libellé]. */
function stageButtons(html: string) {
  return [...html.matchAll(/<button([^>]*name="stage"[^>]*)>([^<]*)<\/button>/g)].map((m) => ({
    value: m[1].match(/value="([^"]+)"/)?.[1],
    attrs: m[1],
    label: m[2],
  }));
}

describe("StageSelector (lot 3)", () => {
  it("propose les cinq étapes, en français, dans l'ordre du pipeline", () => {
    const buttons = stageButtons(renderToStaticMarkup(<StageSelector stage="new" action={action} />));

    expect(buttons.map((b) => b.value)).toEqual(["new", "contacted", "meeting", "won", "lost"]);
    expect(buttons.map((b) => b.label)).toEqual(["Nouveau", "Contacté", "RDV", "Gagné", "Perdu"]);
  });

  it("chaque autre étape est un bouton d'envoi du formulaire", () => {
    const html = renderToStaticMarkup(<StageSelector stage="new" action={action} />);

    expect(html).toContain("<form");
    for (const b of stageButtons(html).filter((b) => b.value !== "new")) {
      expect(b.attrs).toContain('type="submit"');
      expect(b.attrs).not.toMatch(DISABLED);
    }
  });

  it("l'étape actuelle est signalée et ne peut pas être renvoyée", () => {
    const current = stageButtons(renderToStaticMarkup(<StageSelector stage="won" action={action} />)).find(
      (b) => b.value === "won",
    );

    expect(current?.attrs).toContain('aria-pressed="true"');
    expect(current?.attrs).toMatch(DISABLED);
  });
});
