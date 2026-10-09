/** Remove pasted Markdown heading markers without changing the heading text. */
export function cleanSermonText(text: string): string {
  return text.replace(/^([\t ]*)#{1,6}(?:[\t ]+|$)/gm, "$1");
}

/** Keep a colon-ended introduction with its quote and a short source line. */
export function sermonParagraphGroupSize(paragraphs: string[], index: number): number {
  if (!/[:：]\s*$/.test(paragraphs[index]) || !paragraphs[index + 1]) return 1;
  const source = paragraphs[index + 2]?.trim();
  return source && source.length <= 120 && /\d+\s*[:：]\s*\d+/.test(source) ? 3 : 2;
}