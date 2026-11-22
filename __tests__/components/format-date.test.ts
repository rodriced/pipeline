import { describe, expect, it } from "vitest";
import { formatDayMonth } from "@/components/format-date";

describe("formatDayMonth (lot 4)", () => {
  it.each([
    ["2026-11-25", "25/11"],
    ["2027-01-05", "05/01"],
  ])("affiche %s en jour/mois (%s)", (iso, expected) => {
    expect(formatDayMonth(iso)).toBe(expected);
  });
});
