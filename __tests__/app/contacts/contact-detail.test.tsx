import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Contact } from "@/services/contact.service";

const getContact = vi.fn<(id: unknown) => Promise<Contact | null>>();
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

    // L'identifiant de l'URL est transmis brut : c'est le service qui le valide (zod).
    expect(getContact).toHaveBeenCalledWith("1");
    expect(html).toContain("Marie Durand");
    expect(html).toContain('value="Atelier Lumen"');
    expect(html).toContain(">Nouveau<");
    expect(html).toContain("Supprimer");
  });

  it("propose de changer l'étape depuis la fiche (lot 3)", async () => {
    getContact.mockResolvedValue({ ...marie, stage: "meeting" });

    const html = renderToStaticMarkup(await ContactDetail({ params: params("1") }));

    expect(html).toMatch(/name="stage"[^>]*value="lost"|value="lost"[^>]*name="stage"/);
    expect(html).toContain(">RDV<");
  });

  it("renvoie la page introuvable pour un identifiant inexistant", async () => {
    getContact.mockResolvedValue(null);

    await expect(ContactDetail({ params: params("999") })).rejects.toMatchObject(notFoundError);
  });

  it("délègue la validation de l'identifiant au service et renvoie la page introuvable s'il le rejette", async () => {
    getContact.mockResolvedValue(null);

    await expect(ContactDetail({ params: params("abc") })).rejects.toMatchObject(notFoundError);
    expect(getContact).toHaveBeenCalledWith("abc");
  });

  it("la page introuvable l'explique et ramène à la liste", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain("Contact introuvable");
    expect(html).toContain('href="/"');
  });
});
