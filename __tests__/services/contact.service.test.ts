import { describe, expect, it, vi } from "vitest";
import type { Contact, ContactFields, ContactRepository, NewContact, Stage } from "@/data/contact.repository";
import { createContactService, STAGES } from "@/services/contact.service";

function fakeRepo() {
  const contacts: Contact[] = [];
  const repo: ContactRepository = {
    create: vi.fn(async (input: NewContact) => {
      const contact: Contact = {
        id: contacts.length + 1,
        company: null,
        email: null,
        phone: null,
        notes: null,
        nextFollowUp: null,
        ...input,
      };
      contacts.push(contact);
      return contact;
    }),
    listByMostRecent: async () =>
      [...contacts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id),
    findById: vi.fn(async (id: number) => contacts.find((c) => c.id === id) ?? null),
    update: vi.fn(async (id: number, fields: ContactFields) => {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return null;
      Object.assign(contact, fields);
      return { ...contact };
    }),
    delete: vi.fn(async (id: number) => {
      const index = contacts.findIndex((c) => c.id === id);
      if (index === -1) return false;
      contacts.splice(index, 1);
      return true;
    }),
    updateStage: vi.fn(async (id: number, stage: Stage) => {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return null;
      contact.stage = stage;
      return { ...contact };
    }),
    setFollowUp: vi.fn(async (id: number, date: string | null) => {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return null;
      contact.nextFollowUp = date;
      return { ...contact };
    }),
    listWithFollowUpDueBy: vi.fn(async (date: string) =>
      contacts
        .filter((c) => c.nextFollowUp !== null && c.nextFollowUp <= date)
        .sort((a, b) => a.nextFollowUp!.localeCompare(b.nextFollowUp!) || a.id - b.id)
        .map((c) => ({ ...c })),
    ),
  };
  return repo;
}

// Midi, heure locale : « aujourd'hui » vaut 2026-11-21 quel que soit le fuseau de la machine.
const fixedNow = () => new Date(2026, 10, 21, 12, 0, 0);

async function withMarie() {
  const repo = fakeRepo();
  const service = createContactService(repo, fixedNow);
  const result = await service.addContact("Marie Durand");
  if (!result.ok) throw new Error("setup");
  return { repo, service, id: result.contact.id };
}

