import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRAND = {
  brown: "#3d2e1a",
  brownLight: "#5a4530",
  gold: "#d4a84b",
  goldLight: "#e8c97a",
  cream: "#faf8f4",
  creamDark: "#f0ebe2",
  text: "#2d2418",
  textLight: "#6b5d4d",
  textMuted: "#9a8b78",
  border: "#e8e0d4",
};

function emailShell(title: string, subtitle: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:24px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,46,26,0.12);">
  <!-- Header -->
  <tr><td style="background:${BRAND.brown};padding:32px 28px;text-align:center;">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.goldLight};margin-bottom:8px;">Stichting Islamitische Moskee Weert</div>
    <h1 style="color:${BRAND.gold};font-size:24px;margin:0;font-weight:700;">${title}</h1>
    ${subtitle ? `<p style="color:${BRAND.cream};font-size:13px;margin:8px 0 0;opacity:0.85;">${subtitle}</p>` : ""}
    <div style="width:60px;height:2px;background:${BRAND.gold};margin:16px auto 0;border-radius:1px;"></div>
  </td></tr>
  <!-- Body -->
  <tr><td style="background:${BRAND.cream};padding:0;">
    <div style="border-left:4px solid ${BRAND.gold};margin:0;">
      <div style="padding:28px 28px 24px;">
        ${body}
      </div>
    </div>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:${BRAND.creamDark};padding:20px 28px;text-align:center;border-top:1px solid ${BRAND.border};">
    <p style="font-size:12px;color:${BRAND.textMuted};margin:0;">Stichting Islamitische Moskee Weert</p>
    <p style="font-size:11px;color:${BRAND.textMuted};margin:4px 0 0;">Charitastraat 4 · 6001 XT Weert · info@simweert.nl</p>
    <p style="font-size:10px;color:${BRAND.textMuted};margin:8px 0 0;opacity:0.7;">Dit bericht is automatisch verzonden via simweert.nl</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function detailRow(icon: string, label: string, value: string, alt = false): string {
  return `<tr style="background:${alt ? BRAND.creamDark : BRAND.cream};">
    <td style="padding:12px 16px;font-size:13px;color:${BRAND.textLight};white-space:nowrap;vertical-align:top;width:140px;">
      ${icon} ${label}
    </td>
    <td style="padding:12px 16px;font-size:15px;color:${BRAND.text};font-weight:600;">
      ${value}
    </td>
  </tr>`;
}

