/** Remove pasted Markdown heading markers without changing the heading text. */
export function cleanSermonText(text: string): string {
  return text.replace(/^([\t ]*)#{1,6}(?:[\t ]+|$)/gm, "$1");
}

/** Turn pasted hard-wrapped lines into naturally separated, flowing paragraphs. */
export function sermonParagraphs(text: string): string[] {
  const blocks = cleanSermonText(text).replace(/\r\n?/g, "\n").split(/\n[\t ]*\n+/);
  const paragraphs: string[] = [];

  blocks.forEach((block) => {
    const lines = block.split("\n").map((line) => line.replace(/[\t ]+/g, " ").trim()).filter(Boolean);
    if (!lines.length) return;
    if (lines.length === 1) { paragraphs.push(lines[0]); return; }

    const lengths = lines.map((line) => line.length).sort((a, b) => a - b);
    const typicalLength = lengths[Math.floor(lengths.length / 2)];
    if (typicalLength < 30) { paragraphs.push(lines.join(" ")); return; }

    // A noticeably shorter physical line is usually the final line of the
    // writer's paragraph, rather than another hard-wrapped line.
    const shortLineMax = Math.min(52, Math.max(24, typicalLength * 0.7));
    let current = lines[0];
    for (let i = 1; i < lines.length; i++) {
      if (current.length >= 20 && lines[i - 1].length <= shortLineMax) {
        paragraphs.push(current);
        current = lines[i];
      } else {
        current += ` ${lines[i]}`;
      }
    }
    paragraphs.push(current);
  });

  return paragraphs;
}

/** Keep a colon-ended introduction with its quote and a short source line. */
export function sermonParagraphGroupSize(paragraphs: string[], index: number): number {
  if (!/[:：]\s*$/.test(paragraphs[index]) || !paragraphs[index + 1]) return 1;
  const source = paragraphs[index + 2]?.trim();
  return source && source.length <= 120 && /\d+\s*[:：]\s*\d+/.test(source) ? 3 : 2;
}