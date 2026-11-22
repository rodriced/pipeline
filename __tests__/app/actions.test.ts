import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Contact } from "@/services/contact.service";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath }));

const updateContact = vi.fn();
const changeStage = vi.fn();
const scheduleFollowUp = vi.fn();
const clearFollowUp = vi.fn();
const postponeFollowUp = vi.fn();
vi.mock("@/services/contact.service", () => ({
  contactService: { updateContact, changeStage, scheduleFollowUp, clearFollowUp, postponeFollowUp },
}));

const {
  updateContactAction,
  changeStageAction,
  scheduleFollowUpAction,
  clearFollowUpAction,
  markFollowUpDoneAction,
  postponeFollowUpAction,
} = await import("@/app/actions");

const marie: Contact = {
  id: 1,
  name: "Marie Durand",
  stage: "new",
  createdAt: new Date("2026-11-21T09:00:00Z"),
  company: "Atelier Lumen",
  email: null,
  phone: null,
  notes: null,
  nextFollowUp: null,
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

describe("changeStageAction (lot 3)", () => {
  beforeEach(() => {
    changeStage.mockReset();
    revalidatePath.mockReset();
  });

  it("transmet l'id lié et l'étape brute au service, puis rafraîchit la liste et la fiche", async () => {
    changeStage.mockResolvedValue({ ok: true, contact: { ...marie, stage: "contacted" } });

    await changeStageAction(1, form({ stage: "contacted" }));

    expect(changeStage).toHaveBeenCalledWith(1, "contacted");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/contacts/1");
  });

  it("ne rafraîchit rien si le service refuse l'étape", async () => {
    changeStage.mockResolvedValue({ ok: false, error: "INVALID_STAGE" });

    await changeStageAction(1, form({ stage: "archived" }));

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("relance (lot 4)", () => {
  beforeEach(() => {
    scheduleFollowUp.mockReset();
    clearFollowUp.mockReset();
    revalidatePath.mockReset();
  });

  it("scheduleFollowUpAction transmet l'id lié et la date brute au service, puis rafraîchit", async () => {
    scheduleFollowUp.mockResolvedValue({ ok: true, contact: { ...marie, nextFollowUp: "2026-11-25" } });

    const state = await scheduleFollowUpAction(1, { value: "" }, form({ date: "2026-11-25" }));

    expect(scheduleFollowUp).toHaveBeenCalledWith(1, "2026-11-25");
    expect(state).toEqual({ value: "2026-11-25" });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/contacts/1");
  });

  it.each([
    ["DATE_PAST", "La date de relance ne peut pas être passée."],
    ["DATE_INVALID", "Date invalide."],
    ["CONTACT_CLOSED", "Un contact clôturé ne peut pas avoir de relance."],
  ])("traduit %s en message et conserve la saisie", async (error, message) => {
    scheduleFollowUp.mockResolvedValue({ ok: false, error });

    const state = await scheduleFollowUpAction(1, { value: "" }, form({ date: "2026-11-20" }));

    expect(state).toEqual({ value: "2026-11-20", error: message });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("clearFollowUpAction transmet l'id lié au service, puis rafraîchit", async () => {
    clearFollowUp.mockResolvedValue({ ok: true, contact: marie });

    await clearFollowUpAction(1);

    expect(clearFollowUp).toHaveBeenCalledWith(1);
    expect(revalidatePath).toHaveBeenCalledWith("/contacts/1");
  });
});

describe("relances du jour (lot 5)", () => {
  beforeEach(() => {
    clearFollowUp.mockReset();
    postponeFollowUp.mockReset();
    revalidatePath.mockReset();
  });

  it("markFollowUpDoneAction efface la relance (id lié transmis brut) et rafraîchit la vue du jour", async () => {
    clearFollowUp.mockResolvedValue({ ok: true, contact: marie });

    await markFollowUpDoneAction(1);

    expect(clearFollowUp).toHaveBeenCalledWith(1);
    expect(revalidatePath).toHaveBeenCalledWith("/aujourdhui");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("postponeFollowUpAction reporte la relance (id lié transmis brut) et rafraîchit la vue du jour", async () => {
    postponeFollowUp.mockResolvedValue({ ok: true, contact: { ...marie, nextFollowUp: "2026-11-22" } });

    await postponeFollowUpAction(1);

    expect(postponeFollowUp).toHaveBeenCalledWith(1);
    expect(revalidatePath).toHaveBeenCalledWith("/aujourdhui");
  });

  it("ne rafraîchit rien si le service refuse", async () => {
    postponeFollowUp.mockResolvedValue({ ok: false, error: "NOT_FOUND" });
    clearFollowUp.mockResolvedValue({ ok: false, error: "NOT_FOUND" });

    await postponeFollowUpAction("abc");
    await markFollowUpDoneAction("abc");

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
