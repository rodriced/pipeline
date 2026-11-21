import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactList } from "@/components/contact-list";
import type { Contact } from "@/services/contact.service";

const contact = (id: number, name: string, company: string | null = null): Contact => ({
  id,
  name,
  stage: "new",
  createdAt: new Date("2026-11-21T09:00:00Z"),
  company,
  email: null,
  phone: null,
  notes: null,
  nextFollowUp: null,
});

describe("ContactList", () => {
  it("affiche le contact avec le badge « Nouveau »", () => {
    const html = renderToStaticMarkup(<ContactList contacts={[contact(1, "Marie Durand")]} />);
    expect(html).toContain("Marie Durand");
    expect(html).toContain(">Nouveau<");
  });

  it("affiche l'entreprise du contact", () => {
    const html = renderToStaticMarkup(<ContactList contacts={[contact(1, "Marie Durand", "Atelier Lumen")]} />);
    expect(html).toContain("Atelier Lumen");
  });

  it("affiche la date de relance (lot 4)", () => {
    const html = renderToStaticMarkup(
      <ContactList contacts={[{ ...contact(1, "Marie Durand"), nextFollowUp: "2026-11-25" }]} />,
    );
    expect(html).toContain("Relance : 25/11");
  });

  it("n'affiche aucune date sans relance (lot 4)", () => {
    expect(renderToStaticMarkup(<ContactList contacts={[contact(1, "Marie Durand")]} />)).not.toContain("Relance");
  });

  it("chaque contact mène à sa fiche", () => {
    const html = renderToStaticMarkup(<ContactList contacts={[contact(7, "Marie Durand")]} />);
    expect(html).toContain('href="/contacts/7"');
  });

  it("respecte l'ordre reçu", () => {
    const html = renderToStaticMarkup(
      <ContactList contacts={[contact(3, "Récent"), contact(2, "Milieu"), contact(1, "Ancien")]} />,
    );
    const positions = ["Récent", "Milieu", "Ancien"].map((n) => html.indexOf(n));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("affiche « Aucun résultat. » quand une recherche ne trouve rien (lot 6)", () => {
    const html = renderToStaticMarkup(<ContactList contacts={[]} filtered />);
    expect(html).toContain("Aucun résultat.");
    expect(html).not.toContain("Aucun contact pour l’instant");
  });

  it("affiche un message quand la liste est vide", () => {
    expect(renderToStaticMarkup(<ContactList contacts={[]} />)).toContain("Aucun contact pour l’instant");
  });
});
