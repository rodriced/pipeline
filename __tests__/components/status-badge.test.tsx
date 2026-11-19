import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StatusBadge } from "@/components/status-badge";

describe("StatusBadge", () => {
  it("affiche le statut", () => {
    expect(renderToStaticMarkup(<StatusBadge status="up" />)).toContain(">up<");
  });
});
