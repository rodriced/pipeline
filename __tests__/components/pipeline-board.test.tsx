import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PipelineBoard, type PipelineColumn } from "@/components/pipeline-board";
import type { Contact, Stage } from "@/services/contact.service";

const contact = (id: number, name: string, stage: Stage, extra: Partial<Contact> = {}): Contact => ({
  id,
  name,
  stage,
  createdAt: new Date("2026-11-01T09:00:00Z"),
  company: null,
  email: null,
  phone: null,
  notes: null,
  nextFollowUp: null,
  ...extra,
});

const columns: PipelineColumn[] = [
  { stage: "new", contacts: [contact(1, "Léo Petit", "new")] },
  {
    stage: "contacted",
    contacts: [
      contact(2, "Zoé Leroy", "contacted", { company: "Durandal SA", nextFollowUp: "2026-11-25" }),
      contact(3, "Karim Haddad", "contacted"),
    ],
  },
  { stage: "meeting", contacts: [contact(4, "Marie Durand", "meeting")] },
  { stage: "won", contacts: [] },
  { stage: "lost", contacts: [contact(5, "Chloé Mercier", "lost")] },
];

const action = async () => {};
const html = renderToStaticMarkup(<PipelineBoard columns={columns} action={action} />).replaceAll("<!-- -->", "");

/** Colonnes rendues : [étape, contenu HTML]. */
const columnsOf = (markup: string) =>
  [...markup.matchAll(/<section[^>]*data-stage="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)].map((m) => ({ stage: m[1], html: m[2] }));
/** Carte d'un contact. */
const cardOf = (name: string) => html.split("<li").find((li) => li.includes(`>${name}<`)) ?? "";

describe("PipelineBoard (lot 7)", () => {
  it("affiche cinq colonnes dans l'ordre du pipeline, avec leur titre et leur nombre de contacts", () => {
    const rendered = columnsOf(html);

    expect(rendered.map((c) => c.stage)).toEqual(["new", "contacted", "meeting", "won", "lost"]);
    const headings = rendered.map((c) => c.html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    expect(headings).toEqual(["Nouveau 1", "Contacté 2", "RDV 1", "Gagné 0", "Perdu 1"]);
  });

  it("range chaque contact dans la colonne de son étape, avec un lien vers sa fiche", () => {
    const contacted = columnsOf(html).find((c) => c.stage === "contacted")!.html;

    expect(contacted).toContain(">Zoé Leroy<");
    expect(contacted).toContain(">Karim Haddad<");
    expect(contacted).not.toContain("Marie Durand");
    expect(cardOf("Zoé Leroy")).toContain('href="/contacts/2"');
    expect(cardOf("Zoé Leroy")).toContain("Durandal SA");
  });

  it("affiche la relance d'un contact seulement s'il en a une", () => {
    expect(cardOf("Zoé Leroy")).toContain("Relance : 25/11");
    expect(cardOf("Karim Haddad")).not.toContain("Relance");
  });

  it("une colonne sans contact indique qu'elle est vide", () => {
    expect(columnsOf(html).find((c) => c.stage === "won")!.html).toContain("Aucun contact");
    expect(columnsOf(html).find((c) => c.stage === "new")!.html).not.toContain("Aucun contact");
  });

  it("chaque carte peut être déplacée au clavier : liste étiquetée des autres étapes et bouton d'envoi", () => {
    const card = cardOf("Zoé Leroy");

    expect(card).toContain("<form");
    const select = card.match(/<select[^>]*>/)?.[0] ?? "";
    expect(select).toContain('name="stage"');
    expect(select).toContain('aria-label="Déplacer Zoé Leroy vers"');
    const values = [...card.matchAll(/<option[^>]*value="([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
    expect(values).toEqual(["new", "meeting", "won", "lost"]);
    expect(card).toMatch(/<button[^>]*type="submit"[^>]*>Déplacer<\/button>/);
  });

  it("à la souris : cartes déplaçables et colonnes repérées par leur étape (glisser-déposer)", () => {
    expect(cardOf("Zoé Leroy")).toMatch(/draggable="true"/);
    expect(cardOf("Zoé Leroy")).toMatch(/data-contact-id="2"/);
  });
});