describe("createContactService", () => {
  describe("addContact", () => {
    it("ajoute un contact à l'étape « new » et il apparaît dans la liste", async () => {
      const service = createContactService(fakeRepo(), fixedNow);

      const result = await service.addContact("Marie Durand");

      expect(result).toMatchObject({ ok: true, contact: { name: "Marie Durand", stage: "new" } });
      await expect(service.listContacts()).resolves.toEqual([
        expect.objectContaining({ name: "Marie Durand", stage: "new" }),
      ]);
    });

    it.each(["", "   ", "\t\n"])("refuse un nom vide ou fait d'espaces (%j) sans rien enregistrer", async (name) => {
      const repo = fakeRepo();
      const service = createContactService(repo, fixedNow);

      await expect(service.addContact(name)).resolves.toEqual({ ok: false, error: "NAME_REQUIRED" });
      expect(repo.create).not.toHaveBeenCalled();
      await expect(service.listContacts()).resolves.toEqual([]);
    });

    it("retire les espaces autour du nom", async () => {
      const service = createContactService(fakeRepo(), fixedNow);

      await service.addContact("  Marie Durand  ");

      await expect(service.listContacts()).resolves.toEqual([
        expect.objectContaining({ name: "Marie Durand" }),
      ]);
    });

    it("date le contact avec l'horloge injectée", async () => {
      const repo = fakeRepo();
      const service = createContactService(repo, fixedNow);

      await service.addContact("Marie Durand");

      expect(repo.create).toHaveBeenCalledWith({
        name: "Marie Durand",
        stage: "new",
        createdAt: fixedNow(),
      });
    });
  });

  describe("listContacts", () => {
    it("renvoie les contacts du plus récent au plus ancien", async () => {
      let t = Date.parse("2026-11-21T09:00:00Z");
      const service = createContactService(fakeRepo(), () => new Date((t += 60_000)));

      await service.addContact("Ancien");
      await service.addContact("Milieu");
      await service.addContact("Récent");

      const names = (await service.listContacts()).map((c) => c.name);
      expect(names).toEqual(["Récent", "Milieu", "Ancien"]);
    });
  });

  describe("getContact", () => {
    it("renvoie le contact demandé", async () => {
      const { service, id } = await withMarie();
      await expect(service.getContact(id)).resolves.toMatchObject({ id, name: "Marie Durand" });
    });

    it("renvoie null pour un identifiant inexistant", async () => {
      const { service } = await withMarie();
      await expect(service.getContact(999)).resolves.toBeNull();
    });
  });

  describe("updateContact", () => {
    it("enregistre l'entreprise, visible sur la fiche et dans la liste", async () => {
      const { service, id } = await withMarie();

      const result = await service.updateContact(id, { name: "Marie Durand", company: "Atelier Lumen" });

      expect(result).toMatchObject({ ok: true, contact: { company: "Atelier Lumen" } });
      await expect(service.getContact(id)).resolves.toMatchObject({ company: "Atelier Lumen" });
      await expect(service.listContacts()).resolves.toEqual([
        expect.objectContaining({ id, company: "Atelier Lumen" }),
      ]);
    });

    it("enregistre tous les champs, nettoyés, et met les champs vides à null", async () => {
      const { repo, service, id } = await withMarie();

      await service.updateContact(id, {
        name: "  Marie Durand ",
        company: "  ",
        email: " marie@lumen.fr ",
        phone: " 06 12 34 56 78 ",
        notes: "  Rencontrée au salon  ",
      });

      expect(repo.update).toHaveBeenCalledWith(id, {
        name: "Marie Durand",
        company: null,
        email: "marie@lumen.fr",
        phone: "06 12 34 56 78",
        notes: "Rencontrée au salon",
      });
    });

    it.each(["camille@lumen", "sans-arobase", "a b@c.fr", "@lumen.fr"])(
      "refuse un email mal formé (%j) sans rien modifier",
      async (email) => {
        const { repo, service, id } = await withMarie();

        const result = await service.updateContact(id, { name: "Marie Durand", email });

        expect(result).toEqual({ ok: false, errors: { email: "EMAIL_INVALID" } });
        expect(repo.update).not.toHaveBeenCalled();
      },
    );

    it("accepte un email vide (champ facultatif)", async () => {
      const { service, id } = await withMarie();
      await expect(service.updateContact(id, { name: "Marie Durand", email: "  " })).resolves.toMatchObject({
        ok: true,
        contact: { email: null },
      });
    });

    it("refuse un nom vidé, sans rien modifier", async () => {
      const { repo, service, id } = await withMarie();

      const result = await service.updateContact(id, { name: "   ", company: "Atelier Lumen" });

      expect(result).toEqual({ ok: false, errors: { name: "NAME_REQUIRED" } });
      expect(repo.update).not.toHaveBeenCalled();
      await expect(service.getContact(id)).resolves.toMatchObject({ name: "Marie Durand", company: null });
    });

    it("signale toutes les erreurs à la fois", async () => {
      const { service, id } = await withMarie();
      await expect(service.updateContact(id, { name: "", email: "x@y" })).resolves.toEqual({
        ok: false,
        errors: { name: "NAME_REQUIRED", email: "EMAIL_INVALID" },
      });
    });

    it("renvoie NOT_FOUND pour un identifiant inexistant", async () => {
      const { service } = await withMarie();
      await expect(service.updateContact(999, { name: "Paul" })).resolves.toEqual({
        ok: false,
        error: "NOT_FOUND",
      });
    });
  });

  describe("validation des données reçues (entrée non typée)", () => {
    it.each([undefined, null, 42, {}])("addContact refuse un nom qui n'est pas une chaîne (%j)", async (name) => {
      const repo = fakeRepo();
      const service = createContactService(repo, fixedNow);

      await expect(service.addContact(name)).resolves.toEqual({ ok: false, error: "NAME_REQUIRED" });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it.each([undefined, null, "texte", 42])("updateContact refuse une saisie qui n'est pas un objet (%j)", async (input) => {
      const { repo, service, id } = await withMarie();

      await expect(service.updateContact(id, input)).resolves.toEqual({ ok: false, errors: { name: "NAME_REQUIRED" } });
      expect(repo.update).not.toHaveBeenCalled();
    });

    it("updateContact refuse un nom absent ou non textuel", async () => {
      const { service, id } = await withMarie();

      await expect(service.updateContact(id, { company: "Atelier Lumen" })).resolves.toEqual({
        ok: false,
        errors: { name: "NAME_REQUIRED" },
      });
      await expect(service.updateContact(id, { name: 42 })).resolves.toEqual({
        ok: false,
        errors: { name: "NAME_REQUIRED" },
      });
    });

    it("updateContact refuse un email non textuel", async () => {
      const { service, id } = await withMarie();
      await expect(service.updateContact(id, { name: "Marie Durand", email: 42 })).resolves.toEqual({
        ok: false,
        errors: { email: "EMAIL_INVALID" },
      });
    });

    it("updateContact ignore les champs inconnus (ex. champs techniques du formulaire)", async () => {
      const { repo, service, id } = await withMarie();

      await service.updateContact(id, { name: "Marie Durand", $ACTION_REF_1: "", stage: "won", id: 999 });

      expect(repo.update).toHaveBeenCalledWith(id, {
        name: "Marie Durand",
        company: null,
        email: null,
        phone: null,
        notes: null,
      });
    });
  });

  describe("changeStage (lot 3)", () => {
    const ACTIVE = ["new", "contacted", "meeting"] as const;
    const CLOSED = ["won", "lost"] as const;

    it("expose les cinq étapes, dans l'ordre du pipeline", () => {
      expect(STAGES).toEqual(["new", "contacted", "meeting", "won", "lost"]);
    });

    it("passe un contact « Nouveau » à « Contacté », visible sur la fiche et dans la liste", async () => {
      const { service, id } = await withMarie();

      const result = await service.changeStage(id, "contacted");

      expect(result).toMatchObject({ ok: true, contact: { id, stage: "contacted" } });
      await expect(service.getContact(id)).resolves.toMatchObject({ stage: "contacted" });
      await expect(service.listContacts()).resolves.toEqual([expect.objectContaining({ id, stage: "contacted" })]);
    });

    it.each(ACTIVE)("accepte le passage de « %s » à « Perdu »", async (from) => {
      const { service, id } = await withMarie();
      await service.changeStage(id, from);

      await expect(service.changeStage(id, "lost")).resolves.toMatchObject({ ok: true, contact: { stage: "lost" } });
    });

    it.each(CLOSED.flatMap((from) => ACTIVE.map((to) => [from, to] as const)))(
      "rouvre un contact « %s » en le remettant à « %s »",
      async (from, to) => {
        const { service, id } = await withMarie();
        await service.changeStage(id, from);

        await expect(service.changeStage(id, to)).resolves.toMatchObject({ ok: true, contact: { stage: to } });
      },
    );

    it.each(["archived", "NEW", "", " new", null, undefined, 42, {}])(
      "rejette une étape qui n'existe pas (%j) sans rien modifier",
      async (stage) => {
        const { repo, service, id } = await withMarie();

        await expect(service.changeStage(id, stage)).resolves.toEqual({ ok: false, error: "INVALID_STAGE" });
        expect(repo.updateStage).not.toHaveBeenCalled();
        await expect(service.getContact(id)).resolves.toMatchObject({ stage: "new" });
      },
    );

    it.each([999, "abc", null])("renvoie NOT_FOUND pour un identifiant inexistant ou invalide (%j)", async (bad) => {
      const { service } = await withMarie();
      await expect(service.changeStage(bad, "contacted")).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
    });
  });

  describe("relance (lot 4)", () => {
    it("planifie une relance, visible sur la fiche et dans la liste", async () => {
      const { service, id } = await withMarie();

      const result = await service.scheduleFollowUp(id, "2026-11-25");

      expect(result).toMatchObject({ ok: true, contact: { nextFollowUp: "2026-11-25" } });
      await expect(service.getContact(id)).resolves.toMatchObject({ nextFollowUp: "2026-11-25" });
      await expect(service.listContacts()).resolves.toEqual([expect.objectContaining({ nextFollowUp: "2026-11-25" })]);
    });

    it("accepte une relance aujourd'hui", async () => {
      const { service, id } = await withMarie();
      await expect(service.scheduleFollowUp(id, "2026-11-21")).resolves.toMatchObject({ ok: true });
    });

    it("refuse une date passée, sans rien modifier", async () => {
      const { repo, service, id } = await withMarie();

      await expect(service.scheduleFollowUp(id, "2026-11-20")).resolves.toEqual({ ok: false, error: "DATE_PAST" });
      expect(repo.setFollowUp).not.toHaveBeenCalled();
    });

    it.each(["25/11/2026", "2026-02-30", "2026-13-01", "2026-11-25T10:00", " 2026-11-25", "", null, 42, {}])(
      "refuse une date invalide (%j), sans rien modifier",
      async (date) => {
        const { repo, service, id } = await withMarie();

        await expect(service.scheduleFollowUp(id, date)).resolves.toEqual({ ok: false, error: "DATE_INVALID" });
        expect(repo.setFollowUp).not.toHaveBeenCalled();
      },
    );

    it.each(["won", "lost"] as const)("refuse de planifier une relance pour un contact « %s »", async (stage) => {
      const { repo, service, id } = await withMarie();
      await service.changeStage(id, stage);

      await expect(service.scheduleFollowUp(id, "2026-11-25")).resolves.toEqual({
        ok: false,
        error: "CONTACT_CLOSED",
      });
      expect(repo.setFollowUp).not.toHaveBeenCalled();
    });

    it.each([999, "abc"])("renvoie NOT_FOUND pour un identifiant inexistant ou invalide (%j)", async (bad) => {
      const { service } = await withMarie();
      await expect(service.scheduleFollowUp(bad, "2026-11-25")).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
      await expect(service.clearFollowUp(bad)).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
    });

    it("supprime une relance : plus aucune date", async () => {
      const { service, id } = await withMarie();
      await service.scheduleFollowUp(id, "2026-11-25");

      await expect(service.clearFollowUp(id)).resolves.toMatchObject({ ok: true, contact: { nextFollowUp: null } });
      await expect(service.getContact(id)).resolves.toMatchObject({ nextFollowUp: null });
    });

    it.each(["won", "lost"] as const)("clôturer un contact (« %s ») efface sa relance", async (stage) => {
      const { service, id } = await withMarie();
      await service.scheduleFollowUp(id, "2026-11-25");

      await expect(service.changeStage(id, stage)).resolves.toMatchObject({
        ok: true,
        contact: { stage, nextFollowUp: null },
      });
      await expect(service.getContact(id)).resolves.toMatchObject({ nextFollowUp: null });
    });

    it("changer pour une étape active conserve la relance", async () => {
      const { service, id } = await withMarie();
      await service.scheduleFollowUp(id, "2026-11-25");

      await service.changeStage(id, "meeting");

      await expect(service.getContact(id)).resolves.toMatchObject({ nextFollowUp: "2026-11-25" });
    });
  });

  describe("relances du jour (lot 5)", () => {
    /** Service dont on peut avancer l'horloge, avec trois contacts : relance hier, aujourd'hui, demain. */
    async function withThreeFollowUps() {
      const repo = fakeRepo();
      let now = new Date(2026, 10, 20, 12); // la veille, pour pouvoir planifier « hier »
      const service = createContactService(repo, () => now);
      const ids: Record<string, number> = {};
      for (const [name, date] of [
        ["Hier", "2026-11-20"],
        ["Aujourd'hui", "2026-11-21"],
        ["Demain", "2026-11-22"],
      ]) {
        const added = await service.addContact(name);
        if (!added.ok) throw new Error("setup");
        await service.scheduleFollowUp(added.contact.id, date);
        ids[name] = added.contact.id;
      }
      now = new Date(2026, 10, 21, 12); // aujourd'hui = 2026-11-21
      const setNow = (date: Date) => (now = date);
      return { repo, service, ids, setNow };
    }

    it("liste les relances en retard et du jour, pas celles de demain", async () => {
      const { service } = await withThreeFollowUps();

      const due = await service.listDueFollowUps();

      expect(due.map((d) => d.contact.name)).toEqual(["Hier", "Aujourd'hui"]);
    });

    it("indique le nombre de jours de retard (0 pour aujourd'hui)", async () => {
      const { service, setNow } = await withThreeFollowUps();
      expect((await service.listDueFollowUps()).map((d) => d.daysLate)).toEqual([1, 0]);

      setNow(new Date(2026, 10, 24, 12));
      expect((await service.listDueFollowUps()).map((d) => [d.contact.name, d.daysLate])).toEqual([
        ["Hier", 4],
        ["Aujourd'hui", 3],
        ["Demain", 2],
      ]);
    });

    it("compte les jours de retard d'un mois à l'autre et d'une année à l'autre", async () => {
      const repo = fakeRepo();
      let now = new Date(2026, 11, 30, 12);
      const service = createContactService(repo, () => now);
      const added = await service.addContact("Marie");
      if (!added.ok) throw new Error("setup");
      await service.scheduleFollowUp(added.contact.id, "2026-12-30");

      now = new Date(2027, 0, 2, 12);

      await expect(service.listDueFollowUps()).resolves.toEqual([
        expect.objectContaining({ daysLate: 3 }),
      ]);
    });

    it("marquer une relance faite la retire de la liste : plus de relance planifiée", async () => {
      const { service, ids } = await withThreeFollowUps();

      await expect(service.clearFollowUp(ids["Aujourd'hui"])).resolves.toMatchObject({ ok: true });

      expect((await service.listDueFollowUps()).map((d) => d.contact.name)).toEqual(["Hier"]);
      await expect(service.getContact(ids["Aujourd'hui"])).resolves.toMatchObject({ nextFollowUp: null });
    });

    it("reporter au lendemain la retire aujourd'hui ; elle réapparaît demain", async () => {
      const { service, ids, setNow } = await withThreeFollowUps();

      await expect(service.postponeFollowUp(ids["Aujourd'hui"])).resolves.toMatchObject({
        ok: true,
        contact: { nextFollowUp: "2026-11-22" },
      });
      expect((await service.listDueFollowUps()).map((d) => d.contact.name)).toEqual(["Hier"]);

      setNow(new Date(2026, 10, 22, 12));
      expect((await service.listDueFollowUps()).map((d) => d.contact.name)).toContain("Aujourd'hui");
    });

    it("reporter une relance en retard la fixe à demain (par rapport à aujourd'hui)", async () => {
      const { service, ids } = await withThreeFollowUps();

      await expect(service.postponeFollowUp(ids.Hier)).resolves.toMatchObject({
        contact: { nextFollowUp: "2026-11-22" },
      });
    });

    it.each([999, "abc"])("reporter : NOT_FOUND pour un identifiant inexistant ou invalide (%j)", async (bad) => {
      const { service } = await withThreeFollowUps();
      await expect(service.postponeFollowUp(bad)).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
    });

    it("liste vide quand aucune relance n'est due", async () => {
      const { service, setNow } = await withThreeFollowUps();
      setNow(new Date(2026, 10, 19, 12));

      await expect(service.listDueFollowUps()).resolves.toEqual([]);
    });

    it("interroge la base avec la date du jour", async () => {
      const { repo, service } = await withThreeFollowUps();
      await service.listDueFollowUps();
      expect(repo.listWithFollowUpDueBy).toHaveBeenCalledWith("2026-11-21");
    });
  });

  describe("recherche et filtre (lot 6)", () => {
    /** Contacts : [nom, entreprise, étape], créés dans l'ordre (le dernier est le plus récent). */
    async function withContacts() {
      let t = Date.parse("2026-11-01T09:00:00Z");
      const service = createContactService(fakeRepo(), () => new Date((t += 60_000)));
      for (const [name, company, stage] of [
        ["Marie Durand", "Atelier Lumen", "meeting"],
        ["Paul Martin", null, "meeting"],
        ["Zoé Leroy", "Durandal SA", "contacted"],
        ["Léo Petit", null, "new"],
      ] as const) {
        const added = await service.addContact(name);
        if (!added.ok) throw new Error("setup");
        if (company) await service.updateContact(added.contact.id, { name, company });
        await service.changeStage(added.contact.id, stage);
      }
      return service;
    }
    const names = (contacts: Contact[]) => contacts.map((c) => c.name);

    it("cherche une partie du nom, sans tenir compte de la casse", async () => {
      const service = await withContacts();
      expect(names(await service.searchContacts({ q: "MARTIN" }))).toEqual(["Paul Martin"]);
    });

    it("cherche aussi dans l'entreprise : « dur » trouve Marie Durand et Durandal SA", async () => {
      const service = await withContacts();
      expect(names(await service.searchContacts({ q: "dur" }))).toEqual(["Zoé Leroy", "Marie Durand"]);
    });

    it("ignore les accents, dans la recherche comme dans les contacts", async () => {
      const service = await withContacts();
      expect(names(await service.searchContacts({ q: "zoe" }))).toEqual(["Zoé Leroy"]);
      expect(names(await service.searchContacts({ q: "LÉO" }))).toEqual(["Léo Petit"]);
    });

    it("filtre par étape : « RDV » ne garde que les contacts en RDV", async () => {
      const service = await withContacts();
      expect(names(await service.searchContacts({ stage: "meeting" }))).toEqual(["Paul Martin", "Marie Durand"]);
    });

    it("combine recherche et étape", async () => {
      const service = await withContacts();
      expect(names(await service.searchContacts({ q: "dur", stage: "meeting" }))).toEqual(["Marie Durand"]);
    });

    it("renvoie une liste vide quand rien ne correspond", async () => {
      const service = await withContacts();
      await expect(service.searchContacts({ q: "dur", stage: "won" })).resolves.toEqual([]);
    });

    it("sans filtre : tous les contacts, du plus récent au plus ancien", async () => {
      const service = await withContacts();
      expect(names(await service.searchContacts({}))).toEqual(["Léo Petit", "Zoé Leroy", "Paul Martin", "Marie Durand"]);
    });

    it.each([
      [{}, { q: "", stage: null }],
      [{ q: "  dur  " }, { q: "dur", stage: null }],
      [{ q: ["dur", "x"], stage: ["meeting"] }, { q: "dur", stage: "meeting" }],
      [{ q: 42, stage: "archived" }, { q: "", stage: null }],
      [{ stage: "" }, { q: "", stage: null }],
      [null, { q: "", stage: null }],
      ["texte", { q: "", stage: null }],
    ])("lit les filtres de l'URL (%j) : valeurs invalides ignorées", (raw, expected) => {
      const service = createContactService(fakeRepo(), fixedNow);
      expect(service.parseContactFilters(raw)).toEqual(expected);
    });
  });

  describe("validation de l'identifiant (URL, argument lié d'une action)", () => {
    const invalidIds = ["abc", "1.5", "0", "-3", "", " 1", "1e2", "0x1", "9007199254740993", 0, -1, 1.5, NaN, null, undefined, {}];

    it("accepte un identifiant numérique ou une chaîne de chiffres", async () => {
      const { service, id } = await withMarie();

      await expect(service.getContact(id)).resolves.toMatchObject({ name: "Marie Durand" });
      await expect(service.getContact(String(id))).resolves.toMatchObject({ name: "Marie Durand" });
    });

    it.each(invalidIds)("getContact renvoie null pour un identifiant invalide (%j), sans interroger la base", async (bad) => {
      const { repo, service } = await withMarie();

      await expect(service.getContact(bad)).resolves.toBeNull();
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it.each(invalidIds)("updateContact renvoie NOT_FOUND pour un identifiant invalide (%j), sans rien modifier", async (bad) => {
      const { repo, service } = await withMarie();

      await expect(service.updateContact(bad, { name: "Paul" })).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
      expect(repo.update).not.toHaveBeenCalled();
    });

    it.each(invalidIds)("deleteContact renvoie NOT_FOUND pour un identifiant invalide (%j), sans rien supprimer", async (bad) => {
      const { repo, service } = await withMarie();

      await expect(service.deleteContact(bad)).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
      expect(repo.delete).not.toHaveBeenCalled();
      await expect(service.listContacts()).resolves.toHaveLength(1);
    });
  });

  describe("deleteContact", () => {
    it("supprime le contact, qui disparaît de la liste", async () => {
      const { service, id } = await withMarie();

      await expect(service.deleteContact(id)).resolves.toEqual({ ok: true });
      await expect(service.listContacts()).resolves.toEqual([]);
      await expect(service.getContact(id)).resolves.toBeNull();
    });

    it("renvoie NOT_FOUND pour un identifiant inexistant", async () => {
      const { service } = await withMarie();
      await expect(service.deleteContact(999)).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
      await expect(service.listContacts()).resolves.toHaveLength(1);
    });
  });
});
