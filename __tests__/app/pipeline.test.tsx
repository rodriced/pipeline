import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
const getPipelineBoard = vi.fn();
vi.mock("@/services/contact.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/contact.service")>()),
  contactService: { getPipelineBoard },
}));

const { connection } = await import("next/server");
const { PipelineSection } = await import("@/app/pipeline/pipeline-section");
const { MainNav } = await import("@/components/main-nav");

describe("Vue Pipeline (lot 7)", () => {
  it("attend la requête puis affiche les colonnes fournies par le service", async () => {
    getPipelineBoard.mockResolvedValue([
      {
        stage: "new",
        contacts: [
          {
            id: 1,
            name: "Léo Petit",
            stage: "new",
            createdAt: new Date("2026-11-01T09:00:00Z"),
            company: null,
            email: null,
            phone: null,
            notes: null,
            nextFollowUp: null,
          },
        ],
      },
      { stage: "contacted", contacts: [] },
      { stage: "meeting", contacts: [] },
      { stage: "won", contacts: [] },
      { stage: "lost", contacts: [] },
    ]);

    const html = renderToStaticMarkup(await PipelineSection());

    expect(connection).toHaveBeenCalled();
    expect(getPipelineBoard).toHaveBeenCalled();
    expect(html).toContain(">Léo Petit<");
    expect(html.match(/data-stage="/g)).toHaveLength(5);
  });

  it("la navigation mène à la vue Pipeline", () => {
    expect(renderToStaticMarkup(<MainNav />)).toContain('href="/pipeline"');
  });
});
