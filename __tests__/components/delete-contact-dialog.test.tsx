import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DeleteContactDialog } from "@/components/delete-contact-dialog";

const action = async () => {};

describe("DeleteContactDialog", () => {
  it("affiche un bouton « Supprimer » qui n'envoie rien par lui-même", () => {
    const html = renderToStaticMarkup(<DeleteContactDialog contactName="Marie Durand" action={action} />);

    const button = html.match(/<button[^>]*>[^<]*Supprimer[^<]*<\/button>/)?.[0] ?? "";
    expect(button).toContain('type="button"');
  });

  it("n'affiche aucun formulaire de suppression tant que la confirmation n'est pas ouverte", () => {
    const html = renderToStaticMarkup(<DeleteContactDialog contactName="Marie Durand" action={action} />);

    expect(html).not.toContain("<form");
    expect(html).not.toContain('type="submit"');
  });
});
