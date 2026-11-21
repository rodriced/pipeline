import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactList } from "@/components/contact-list";
import type { Contact } from "@/services/contact.service";

const contact = (id: number, name: string): Contact => ({
  id,
  name,
  stage: "new",
  createdAt: new Date("2026-11-21T09:00:00Z"),
});

describe("ContactList", () => {
  it("affiche le contact avec le badge « Nouveau »", () => {
    const html = renderToStaticMarkup(<ContactList contacts={[contact(1, "Marie Durand")]} />);
    expect(html).toContain("Marie Durand");
    expect(html).toContain(">Nouveau<");
  });

  it("respecte l'ordre reçu", () => {
    const html = renderToStaticMarkup(
      <ContactList contacts={[contact(3, "Récent"), contact(2, "Milieu"), contact(1, "Ancien")]} />,
    );
    const positions = ["Récent", "Milieu", "Ancien"].map((n) => html.indexOf(n));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("affiche un message quand la liste est vide", () => {
    expect(renderToStaticMarkup(<ContactList contacts={[]} />)).toContain("Aucun contact pour l’instant");
  });
});
