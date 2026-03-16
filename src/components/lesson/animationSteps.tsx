import { Droplets, Hand, Eye, BookOpen, Heart, Moon, Star, Sun } from "lucide-react";

export interface AnimationStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: "fard" | "sunnah" | "mustahabb" | "info";
}

export const typeColors: Record<string, string> = {
  fard: "bg-red-500/10 text-red-700 border-red-500/20",
  sunnah: "bg-primary/10 text-primary border-primary/20",
  mustahabb: "bg-green-500/10 text-green-700 border-green-500/20",
  info: "bg-secondary text-secondary-foreground border-border",
};

export const typeLabels: Record<string, string> = {
  fard: "Farḍ",
  sunnah: "Sunnah",
  mustahabb: "Mustaḥabb",
  info: "Info",
};

const wuduSteps: AnimationStep[] = [
  { title: "Niyyah (intentie)", description: "Maak de intentie in je hart voor het verrichten van wuḍūʾ.", icon: <Eye className="h-8 w-8" />, type: "fard" },
  { title: "Gezicht wassen", description: "Was het gezicht van de haargrens tot de kin, en van oor tot oor.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Handen en armen wassen", description: "Was beide handen en armen tot en met de ellebogen.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Hoofd bestrijken (masḥ)", description: "Bestrijk het hele hoofd met natte handen van voor naar achter en terug.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Voeten wassen", description: "Was beide voeten tot en met de enkels, inclusief tussen de tenen.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Dalk (wrijven)", description: "Wrijf elk lichaamsdeel tijdens het wassen — dit is verplicht in de Maliki madhhab.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Muwālāh (continuïteit)", description: "Verricht alle handelingen zonder lange onderbrekingen.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
];

const ghuslSteps: AnimationStep[] = [
  { title: "Niyyah (intentie)", description: "Maak de intentie in je hart om ghusl te verrichten ter opheffing van de staat van janābah.", icon: <Eye className="h-8 w-8" />, type: "fard" },
  { title: "Hele lichaam wassen", description: "Laat water over elk deel van het lichaam stromen, inclusief moeilijk bereikbare plekken.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Dalk (wrijven)", description: "Wrijf elk lichaamsdeel terwijl je het wast — verplicht in de Maliki madhhab.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Muwālāh (continuïteit)", description: "Verricht de ghusl zonder onnodige onderbrekingen.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Bismillāh zeggen", description: "Begin met het noemen van de naam van Allah.", icon: <Eye className="h-8 w-8" />, type: "sunnah" },
  { title: "Handen wassen", description: "Was eerst de handen voor je begint met de rest van het lichaam.", icon: <Hand className="h-8 w-8" />, type: "sunnah" },
  { title: "Wuḍūʾ verrichten", description: "Verricht een volledige wuḍūʾ voorafgaand aan de ghusl.", icon: <Droplets className="h-8 w-8" />, type: "sunnah" },
  { title: "Water over het hoofd", description: "Giet driemaal water over het hoofd voordat je de rest van het lichaam wast.", icon: <Droplets className="h-8 w-8" />, type: "sunnah" },
  { title: "Rechts voor links", description: "Begin met de rechterkant van het lichaam vóór de linkerkant.", icon: <Hand className="h-8 w-8" />, type: "mustahabb" },
];

const tayammumSteps: AnimationStep[] = [
  { title: "Niyyah (intentie)", description: "Maak de intentie om tayammum te verrichten als vervanging voor wuḍūʾ of ghusl.", icon: <Eye className="h-8 w-8" />, type: "fard" },
  { title: "Handen op aarde plaatsen", description: "Sla beide handen zachtjes op schone aarde, zand of steen.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Gezicht bestrijken", description: "Bestrijk het hele gezicht met de handen in één beweging.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Handen en armen bestrijken", description: "Sla opnieuw op de aarde en bestrijk beide handen en armen tot de ellebogen.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Muwālāh (continuïteit)", description: "Verricht tayammum zonder onderbrekingen, net als bij wuḍūʾ.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
];

const salahSteps: AnimationStep[] = [
  { title: "Niyyah (intentie)", description: "Maak de intentie voor het specifieke gebed dat je wilt verrichten.", icon: <Eye className="h-8 w-8" />, type: "fard" },
  { title: "Takbīrat al-Iḥrām", description: "Zeg 'Allāhu Akbar' en hef je handen op ter hoogte van je schouders.", icon: <Star className="h-8 w-8" />, type: "fard" },
  { title: "Qiyām (staan)", description: "Sta rechtop met je handen naast je lichaam (Maliki) en reciteer Sūrat al-Fātiḥah.", icon: <BookOpen className="h-8 w-8" />, type: "fard" },
  { title: "Rukūʿ (buiging)", description: "Buig voorover met je handen op de knieën en zeg 'Subḥāna Rabbiya l-ʿAẓīm'.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Iʿtidāl (oprichten)", description: "Richt je op en zeg 'Samiʿa llāhu liman ḥamidah'.", icon: <Star className="h-8 w-8" />, type: "fard" },
  { title: "Sujūd (prosternatie)", description: "Ga in prosternatie met zeven lichaamsdelen op de grond en zeg 'Subḥāna Rabbiya l-Aʿlā'.", icon: <Moon className="h-8 w-8" />, type: "fard" },
  { title: "Julūs (zitten)", description: "Zit kort tussen de twee prosternaties.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Tweede sujūd", description: "Verricht de tweede prosternatie op dezelfde wijze.", icon: <Moon className="h-8 w-8" />, type: "fard" },
  { title: "Tashahhud", description: "Reciteer de tashahhud in de zittende positie na de tweede rakʿah.", icon: <BookOpen className="h-8 w-8" />, type: "fard" },
  { title: "Taslīm", description: "Beëindig het gebed door 'as-salāmu ʿalaykum' te zeggen naar rechts.", icon: <Heart className="h-8 w-8" />, type: "fard" },
];

const shahadaSteps: AnimationStep[] = [
  { title: "Eerste getuigenis", description: "Ash-hadu an lā ilāha illa llāh — Ik getuig dat er geen god is dan Allah.", icon: <Star className="h-8 w-8" />, type: "fard" },
  { title: "Tweede getuigenis", description: "Wa ash-hadu anna Muḥammadan rasūlu llāh — En ik getuig dat Muḥammad de boodschapper van Allah is.", icon: <Heart className="h-8 w-8" />, type: "fard" },
  { title: "Betekenis & voorwaarden", description: "De shahādah vereist kennis, zekerheid, oprechtheid, eerlijkheid, liefde, onderwerping en acceptatie.", icon: <BookOpen className="h-8 w-8" />, type: "info" },
];

const reinigingVoorwaardenSteps: AnimationStep[] = [
  { title: "Islam", description: "De persoon moet moslim zijn om een geldige rituele reiniging te verrichten.", icon: <Star className="h-8 w-8" />, type: "fard" },
  { title: "Onderscheidingsvermogen", description: "De persoon moet bij bewustzijn zijn en over verstandelijke vermogens beschikken (tamyīz).", icon: <Eye className="h-8 w-8" />, type: "fard" },
  { title: "Zuiver water", description: "Het water moet rein (ṭāhir) en reinigend (ṭahūr) zijn — niet vervuild of gebruikt.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Geen belemmering", description: "Er mag niets op de huid zitten dat het water tegenhoudt, zoals nagellak of dikke crème.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Tijd van reiniging", description: "De reiniging moet worden verricht nadat de tijd van het gebed is ingetreden (bij wuḍūʾ voor ṣalāh).", icon: <Sun className="h-8 w-8" />, type: "info" },
];

const wuduVerbrekersSteps: AnimationStep[] = [
  { title: "Uitscheidingen", description: "Alles wat uit de voor- of achteruitgang komt: urine, ontlasting, wind.", icon: <Droplets className="h-8 w-8" />, type: "info" },
  { title: "Diepe slaap", description: "Diepe slaap waarbij je bewustzijn verliest verbreekt de wuḍūʾ.", icon: <Moon className="h-8 w-8" />, type: "info" },
  { title: "Bewusteloosheid", description: "Het verliezen van bewustzijn door flauwvallen of bedwelming.", icon: <Eye className="h-8 w-8" />, type: "info" },
  { title: "Aanraking", description: "Het aanraken van het geslachtsdeel zonder barrière (in de Maliki madhhab).", icon: <Hand className="h-8 w-8" />, type: "info" },
  { title: "Twijfel", description: "Bij twijfel of je wuḍūʾ nog geldig is: zekerheid gaat vóór twijfel.", icon: <Star className="h-8 w-8" />, type: "info" },
];

// Map titles to step sets with broad matching
const stepSets: Array<{ keywords: string[]; steps: AnimationStep[] }> = [
  { keywords: ["wuḍūʾ", "wudu", "stap voor stap wuḍūʾ", "wudoe"], steps: wuduSteps },
  { keywords: ["ghusl"], steps: ghuslSteps },
  { keywords: ["tayammum", "droge reiniging"], steps: tayammumSteps },
  { keywords: ["salah", "ṣalāh", "gebed stap", "gebedshoudingen", "stap voor stap salah", "stap voor stap ṣalāh"], steps: salahSteps },
  { keywords: ["shahāda", "shahada", "geloofsbelijdenis", "getuigenis"], steps: shahadaSteps },
  { keywords: ["voorwaarden van reiniging", "voorwaarden wuḍūʾ", "voorwaarden van wuḍūʾ"], steps: reinigingVoorwaardenSteps },
  { keywords: ["verbrekers", "nawāqiḍ", "wuḍūʾ verbreken"], steps: wuduVerbrekersSteps },
];

export function getStepsForLesson(title: string): AnimationStep[] | null {
  const t = title.toLowerCase();
  for (const set of stepSets) {
    if (set.keywords.some(kw => t.includes(kw.toLowerCase()))) {
      return set.steps;
    }
  }
  return null;
}

// Icon assignment based on keywords
function pickIcon(text: string): React.ReactNode {
  const t = text.toLowerCase();
  if (t.includes("water") || t.includes("wassen") || t.includes("reinig") || t.includes("ṭahār")) return <Droplets className="h-8 w-8" />;
  if (t.includes("hand") || t.includes("wrijv") || t.includes("dalk") || t.includes("aanrak")) return <Hand className="h-8 w-8" />;
  if (t.includes("gebed") || t.includes("salah") || t.includes("ṣalāh") || t.includes("rukūʿ") || t.includes("sujūd")) return <Moon className="h-8 w-8" />;
  if (t.includes("koran") || t.includes("leer") || t.includes("kennis") || t.includes("boek") || t.includes("recit")) return <BookOpen className="h-8 w-8" />;
  if (t.includes("hart") || t.includes("liefde") || t.includes("oprecht")) return <Heart className="h-8 w-8" />;
  if (t.includes("allah") || t.includes("islam") || t.includes("geloof") || t.includes("imān")) return <Star className="h-8 w-8" />;
  if (t.includes("intentie") || t.includes("niyyah") || t.includes("oog") || t.includes("bewust")) return <Eye className="h-8 w-8" />;
  return <BookOpen className="h-8 w-8" />;
}

export function generateStepsFromContent(content: string): AnimationStep[] {
  if (!content || content.trim().length < 20) return [];

  // Try to split on common section patterns
  const lines = content.split("\n").filter(l => l.trim().length > 0);
  const steps: AnimationStep[] = [];

  let currentTitle = "";
  let currentDesc: string[] = [];

  const flushStep = () => {
    if (currentTitle && currentDesc.length > 0) {
      const desc = currentDesc.join(" ").trim();
      steps.push({
        title: currentTitle.length > 60 ? currentTitle.substring(0, 57) + "..." : currentTitle,
        description: desc.length > 200 ? desc.substring(0, 197) + "..." : desc,
        icon: pickIcon(currentTitle + " " + desc),
        type: "info",
      });
    }
    currentTitle = "";
    currentDesc = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers: lines in ALL CAPS, or lines starting with numbered pattern, or short bold-like lines
    const isHeader =
      (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80 && !/^[•\-–]/.test(trimmed)) ||
      /^\d+[\.\)]\s/.test(trimmed) ||
      (trimmed.startsWith("## ") || trimmed.startsWith("### "));

    if (isHeader) {
      flushStep();
      currentTitle = trimmed
        .replace(/^#+\s*/, "")
        .replace(/^\d+[\.\)]\s*/, "")
        .replace(/^[━─═]+$/, "");
      if (!currentTitle) currentTitle = "";
    } else if (trimmed.startsWith("Leerdoelen:") || trimmed === "━━━━━━━━━━━━━━━━━━━━━━━━━") {
      flushStep();
    } else if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("–")) {
      if (!currentTitle) {
        // Bullet without header — use bullet as its own step
        const text = trimmed.replace(/^[•\-–]\s*/, "");
        if (text.length > 10) {
          const colonIdx = text.indexOf(":");
          if (colonIdx > 0 && colonIdx < 40) {
            steps.push({
              title: text.substring(0, colonIdx).trim(),
              description: text.substring(colonIdx + 1).trim(),
              icon: pickIcon(text),
              type: "info",
            });
          } else {
            const firstSentence = text.split(/[.!?]/)[0];
            steps.push({
              title: firstSentence.length > 60 ? firstSentence.substring(0, 57) + "..." : firstSentence,
              description: text,
              icon: pickIcon(text),
              type: "info",
            });
          }
        }
      } else {
        currentDesc.push(trimmed.replace(/^[•\-–]\s*/, ""));
      }
    } else {
      if (currentTitle) {
        currentDesc.push(trimmed);
      } else if (!steps.length && trimmed.length > 20) {
        // First paragraph without header — use as intro step
        currentTitle = "Introductie";
        currentDesc.push(trimmed);
      }
    }
  }
  flushStep();

  // Cap at 10 steps
  return steps.slice(0, 10);
}