function detailTable(rows: [string, string, string][]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};margin:16px 0;">
    ${rows.map(([icon, label, value], i) => detailRow(icon, label, value, i % 2 === 1)).join("")}
  </table>`;
}

const typeLabels: Record<string, string> = { hall: "Zaal", kitchen: "Keuken", hall_and_kitchen: "Zaal + keuken" };
const activityLabels: Record<string, string> = { feest: "Feest", familie: "Familie bijeenkomst", vergadering: "Vergadering", overig: "Overig" };

function buildFacilityReservationEmail(data: any): string {
  const body = `
    <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 8px;">
      Er is een nieuwe zaalreservering binnengekomen via de website.
    </p>
    <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
      <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Contactgegevens</p>
    </div>
    ${detailTable([
      ["👤", "Naam", data.name],
      ["📞", "Telefoon", data.phone],
      ["✉️", "E-mail", data.email],
    ])}
    <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
      <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Reserveringsdetails</p>
    </div>
    ${detailTable([
      ["📅", "Datum", data.date],
      ["🕐", "Tijd", `${data.start_time} – ${data.end_time}`],
      ["📍", "Type", typeLabels[data.reservation_type] || data.reservation_type],
      ["🏠", "Zalen", String(data.rooms)],
      ["👥", "Personen", String(data.guest_count)],
      ["🎯", "Activiteit", activityLabels[data.activity_type] || data.activity_type],
    ])}
    ${data.notes ? `
    <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
      <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 6px;">Opmerkingen</p>
      <p style="font-size:14px;color:${BRAND.text};margin:0;line-height:1.5;">${data.notes}</p>
    </div>` : ""}
  `;
  return emailShell("Nieuwe Zaalreservering", "Er is een nieuwe aanvraag binnengekomen", body);
}

function buildFacilityConfirmationEmail(data: any): string {
  const body = `
    <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
      Assalamu alaykum <strong>${data.name}</strong>,
    </p>
    <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
      Hartelijk dank voor uw reserveringsaanvraag. Wij hebben deze in goede orde ontvangen.
      De reservering is pas definitief na bevestiging door onze coördinator.
    </p>
    <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
      <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Uw reservering</p>
    </div>
    ${detailTable([
      ["📅", "Datum", data.date],
      ["🕐", "Tijd", `${data.start_time} – ${data.end_time}`],
      ["📍", "Type", typeLabels[data.reservation_type] || data.reservation_type],
      ["👥", "Personen", String(data.guest_count)],
      ["🎯", "Activiteit", activityLabels[data.activity_type] || data.activity_type],
    ])}
    <div style="background:${BRAND.brown};border-radius:12px;padding:18px;margin:20px 0;text-align:center;">
      <p style="font-size:14px;color:${BRAND.cream};margin:0;line-height:1.5;">
        Voor vragen kunt u contact opnemen met onze reserveringscoördinator<br>
        <strong style="color:${BRAND.gold};">Tarik Ghanmi</strong> — 
        <a href="tel:+31616958298" style="color:${BRAND.goldLight};text-decoration:none;">+31 6 16958298</a>
      </p>
    </div>
    <p style="font-size:14px;color:${BRAND.textLight};line-height:1.6;margin:0;">
      Met vriendelijke groet,<br>
      <strong>Stichting Islamitische Moskee Weert</strong>
    </p>
  `;
  return emailShell("Reservering Ontvangen", "Uw aanvraag is in behandeling", body);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    const SMTP_PASSWORD = Deno.env.get("STRATO_SMTP_PASSWORD");
    if (!SMTP_PASSWORD) {
      throw new Error("STRATO_SMTP_PASSWORD is not configured");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.strato.de",
      port: 465,
      secure: true,
      auth: {
        user: "info@simweert.nl",
        pass: SMTP_PASSWORD,
      },
    });

    let subject = "";
    let text = "";
    let html = "";
    let to = "info@simweert.nl, zakariaachbib@live.nl";

    if (type === "contact") {
      subject = `Nieuw contactbericht: ${data.onderwerp}`;
      text = `Er is een nieuw contactbericht ontvangen via de website.\n\nNaam: ${data.naam}\nE-mail: ${data.email}\nOnderwerp: ${data.onderwerp}\n\nBericht:\n${data.bericht}\n\n---\nDit bericht is automatisch verzonden via simweert.nl`;
    } else if (type === "membership") {
      subject = `Nieuwe lidmaatschapsaanvraag: ${data.naam}`;
      text = `Er is een nieuwe lidmaatschapsaanvraag ontvangen via de website.\n\nNaam: ${data.naam}\nE-mail: ${data.email}\nTelefoon: ${data.telefoon || "Niet opgegeven"}\nAdres: ${data.adres || "Niet opgegeven"}\nGeboortedatum: ${data.geboortedatum || "Niet opgegeven"}\nOpmerking: ${data.opmerking || "Geen"}\n\n---\nDit bericht is automatisch verzonden via simweert.nl`;
    } else if (type === "facility_reservation") {
      to = "zakariaachbib@live.nl";
      subject = `Nieuwe zaalreservering: ${data.name} — ${data.date}`;
      html = buildFacilityReservationEmail(data);
      text = `Nieuwe zaalreservering\n\nNaam: ${data.name}\nTelefoon: ${data.phone}\nE-mail: ${data.email}\nDatum: ${data.date}\nTijd: ${data.start_time} – ${data.end_time}\nType: ${typeLabels[data.reservation_type] || data.reservation_type}\nZalen: ${data.rooms}\nPersonen: ${data.guest_count}\nActiviteit: ${activityLabels[data.activity_type] || data.activity_type}\nOpmerkingen: ${data.notes || "Geen"}`;
    } else if (type === "facility_reservation_confirmation") {
      to = data.email;
      subject = `Uw reserveringsaanvraag is ontvangen — ${data.date}`;
      html = buildFacilityConfirmationEmail(data);
      text = `Assalamu alaykum ${data.name},\n\nHartelijk dank voor uw reserveringsaanvraag.\n\nDatum: ${data.date}\nTijd: ${data.start_time} – ${data.end_time}\nType: ${typeLabels[data.reservation_type] || data.reservation_type}\n\nDe reservering is pas definitief na bevestiging door onze coördinator.\n\nMet vriendelijke groet,\nStichting Islamitische Moskee Weert`;
    } else if (type === "tour_request") {
      to = "zakariaachbib@live.nl";
      subject = `Nieuwe rondleiding aanvraag: ${data.naam}`;
      const tourBody = `
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 8px;">
          Er is een nieuwe rondleiding aanvraag binnengekomen via de website.
        </p>
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Contactgegevens</p>
        </div>
        ${detailTable([
          ["👤", "Naam", data.naam],
          ["✉️", "E-mail", data.email],
        ])}
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Rondleidingsdetails</p>
        </div>
        ${detailTable([
          ...(data.datum ? [["📅", "Gewenste datum", data.datum] as [string, string, string]] : []),
          ...(data.tijd ? [["🕐", "Voorkeurstijd", `${data.tijd} (60 min)`] as [string, string, string]] : []),
        ])}
        ${data.bericht ? `
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 6px;">Bericht</p>
          <p style="font-size:14px;color:${BRAND.text};margin:0;line-height:1.5;">${data.bericht}</p>
        </div>` : ""}
      `;
      html = emailShell("Nieuwe Rondleiding Aanvraag", "Er is een nieuwe aanvraag binnengekomen", tourBody);
      text = `Nieuwe rondleiding aanvraag\n\nNaam: ${data.naam}\nE-mail: ${data.email}\nDatum: ${data.datum || "Niet opgegeven"}\nTijd: ${data.tijd || "Niet opgegeven"}\nBericht: ${data.bericht || "Geen"}`;
    } else if (type === "tour_request_confirmation") {
      to = data.email;
      subject = `Uw rondleiding aanvraag is ontvangen`;
      const confirmBody = `
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
          Assalamu alaykum <strong>${data.naam}</strong>,
        </p>
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
          Hartelijk dank voor uw aanvraag voor een rondleiding in onze moskee.
          Wij hebben deze in goede orde ontvangen en nemen zo snel mogelijk contact met u op om de details te bevestigen.
        </p>
        ${(data.datum || data.tijd) ? `
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Uw aanvraag</p>
        </div>
        ${detailTable([
          ...(data.datum ? [["📅", "Gewenste datum", data.datum] as [string, string, string]] : []),
          ...(data.tijd ? [["🕐", "Voorkeurstijd", `${data.tijd} (60 min)`] as [string, string, string]] : []),
        ])}` : ""}
        <div style="background:${BRAND.brown};border-radius:12px;padding:18px;margin:20px 0;text-align:center;">
          <p style="font-size:14px;color:${BRAND.cream};margin:0;line-height:1.5;">
            Voor vragen kunt u contact opnemen met onze rondleidingscoördinator<br>
            <strong style="color:${BRAND.gold};">Tarik Ghanmi</strong> — 
            <a href="tel:+31616958298" style="color:${BRAND.goldLight};text-decoration:none;">+31 6 16958298</a>
          </p>
        </div>
        <p style="font-size:14px;color:${BRAND.textLight};line-height:1.6;margin:0;">
          Met vriendelijke groet,<br>
          <strong>Stichting Islamitische Moskee Weert</strong>
        </p>
      `;
      html = emailShell("Rondleiding Aanvraag Ontvangen", "Uw aanvraag is in behandeling", confirmBody);
      text = `Assalamu alaykum ${data.naam},\n\nHartelijk dank voor uw aanvraag voor een rondleiding.\n\n${data.datum ? `Datum: ${data.datum}\n` : ""}${data.tijd ? `Tijd: ${data.tijd}\n` : ""}\nWij nemen zo snel mogelijk contact met u op.\n\nMet vriendelijke groet,\nStichting Islamitische Moskee Weert`;
    } else if (type === "waitlist_signup") {
      to = "zakariaachbib@live.nl";
      subject = `Nieuwe wachtlijst inschrijving: ${data.naam}`;
      const waitlistBody = `
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 8px;">
          Er is een nieuwe inschrijving op de cursus-wachtlijst binnengekomen via de website.
        </p>
        ${detailTable([
          ["👤", "Naam", data.naam],
          ["✉️", "E-mail", data.email],
          ...(data.telefoon ? [["📞", "Telefoon", data.telefoon] as [string, string, string]] : []),
        ])}
      `;
      html = emailShell("Nieuwe Wachtlijst Inschrijving", "Cursusplatform", waitlistBody);
      text = `Nieuwe wachtlijst inschrijving\n\nNaam: ${data.naam}\nE-mail: ${data.email}\nTelefoon: ${data.telefoon || "Niet opgegeven"}`;
    } else if (type === "waitlist_confirmation") {
      to = data.email;
      subject = `Je staat op de wachtlijst — Cursussen SIM Weert`;
      const confirmBody = `
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
          Assalamu alaykum <strong>${data.naam}</strong>,
        </p>
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
          Hartelijk dank voor je inschrijving op de wachtlijst voor ons cursusplatform. We hebben je aanmelding in goede orde ontvangen.
        </p>
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
          Zodra de cursussen beschikbaar zijn, ontvang je van ons een bericht.
        </p>
        <div style="background:${BRAND.brown};border-radius:12px;padding:18px;margin:20px 0;text-align:center;">
          <p style="font-size:14px;color:${BRAND.cream};margin:0;line-height:1.5;">
            Heb je vragen? Neem contact met ons op via<br>
            <a href="mailto:info@simweert.nl" style="color:${BRAND.goldLight};text-decoration:none;">info@simweert.nl</a>
          </p>
        </div>
        <p style="font-size:14px;color:${BRAND.textLight};line-height:1.6;margin:0;">
          Met vriendelijke groet,<br>
          <strong>Stichting Islamitische Moskee Weert</strong>
        </p>
      `;
      html = emailShell("Wachtlijst Bevestiging", "Je inschrijving is ontvangen", confirmBody);
      text = `Assalamu alaykum ${data.naam},\n\nHartelijk dank voor je inschrijving op de wachtlijst voor ons cursusplatform.\n\nZodra de cursussen beschikbaar zijn, ontvang je van ons een bericht.\n\nMet vriendelijke groet,\nStichting Islamitische Moskee Weert`;
    } else if (type === "crowdfunding_donation") {
      to = data.email;
      const donorName = data.naam || "Beste donateur";
      const projectTitle = data.projectTitle || "Crowdfunding";
      const bedrag = data.bedrag;

      subject = `Bedankt voor uw donatie aan ${projectTitle} 🤲`;
      html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2d2418;">
          <div style="background: #3d2e1a; padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #d4a84b; font-size: 22px; margin: 0;">Jazākumullāhu Khairan</h1>
            <p style="color: #f5f0e8; font-size: 13px; margin: 8px 0 0;">Moge Allah u belonen</p>
          </div>
          <div style="background: #faf8f4; padding: 28px 24px; border: 1px solid #e8e0d4; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 15px; line-height: 1.6;">Assalamu alaykum ${donorName},</p>
            <p style="font-size: 15px; line-height: 1.6;">
              Hartelijk dank voor uw donatie van <strong>€${bedrag}</strong> aan het project <strong>${projectTitle}</strong>.
            </p>
            <p style="font-size: 15px; line-height: 1.6;">
              Uw bijdrage draagt bij aan de groei van onze moskee en gemeenschap. Moge Allah uw gulheid rijkelijk belonen.
            </p>
            <div style="background: #f0ebe2; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
              <p style="font-size: 13px; color: #6b5d4d; margin: 0;">"Wie een moskee bouwt voor Allah, Allah bouwt voor hem een huis in het Paradijs."</p>
              <p style="font-size: 11px; color: #9a8b78; margin: 6px 0 0;">— Sahih al-Bukhari & Muslim</p>
            </div>
            <p style="font-size: 14px; color: #6b5d4d; line-height: 1.6;">
              Met vriendelijke groet,<br>
              <strong>Stichting Islamitische Moskee Weert</strong>
            </p>
          </div>
        </div>
      `;
      text = `Assalamu alaykum ${donorName},\n\nHartelijk dank voor uw donatie van €${bedrag} aan ${projectTitle}.\n\nMoge Allah uw gulheid rijkelijk belonen.\n\nMet vriendelijke groet,\nStichting Islamitische Moskee Weert`;
    } else if (type === "feedback_admin") {
      to = "zakariaachbib@live.nl";
      subject = `Nieuwe website feedback ontvangen`;
      const feedbackBody = `
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 8px;">
          Er is nieuwe feedback ontvangen via de website.
        </p>
        ${detailTable([
          ["✉️", "E-mail", data.email],
        ])}
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 6px;">Feedback</p>
          <p style="font-size:14px;color:${BRAND.text};margin:0;line-height:1.5;">${data.bericht}</p>
        </div>
      `;
      html = emailShell("Nieuwe Feedback", "Via simweert.nl", feedbackBody);
      text = `Nieuwe feedback\n\nE-mail: ${data.email}\n\nFeedback:\n${data.bericht}`;
    } else if (type === "feedback_confirmation") {
      to = data.email;
      subject = `Bedankt voor je feedback — SIM Weert`;
      const confirmBody = `
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
          Assalamu alaykum,
        </p>
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
          Hartelijk dank voor je feedback over onze website. We waarderen het dat je de moeite neemt om ons te helpen verbeteren.
        </p>
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 6px;">Jouw feedback</p>
          <p style="font-size:14px;color:${BRAND.text};margin:0;line-height:1.5;">${data.bericht}</p>
        </div>
        <p style="font-size:14px;color:${BRAND.textLight};line-height:1.6;margin:0;">
          Met vriendelijke groet,<br>
          <strong>Stichting Islamitische Moskee Weert</strong>
        </p>
      `;
      html = emailShell("Feedback Ontvangen", "Bedankt voor je bijdrage", confirmBody);
      text = `Assalamu alaykum,\n\nHartelijk dank voor je feedback over onze website.\n\nJouw feedback: ${data.bericht}\n\nMet vriendelijke groet,\nStichting Islamitische Moskee Weert`;
    } else if (type === "education_registration") {
      to = "zakariaachbib@live.nl";
      subject = `Nieuwe inschrijving onderwijs: ${data.voornamen} ${data.achternaam}`;
      const regBody = `
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 8px;">
          Er is een nieuwe inschrijving voor het onderwijs binnengekomen via de website.
        </p>
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Gegevens leerling</p>
        </div>
        ${detailTable([
          ["👤", "Achternaam", data.achternaam],
          ["👤", "Voornamen", data.voornamen],
          ["📅", "Geboortedatum", data.geboortedatum],
          ["⚧", "Geslacht", data.geslacht === "jongen" ? "Jongen" : "Meisje"],
        ])}
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Gegevens ouder/verzorger</p>
        </div>
        ${detailTable([
          ["👤", "Naam", data.ouder_naam],
          ["📞", "Telefoon", data.telefoon],
          ["📍", "Adres", data.adres],
          ["✉️", "E-mail", data.email],
        ])}
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Extra</p>
        </div>
        ${detailTable([
          ["📸", "Toestemming foto's", data.toestemming_foto ? "Ja" : "Nee"],
          ["✅", "Akkoord privacy", data.akkoord_privacy ? "Ja" : "Nee"],
        ])}
        ${data.opmerkingen ? `
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 6px;">Opmerkingen</p>
          <p style="font-size:14px;color:${BRAND.text};margin:0;line-height:1.5;">${data.opmerkingen}</p>
        </div>` : ""}
      `;
      html = emailShell("Nieuwe Inschrijving Onderwijs", "استمارة التسجيل", regBody);
      text = `Nieuwe inschrijving onderwijs\n\nLeerling: ${data.voornamen} ${data.achternaam}\nGeboortedatum: ${data.geboortedatum}\nGeslacht: ${data.geslacht}\n\nOuder/verzorger: ${data.ouder_naam}\nTelefoon: ${data.telefoon}\nAdres: ${data.adres}\nE-mail: ${data.email}\n\nToestemming foto's: ${data.toestemming_foto ? "Ja" : "Nee"}\nOpmerkingen: ${data.opmerkingen || "Geen"}`;
    } else if (type === "education_registration_confirmation") {
      to = data.email;
      subject = `Inschrijving ontvangen — Onderwijs Nahda Weert`;
      const confirmBody = `
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
          Assalamu alaykum <strong>${data.ouder_naam}</strong>,
        </p>
        <p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 16px;">
          Hartelijk dank voor de inschrijving van <strong>${data.voornamen} ${data.achternaam}</strong> voor het onderwijs bij Moskee Nahda Weert. Wij hebben uw aanmelding in goede orde ontvangen.
        </p>
        <div style="background:${BRAND.creamDark};border-radius:10px;padding:14px 16px;margin:16px 0;">
          <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};margin:0 0 4px;">Inschrijvingsgegevens</p>
        </div>
        ${detailTable([
          ["👤", "Leerling", `${data.voornamen} ${data.achternaam}`],
          ["📅", "Geboortedatum", data.geboortedatum],
          ["⚧", "Geslacht", data.geslacht === "jongen" ? "Jongen" : "Meisje"],
        ])}
        <div style="background:${BRAND.brown};border-radius:12px;padding:18px;margin:20px 0;text-align:center;">
          <p style="font-size:14px;color:${BRAND.cream};margin:0;line-height:1.5;">
            Voor vragen kunt u contact opnemen via<br>
            <a href="mailto:Alnahdaweert@gmail.com" style="color:${BRAND.goldLight};text-decoration:none;">Alnahdaweert@gmail.com</a>
          </p>
        </div>
        <p style="font-size:14px;color:${BRAND.textLight};line-height:1.6;margin:0;">
          Met vriendelijke groet,<br>
          <strong>Stichting Islamitische Moskee Weert</strong>
        </p>
      `;
      html = emailShell("Inschrijving Ontvangen", "Uw aanmelding is in behandeling", confirmBody);
      text = `Assalamu alaykum ${data.ouder_naam},\n\nHartelijk dank voor de inschrijving van ${data.voornamen} ${data.achternaam} voor het onderwijs bij Moskee Nahda Weert.\n\nWij hebben uw aanmelding in goede orde ontvangen.\n\nMet vriendelijke groet,\nStichting Islamitische Moskee Weert`;
    } else {
      throw new Error("Unknown email type");
    }

    await transporter.sendMail({
      from: '"SIM Weert Website" <info@simweert.nl>',
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
