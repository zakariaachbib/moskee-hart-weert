/** Sort the directory's Arabic class labels: preparatory أ, ب, then grades 1–6. */
export function educationClassOrder(label: string): number {
  const normalized = label.normalize("NFKC").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (/تمهيدي/.test(normalized)) {
    if (/أ|ا/.test(normalized.slice(normalized.indexOf("تمهيدي") + "تمهيدي".length))) return 0;
    if (/ب/.test(normalized.slice(normalized.indexOf("تمهيدي") + "تمهيدي".length))) return 1;
  }
  const grade = normalized.match(/([1-6])\s*$/);
  return grade ? 10 + Number(grade[1]) : 99;
}

export function compareEducationClasses(a: string, b: string): number {
  return educationClassOrder(a) - educationClassOrder(b) || a.localeCompare(b, "ar");
}