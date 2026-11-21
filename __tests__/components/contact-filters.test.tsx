import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactFilters } from "@/components/contact-filters";

const render = (q = "", stage: Parameters<typeof ContactFilters>[0]["stage"] = null) =>
  renderToStaticMarkup(<ContactFilters q={q} stage={stage} />);

describe("ContactFilters (lot 6)", () => {
  it("est un formulaire GET vers la liste : les filtres vont dans l'URL", () => {
    const form = render().match(/<form[^>]*>/)?.[0] ?? "";
    expect(form).toMatch(/method="get"/i);
    expect(form).toContain('action="/"');
  });

  it("propose une recherche et un choix d'étape (toutes + les cinq étapes)", () => {
    const html = render();

    expect(html).toMatch(/<input[^>]*name="q"[^>]*>/);
    const options = [...html.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map((m) => [m[1], m[2]]);
    expect(options).toEqual([
      ["", "Toutes les étapes"],
      ["new", "Nouveau"],
      ["contacted", "Contacté"],
      ["meeting", "RDV"],
      ["won", "Gagné"],
      ["lost", "Perdu"],
    ]);
  });

  it("reprend les filtres de l'URL (rechargement)", () => {
    const html = render("dur", "meeting");

    expect(html.match(/<input[^>]*name="q"[^>]*>/)?.[0]).toContain('value="dur"');
    expect(html).toMatch(/<option[^>]*value="meeting"[^>]*selected/);
  });

  it("propose de réinitialiser seulement quand un filtre est actif", () => {
    expect(render()).not.toContain("Réinitialiser");
    expect(render("dur")).toMatch(/<a[^>]*href="\/"[^>]*>Réinitialiser<\/a>/);
  });
});
