import { describe, expect, it } from "vitest";
import { cleanSermonText, sermonParagraphGroupSize, sermonParagraphs, sermonTextDirection } from "./sermonText";

describe("cleanSermonText", () => {
  it("removes ### from pasted sermon headings, preserving content and paragraphs", () => {
    expect(cleanSermonText("Daarom stellen wij een vraag.\n\n### Het verdwijnen van sociale verbondenheid\n\nDienaren van Allah,"))
      .toBe("Daarom stellen wij een vraag.\n\nHet verdwijnen van sociale verbondenheid\n\nDienaren van Allah,");
  });
  it("cleans Arabic and other Markdown headings without removing ordinary hashes", () => {
    expect(cleanSermonText("## الحضور\n  ### Onderwerp\n# Titel\nNummer #123"))
      .toBe("الحضور\n  Onderwerp\nTitel\nNummer #123");
  });
  it("removes ChatGPT-style emphasis and quotes without changing the wording", () => {
    expect(cleanSermonText("> Hij zei: **“Houd je aan de geboden van Allah.”** (At-Tirmidhi)"))
      .toBe("Hij zei: “Houd je aan de geboden van Allah.” (At-Tirmidhi)");
  });
  it("removes bold markers even when the quote was hard-wrapped onto new lines", () => {
    expect(cleanSermonText("Hij zei: **“Houd je aan de geboden\nvan Allah, dan zal Allah je\nbeschermen.”** (At-Tirmidhi)"))
      .toBe("Hij zei: “Houd je aan de geboden\nvan Allah, dan zal Allah je\nbeschermen.” (At-Tirmidhi)");
  });
  it("removes direction controls that mirror Dutch punctuation", () => {
    expect(cleanSermonText("Allah is met ons.\u202b (9:40)")).toBe("Allah is met ons. (9:40)");
  });
});

describe("sermonTextDirection", () => {
  it("keeps a Dutch paragraph with an Arabic honorific left-to-right", () => {
    expect(sermonTextDirection("ﷺ Bij zijn emigratie zei hij: “Allah is met ons.” (9:40)")).toBe("ltr");
  });
  it("keeps genuinely Arabic paragraphs right-to-left", () => {
    expect(sermonTextDirection("إن الله معنا (9:40)")).toBe("rtl");
  });
});

describe("sermonParagraphs", () => {
  it("joins hard-wrapped lines so complete sentences flow across the PDF width", () => {
    expect(sermonParagraphs("Samen bouwen aan de toekomst van de islam in\nNederland\nEen van de belangrijkste vragen die ons als moslims in\nNederland moeten bezighouden, is: Wat hebben wij gedaan?"))
      .toEqual([
        "Samen bouwen aan de toekomst van de islam in Nederland",
        "Een van de belangrijkste vragen die ons als moslims in Nederland moeten bezighouden, is: Wat hebben wij gedaan?",
      ]);
  });

  it("preserves intentional blank-line paragraph breaks and normalizes spacing", () => {
    expect(sermonParagraphs("Eerste alinea\nloopt door.\n\n  Tweede\talinea.  \n\n\nDerde alinea."))
      .toEqual(["Eerste alinea loopt door.", "Tweede alinea.", "Derde alinea."]);
  });

  it("keeps a two-line heading together and outside the following sentence", () => {
    expect(sermonParagraphs("De Profeet leerde zijn metgezellen\nverantwoordelijkheid\nDe Profeet leerde zijn metgezellen niet alleen bidden en vasten. Hij leerde hen ook\nverantwoordelijkheid te nemen voor de islam en de samenleving."))
      .toEqual([
        "De Profeet leerde zijn metgezellen verantwoordelijkheid",
        "De Profeet leerde zijn metgezellen niet alleen bidden en vasten. Hij leerde hen ook verantwoordelijkheid te nemen voor de islam en de samenleving.",
      ]);
  });

  it("does not glue a heading to the salutation that follows it", () => {
    expect(sermonParagraphs("Grote uitdagingen voor moslims in Nederland\nBeste broeders en zusters, Moslims in Nederland staan voor belangrijke uitdagingen."))
      .toEqual([
        "Grote uitdagingen voor moslims in Nederland",
        "Beste broeders en zusters, Moslims in Nederland staan voor belangrijke uitdagingen.",
      ]);
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