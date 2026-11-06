/** Remove pasted Markdown without rewriting or adding any sermon wording. */
export function cleanSermonText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/^([\t ]*)#{1,6}(?:[\t ]+|$)/gm, "$1")
    .replace(/^([\t ]*)>[\t ]?/gm, "$1")
    .replace(/(\*\*|__)([\s\S]*?)\1/g, "$2")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\[([^\]\n]+)\]\([^\)\n]+\)/g, "$1")
    // Pasted direction controls can mirror Dutch punctuation and references.
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "");
}

/** Use the dominant script, so ﷺ in a Dutch sentence does not make it RTL. */
export function sermonTextDirection(text: string): "ltr" | "rtl" {
  const arabic = text.match(/[\u0621-\u064a\u066e-\u06d3\u06fa-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/g)?.length ?? 0;
  const latin = text.match(/[a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff]/gi)?.length ?? 0;
  return arabic > latin ? "rtl" : "ltr";
}

const endsSentence = (line: string) => /[.!?…][\"'”’)\]]*$/.test(line.trim());
const endsAsHeading = (line: string) => !endsSentence(line) && !/[,;:،؛：]$/.test(line.trim());
const startsBody = (line: string) => /^(Beste|Dienaren|Geachte|Broeders|Zusters)\b/i.test(line) || /[.!?…]/.test(line);
const startsUppercase = (line: string) => /^[\"'“‘(]*[A-ZÀ-Þ\u0621-\u064a]/.test(line.trim());

/**
 * Recognise a short heading only when the following line clearly starts body
 * text. This keeps wrapped headings intact without splitting ordinary sentences.
 */
function headingLineCount(lines: string[], index: number): number {
  const first = lines[index];
  const second = lines[index + 1];
  if (!first || !second || !endsAsHeading(first) || first.length > 72 || first.split(/\s+/).length > 14) return 0;
  if (first.length <= 48 && startsUppercase(second) && startsBody(second)) return 1;

  const third = lines[index + 2];
  if (
    second.length <= 32 && endsAsHeading(second) && third && startsUppercase(third) &&
    (startsBody(third) || third.length >= 40)
  ) return 2;
  return 0;
}

/** Join hard-wrapped sentences, while preserving blank lines and real headings. */
export function sermonParagraphs(text: string): string[] {
  const blocks = cleanSermonText(text).split(/\n[\t ]*\n+/);
  const paragraphs: string[] = [];

  blocks.forEach((block) => {
    const lines = block.split("\n").map((line) => line.replace(/[\t ]+/g, " ").trim()).filter(Boolean);
    if (!lines.length) return;
    if (lines.length === 1) { paragraphs.push(lines[0]); return; }

    const lengths = lines.map((line) => line.length).sort((a, b) => a - b);
    const typicalLength = lengths[Math.floor(lengths.length / 2)];
    const shortLineMax = Math.min(52, Math.max(24, typicalLength * 0.7));
    let current = "";

    for (let i = 0; i < lines.length;) {
      if (!current) {
        const headingLines = headingLineCount(lines, i);
        if (headingLines) {
          paragraphs.push(lines.slice(i, i + headingLines).join(" "));
          i += headingLines;
          continue;
        }
      }

      const line = lines[i];
      current = current ? `${current} ${line}` : line;
      const nextIsHeading = endsSentence(line) && !!headingLineCount(lines, i + 1);
      const endsShortParagraph = current.length >= 20 && endsSentence(line) && line.length <= shortLineMax;
      if (nextIsHeading || endsShortParagraph || i === lines.length - 1) {
        paragraphs.push(current);
        current = "";
      }
      i++;
    }
  });

  return paragraphs;
}

/** Keep a colon-ended introduction with its quote and a short source line. */
export function sermonParagraphGroupSize(paragraphs: string[], index: number): number {
  if (!/[:：]\s*$/.test(paragraphs[index]) || !paragraphs[index + 1]) return 1;
  const source = paragraphs[index + 2]?.trim();
  return source && source.length <= 120 && /\d+\s*[:：]\s*\d+/.test(source) ? 3 : 2;
}