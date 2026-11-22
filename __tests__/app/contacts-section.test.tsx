import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Contact } from "@/services/contact.service";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
const searchContacts = vi.fn();
vi.mock("@/services/contact.service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/contact.service")>();
  // Le vrai parseContactFilters (règle pure) ; seule la lecture des contacts est simulée.
  return { ...original, contactService: { searchContacts, parseContactFilters: original.contactService.parseContactFilters } };
});

const { ContactsSection } = await import("@/app/contacts-section");

const marie: Contact = {
  id: 1,
  name: "Marie Durand",
  stage: "meeting",
  createdAt: new Date("2026-11-21T09:00:00Z"),
  company: null,
  email: null,
  phone: null,
  notes: null,
  nextFollowUp: null,
};

const section = async (searchParams: Record<string, string | string[] | undefined>) =>
  renderToStaticMarkup(await ContactsSection({ searchParams: Promise.resolve(searchParams) }));

describe("Liste filtrée (lot 6)", () => {
  beforeEach(() => searchContacts.mockReset());

  it("transmet les paramètres d'URL bruts au service et affiche ses résultats", async () => {
    searchContacts.mockResolvedValue([marie]);

    const html = await section({ q: "dur", stage: "meeting" });

    expect(searchContacts).toHaveBeenCalledWith({ q: "dur", stage: "meeting" });
    expect(html).toContain("Marie Durand");
  });

  it("garde les filtres de l'URL dans le formulaire (rechargement)", async () => {
    searchContacts.mockResolvedValue([marie]);

    const html = await section({ q: "dur", stage: "meeting" });

    expect(html).toMatch(/<input[^>]*name="q"[^>]*value="dur"|<input[^>]*value="dur"[^>]*name="q"/);
    expect(html).toMatch(/<option[^>]*value="meeting"[^>]*selected/);
  });

  it("affiche « Aucun résultat. » quand les filtres ne trouvent rien", async () => {
    searchContacts.mockResolvedValue([]);
    expect(await section({ q: "zzz", stage: "won" })).toContain("Aucun résultat.");
  });

  it("sans filtre et sans contact : « Aucun contact pour l'instant. »", async () => {
    searchContacts.mockResolvedValue([]);
    const html = await section({});
    expect(html).toContain("Aucun contact pour l’instant");
    expect(html).not.toContain("Aucun résultat.");
  });
});
