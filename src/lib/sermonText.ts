/** Remove pasted Markdown heading markers without changing the heading text. */
export function cleanSermonText(text: string): string {
  return text.replace(/^([\t ]*)#{1,6}(?:[\t ]+|$)/gm, "$1");
}