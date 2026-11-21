import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Contact } from "@/services/contact.service";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const updateContact = vi.fn();
vi.mock("@/services/contact.service", () => ({ contactService: { updateContact } }));

const { updateContactAction } = await import("@/app/actions");

const marie: Contact = {
  id: 1,
  name: "Marie Durand",
  stage: "new",
  createdAt: new Date("2026-11-21T09:00:00Z"),
  company: "Atelier Lumen",
  email: null,
  phone: null,
  notes: null,
};

const emptyState = { values: { name: "", company: "", email: "", phone: "", notes: "" } };

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

describe("updateContactAction", () => {
  beforeEach(() => updateContact.mockReset());

  it("transmet au service les champs reçus tels quels, pour validation côté serveur", async () => {
    updateContact.mockResolvedValue({ ok: true, contact: marie });

    await updateContactAction(1, emptyState, form({ $ACTION_REF_1: "", name: " Marie Durand ", company: "Atelier Lumen" }));

    expect(updateContact).toHaveBeenCalledWith(1, { $ACTION_REF_1: "", name: " Marie Durand ", company: "Atelier Lumen" });
  });

  it("traduit les erreurs du service en messages et renvoie la saisie", async () => {
    updateContact.mockResolvedValue({ ok: false, errors: { name: "NAME_REQUIRED", email: "EMAIL_INVALID" } });

    const state = await updateContactAction(1, emptyState, form({ name: "", email: "camille@lumen" }));

    expect(state).toEqual({
      values: { name: "", company: "", email: "camille@lumen", phone: "", notes: "" },
      errors: { name: "Le nom est requis.", email: "Adresse e-mail invalide." },
    });
  });

  it("renvoie les valeurs enregistrées après succès", async () => {
    updateContact.mockResolvedValue({ ok: true, contact: marie });

    const state = await updateContactAction(1, emptyState, form({ name: "Marie Durand", company: "Atelier Lumen" }));

    expect(state).toEqual({
      values: { name: "Marie Durand", company: "Atelier Lumen", email: "", phone: "", notes: "" },
      saved: true,
    });
  });
});
