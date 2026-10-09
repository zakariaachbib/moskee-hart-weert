import { describe, expect, it } from "vitest";
import { cleanSermonText, sermonParagraphGroupSize } from "./sermonText";

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

describe("sermonParagraphGroupSize", () => {
  it("keeps Allah's introduction, quote and Quran reference together", () => {
    expect(sermonParagraphGroupSize(["Allah zegt in de Qur’ān:", "> En help elkaar in het goede en in godsvrucht.", "Qur’ān, al-Mā’ida (5:2).", "Volgende alinea."], 0)).toBe(3);
  });
  it("keeps an introduction with a quote even without a reference", () => {
    expect(sermonParagraphGroupSize(["Allah zegt in de Koran:", "En help elkaar in het goede."], 0)).toBe(2);
  });
  it("does not bind ordinary paragraphs together or bind a final introduction", () => {
    expect(sermonParagraphGroupSize(["Dienaren van Allah,", "Nieuwe alinea."], 0)).toBe(1);
    expect(sermonParagraphGroupSize(["Allah zegt:"], 0)).toBe(1);
  });
});