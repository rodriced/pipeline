import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FollowUpForm } from "@/components/follow-up-form";

const schedule = async () => ({ value: "" });
const clear = async () => {};

const render = (props: Partial<Parameters<typeof FollowUpForm>[0]> = {}) =>
  renderToStaticMarkup(
    <FollowUpForm nextFollowUp={null} closed={false} scheduleAction={schedule} clearAction={clear} {...props} />,
  );

describe("FollowUpForm (lot 4)", () => {
  it("sans relance : un champ date et « Planifier », pas de suppression", () => {
    const html = render();

    expect(html).toMatch(/<input[^>]*type="date"[^>]*>/);
    expect(html).toMatch(/<input[^>]*name="date"[^>]*>/);
    expect(html).toContain(">Planifier<");
    expect(html).toContain("Aucune relance planifiée");
    expect(html).not.toContain("Supprimer la relance");
  });

  it("avec une relance : affiche « Relance : 25/11 », pré-remplit la date et propose de la supprimer", () => {
    const html = render({ nextFollowUp: "2026-11-25" });

    expect(html).toContain("Relance : 25/11");
    expect(html).toMatch(/<input[^>]*value="2026-11-25"[^>]*>/);
    expect(html).toContain("Supprimer la relance");
  });

  it("contact clôturé : aucun moyen de planifier", () => {
    const html = render({ closed: true });

    expect(html).not.toContain('name="date"');
    expect(html).not.toContain("Planifier");
    expect(html).toContain("Contact clôturé");
  });

  it("affiche l'erreur renvoyée par l'action et conserve la saisie", () => {
    const html = render({
      initialState: { value: "2026-11-20", error: "La date de relance ne peut pas être passée." },
    });

    expect(html).toContain("La date de relance ne peut pas être passée.");
    expect(html).toMatch(/<input[^>]*aria-invalid="true"[^>]*>/);
    expect(html).toMatch(/<input[^>]*value="2026-11-20"[^>]*>/);
  });
});
