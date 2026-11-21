import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Contact } from "@/services/contact.service";

const getContact = vi.fn<(id: number) => Promise<Contact | null>>();
vi.mock("@/services/contact.service", () => ({ contactService: { getContact } }));

const { ContactDetail } = await import("@/app/contacts/[id]/contact-detail");
const { default: NotFound } = await import("@/app/contacts/[id]/not-found");

const marie: Contact = {
  id: 1,
  name: "Marie Durand",
  stage: "new",
  createdAt: new Date("2026-11-21T09:00:00Z"),
  company: "Atelier Lumen",
  email: "marie@lumen.fr",
  phone: null,
  notes: null,
};

const params = (id: string) => Promise.resolve({ id });
const notFoundError = { digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404") };

describe("Fiche contact", () => {
  beforeEach(() => getContact.mockReset());

  it("affiche la fiche du contact, avec son badge d'étape et la suppression", async () => {
    getContact.mockResolvedValue(marie);

    const html = renderToStaticMarkup(await ContactDetail({ params: params("1") }));

    expect(getContact).toHaveBeenCalledWith(1);
    expect(html).toContain("Marie Durand");
    expect(html).toContain('value="Atelier Lumen"');
    expect(html).toContain(">Nouveau<");
    expect(html).toContain("Supprimer");
  });

  it("renvoie la page introuvable pour un identifiant inexistant", async () => {
    getContact.mockResolvedValue(null);

    await expect(ContactDetail({ params: params("999") })).rejects.toMatchObject(notFoundError);
  });

  it.each(["abc", "1.5", "0", "-3", ""])("renvoie la page introuvable pour un identifiant invalide (%j)", async (id) => {
    await expect(ContactDetail({ params: params(id) })).rejects.toMatchObject(notFoundError);
    expect(getContact).not.toHaveBeenCalled();
  });

  it("la page introuvable l'explique et ramène à la liste", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain("Contact introuvable");
    expect(html).toContain('href="/"');
  });
});
