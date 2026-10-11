import fs from "fs";
import path from "path";
import type { Plugin } from "vite";

// Social crawlers don't run JavaScript, so shared campaign links need their own static <head>.
const SITE = "https://simweert.nl";
const pages = [
  {
    route: "/crowdfunding/audiofundament",
    title: "Doneer mee voor Moskee Nahda Weert",
    description:
      "Steun onze Ramadan-campagne: nieuw geluidssysteem, opnameset en keukenapparatuur voor de moskee. Elke bijdrage telt — doneer vandaag als sadaqa jariya.",
    image: "/images/og-audiofundament.jpg",
  },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function campaignHead(html: string, page: (typeof pages)[number]): string {
  const url = SITE + page.route;
  const img = SITE + page.image;
  const set = (re: RegExp, tag: string) => (re.test(html) ? (html = html.replace(re, tag)) : (html = html.replace("</head>", `    ${tag}\n  </head>`)));
  set(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  set(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(page.description)}" />`);
  set(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(page.title)}" />`);
  set(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(page.description)}" />`);
  set(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${img}" />`);
  set(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  set(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(page.title)}" />`);
  set(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(page.description)}" />`);
  set(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${img}" />`);
  set(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  return html;
}

export function campaignShareHtml(): Plugin {
  let outDir = "dist";
  return {
    name: "campaign-share-html",
    apply: "build",
    configResolved(c) {
      outDir = path.resolve(c.root, c.build.outDir);
    },
    closeBundle() {
      const base = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
      for (const page of pages) {
        const html = campaignHead(base, page);
        const rel = page.route.replace(/^\//, "");
        fs.mkdirSync(path.join(outDir, rel), { recursive: true });
        fs.writeFileSync(path.join(outDir, rel, "index.html"), html);
        fs.writeFileSync(path.join(outDir, `${rel}.html`), html);
      }
    },
  };
}
