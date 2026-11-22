import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddContactForm, type AddContactState } from "@/components/add-contact-form";

const noop = async (state: AddContactState) => state;

describe("AddContactForm", () => {
  it("affiche un champ nom obligatoire et un bouton d'ajout", () => {
    const html = renderToStaticMarkup(<AddContactForm action={noop} />);
    const input = html.match(/<input[^>]*>/)?.[0] ?? "";
    expect(input).toContain('name="name"');
    expect(input).toMatch(/\brequired\b/);
    expect(html).toContain(">Ajouter<");
  });

  it("affiche le message d'erreur renvoyé par l'action", () => {
    const html = renderToStaticMarkup(
      <AddContactForm action={noop} initialState={{ error: "Le nom est requis." }} />,
    );
    expect(html).toContain("Le nom est requis.");
    expect(html).toContain('aria-invalid="true"');
  });

  it("n'affiche pas d'erreur au départ", () => {
    expect(renderToStaticMarkup(<AddContactForm action={noop} />)).not.toContain('aria-invalid="true"');
  });
});

describe("AddContactForm · longueur maximale (#22)", () => {
  it("limite la saisie du nom à 120 caractères", () => {
    const input = renderToStaticMarkup(<AddContactForm action={noop} />).match(/<input[^>]*>/)?.[0] ?? "";
    expect(input).toMatch(/maxLength="120"|maxlength="120"/);
  });
});
