import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactForm, type ContactFormState } from "@/components/contact-form";

const noop = async (state: ContactFormState) => state;

const values = {
  name: "Marie Durand",
  company: "Atelier Lumen",
  email: "marie@lumen.fr",
  phone: "06 12 34 56 78",
  notes: "Rencontrée au salon",
};

/** Balise <input> ou <textarea> (et son contenu) portant ce name. */
function field(html: string, name: string) {
  const input = html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0];
  if (input) return input;
  return html.match(new RegExp(`<textarea[^>]*name="${name}"[^>]*>[^<]*</textarea>`))?.[0] ?? "";
}

describe("ContactForm", () => {
  it("pré-remplit les cinq champs avec les valeurs du contact", () => {
    const html = renderToStaticMarkup(<ContactForm action={noop} initialState={{ values }} />);

    expect(field(html, "name")).toContain('value="Marie Durand"');
    expect(field(html, "company")).toContain('value="Atelier Lumen"');
    expect(field(html, "email")).toContain('value="marie@lumen.fr"');
    expect(field(html, "phone")).toContain('value="06 12 34 56 78"');
    expect(field(html, "notes")).toContain("Rencontrée au salon");
    expect(html).toContain(">Enregistrer<");
  });

  it("le nom est obligatoire", () => {
    const html = renderToStaticMarkup(<ContactForm action={noop} initialState={{ values }} />);
    expect(field(html, "name")).toMatch(/\brequired\b/);
  });

  it("affiche l'erreur d'email et conserve la saisie", () => {
    const html = renderToStaticMarkup(
      <ContactForm
        action={noop}
        initialState={{ values: { ...values, email: "camille@lumen" }, errors: { email: "Adresse e-mail invalide." } }}
      />,
    );

    expect(html).toContain("Adresse e-mail invalide.");
    expect(field(html, "email")).toContain('aria-invalid="true"');
    expect(field(html, "email")).toContain('value="camille@lumen"');
    expect(field(html, "name")).not.toContain('aria-invalid="true"');
  });

  it("affiche l'erreur de nom", () => {
    const html = renderToStaticMarkup(
      <ContactForm
        action={noop}
        initialState={{ values: { ...values, name: "" }, errors: { name: "Le nom est requis." } }}
      />,
    );

    expect(html).toContain("Le nom est requis.");
    expect(field(html, "name")).toContain('aria-invalid="true"');
  });

  it("confirme l'enregistrement", () => {
    const html = renderToStaticMarkup(<ContactForm action={noop} initialState={{ values, saved: true }} />);
    expect(html).toContain("Modifications enregistrées.");
  });

  it("n'affiche ni erreur ni confirmation au départ", () => {
    const html = renderToStaticMarkup(<ContactForm action={noop} initialState={{ values }} />);
    expect(html).not.toContain('aria-invalid="true"');
    expect(html).not.toContain("Modifications enregistrées.");
  });
});
