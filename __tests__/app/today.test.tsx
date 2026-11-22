import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
const listDueFollowUps = vi.fn();
vi.mock("@/services/contact.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/contact.service")>()),
  contactService: { listDueFollowUps },
}));

const { connection } = await import("next/server");
const { TodaySection } = await import("@/app/aujourdhui/today-section");
const { MainNav } = await import("@/components/main-nav");

describe("Vue « Aujourd'hui » (lot 5)", () => {
  it("attend la requête (date du jour) puis affiche les relances dues fournies par le service", async () => {
    listDueFollowUps.mockResolvedValue([
      {
        contact: {
          id: 4,
          name: "Marie Durand",
          stage: "contacted",
          createdAt: new Date("2026-11-01T09:00:00Z"),
          company: null,
          email: null,
          phone: null,
          notes: null,
          nextFollowUp: "2026-11-20",
        },
        daysLate: 1,
      },
    ]);

    const html = renderToStaticMarkup(await TodaySection()).replaceAll("<!-- -->", "");

    expect(connection).toHaveBeenCalled();
    expect(html).toContain("Marie Durand");
    expect(html).toContain("En retard de 1 jour");
  });

  it("affiche « Rien à faire aujourd'hui » sans relance due", async () => {
    listDueFollowUps.mockResolvedValue([]);
    expect(renderToStaticMarkup(await TodaySection())).toContain("Rien à faire aujourd’hui");
  });

  it("la navigation mène aux contacts et à la vue « Aujourd'hui »", () => {
    const html = renderToStaticMarkup(<MainNav />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/aujourdhui"');
  });
});
