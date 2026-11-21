import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FollowUpList, type DueFollowUpItem } from "@/components/follow-up-list";
import type { Contact } from "@/services/contact.service";

const contact = (id: number, name: string, nextFollowUp: string): Contact => ({
  id,
  name,
  stage: "contacted",
  createdAt: new Date("2026-11-01T09:00:00Z"),
  company: id === 1 ? "Atelier Lumen" : null,
  email: null,
  phone: null,
  notes: null,
  nextFollowUp,
});

const action = async () => {};
const actions = { markDone: () => action, postpone: () => action };

const items: DueFollowUpItem[] = [
  { contact: contact(1, "Marie Durand", "2026-11-19"), daysLate: 2 },
  { contact: contact(2, "Paul Martin", "2026-11-20"), daysLate: 1 },
  { contact: contact(3, "Zoé Leroy", "2026-11-21"), daysLate: 0 },
];

const render = (list: DueFollowUpItem[]) => renderToStaticMarkup(<FollowUpList items={list} {...actions} />).replaceAll("<!-- -->", "");

/** Élément <li> du contact. */
const itemOf = (html: string, name: string) => html.split("<li").find((li) => li.includes(name)) ?? "";

describe("FollowUpList (lot 5)", () => {
  it("affiche chaque contact dû, dans l'ordre reçu, avec un lien vers sa fiche", () => {
    const html = render(items);

    const positions = ["Marie Durand", "Paul Martin", "Zoé Leroy"].map((n) => html.indexOf(n));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).toContain('href="/contacts/1"');
    expect(html).toContain("Atelier Lumen");
  });

  it("une relance en retard est mise en évidence (token today) avec son nombre de jours de retard", () => {
    const html = render(items);

    expect(itemOf(html, "Marie Durand")).toContain("En retard de 2 jours");
    expect(itemOf(html, "Paul Martin")).toContain("En retard de 1 jour<");
    expect(itemOf(html, "Marie Durand")).toMatch(/data-late="true"/);
    expect(itemOf(html, "Marie Durand")).toMatch(/text-today-foreground/);
  });

  it("une relance du jour est indiquée « Aujourd'hui », sans mise en évidence de retard", () => {
    const li = itemOf(render(items), "Zoé Leroy");

    expect(li).toContain("Aujourd’hui");
    expect(li).not.toContain("En retard");
    expect(li).not.toMatch(/data-late="true"/);
  });

  it("chaque relance propose « Fait » et « Demain » (formulaires envoyés au serveur)", () => {
    const li = itemOf(render(items), "Paul Martin");

    expect(li.match(/<form/g)).toHaveLength(2);
    expect(li).toMatch(/<button[^>]*type="submit"[^>]*>Fait<\/button>/);
    expect(li).toMatch(/<button[^>]*type="submit"[^>]*>Demain<\/button>/);
  });

  it("affiche un message quand il n'y a rien à faire", () => {
    expect(render([])).toContain("Rien à faire aujourd’hui");
  });
});
