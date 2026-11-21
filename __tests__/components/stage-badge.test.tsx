import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StageBadge } from "@/components/stage-badge";

describe("StageBadge", () => {
  it.each([
    ["new", "Nouveau"],
    ["contacted", "Contacté"],
    ["meeting", "RDV"],
    ["won", "Gagné"],
    ["lost", "Perdu"],
  ] as const)("affiche l'étape %s en français (%s) avec sa couleur de token", (stage, label) => {
    const html = renderToStaticMarkup(<StageBadge stage={stage} />);
    expect(html).toContain(`>${label}<`);
    expect(html).toContain(`text-stage-${stage}`);
  });
});
