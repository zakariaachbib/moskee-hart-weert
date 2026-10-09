import { describe, expect, it } from "vitest";
import { cleanSermonText } from "./sermonText";

describe("cleanSermonText", () => {
  it("removes ### from pasted sermon headings, preserving content and paragraphs", () => {
    expect(cleanSermonText("Daarom stellen wij een vraag.\n\n### Het verdwijnen van sociale verbondenheid\n\nDienaren van Allah,"))
      .toBe("Daarom stellen wij een vraag.\n\nHet verdwijnen van sociale verbondenheid\n\nDienaren van Allah,");
  });
  it("cleans Arabic and other Markdown headings without removing ordinary hashes", () => {
    expect(cleanSermonText("## الحضور\n  ### Onderwerp\n# Titel\nNummer #123"))
      .toBe("الحضور\n  Onderwerp\nTitel\nNummer #123");
  });
});