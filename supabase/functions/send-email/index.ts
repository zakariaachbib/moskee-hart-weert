import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      text = `Er is een nieuw contactbericht ontvangen via de website.\n\n` +
        `Naam: ${data.naam}\n` +
        `E-mail: ${data.email}\n` +
        `Onderwerp: ${data.onderwerp}\n\n` +
        `Bericht:\n${data.bericht}\n\n` +
        `---\nDit bericht is automatisch verzonden via simweert.nl`;
    } else if (type === "membership") {
      subject = `Nieuwe lidmaatschapsaanvraag: ${data.naam}`;
      text = `Er is een nieuwe lidmaatschapsaanvraag ontvangen via de website.\n\n` +
        `Naam: ${data.naam}\n` +
        `E-mail: ${data.email}\n` +
        `Telefoon: ${data.telefoon || "Niet opgegeven"}\n` +
        `Adres: ${data.adres || "Niet opgegeven"}\n` +
        `Geboortedatum: ${data.geboortedatum || "Niet opgegeven"}\n` +
        `Opmerking: ${data.opmerking || "Geen"}\n\n` +
        `---\nDit bericht is automatisch verzonden via simweert.nl`;
    } else if (type === "facility_reservation") {
      to = "ghanmi_32@hotmail.com";
      const typeLabels: Record<string, string> = { hall: "Zaal", kitchen: "Keuken", hall_and_kitchen: "Zaal + keuken" };
      const activityLabels: Record<string, string> = { feest: "Feest", familie: "Familie bijeenkomst", vergadering: "Vergadering", overig: "Overig" };
      subject = `Nieuwe zaalreservering: ${data.name} — ${data.date}`;
      html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2d2418;">
          <div style="background: #3d2e1a; padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #d4a84b; font-size: 22px; margin: 0;">Nieuwe Zaalreservering</h1>
            <p style="color: #f5f0e8; font-size: 13px; margin: 8px 0 0;">Er is een nieuwe aanvraag binnengekomen</p>
          </div>
          <div style="background: #faf8f4; padding: 28px 24px; border: 1px solid #e8e0d4; border-top: none; border-radius: 0 0 16px 16px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b5d4d; width: 130px;">Naam</td><td style="padding: 8px 0; font-weight: 600;">${data.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b5d4d;">Telefoon</td><td style="padding: 8px 0;">${data.phone}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b5d4d;">E-mail</td><td style="padding: 8px 0;">${data.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b5d4d;">Datum</td><td style="padding: 8px 0; font-weight: 600;">${data.date}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b5d4d;">Tijd</td><td style="padding: 8px 0;">${data.start_time} – ${data.end_time}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b5d4d;">Type</td><td style="padding: 8px 0;">${typeLabels[data.reservation_type] || data.reservation_type}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b5d4d;">Zalen</td><td style="padding: 8px 0;">${data.rooms}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b5d4d;">Personen</td><td style="padding: 8px 0;">${data.guest_count}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b5d4d;">Activiteit</td><td style="padding: 8px 0;">${activityLabels[data.activity_type] || data.activity_type}</td></tr>
              ${data.notes ? `<tr><td style="padding: 8px 0; color: #6b5d4d; vertical-align: top;">Opmerkingen</td><td style="padding: 8px 0;">${data.notes}</td></tr>` : ""}
            </table>
            <p style="font-size: 12px; color: #9a8b78; margin-top: 20px; text-align: center;">Dit bericht is automatisch verzonden via simweert.nl</p>
          </div>
        </div>
      `;
      text = `Nieuwe zaalreservering\n\nNaam: ${data.name}\nTelefoon: ${data.phone}\nE-mail: ${data.email}\nDatum: ${data.date}\nTijd: ${data.start_time} – ${data.end_time}\nType: ${typeLabels[data.reservation_type] || data.reservation_type}\nZalen: ${data.rooms}\nPersonen: ${data.guest_count}\nActiviteit: ${activityLabels[data.activity_type] || data.activity_type}\nOpmerkingen: ${data.notes || "Geen"}`;
    } else if (type === "tour_request") {
      to = "ghanmi_32@hotmail.com";
      subject = `Nieuwe rondleiding aanvraag: ${data.naam}`;
      html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2d2418;">
          <div style="background: #3d2e1a; padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #d4a84b; font-size: 22px; margin: 0;">Nieuwe Rondleiding Aanvraag</h1>
            <p style="color: #f5f0e8; font-size: 13px; margin: 8px 0 0;">Er is een nieuwe aanvraag binnengekomen</p>
          </div>
          <div style="background: #faf8f4; padding: 28px 24px; border: 1px solid #e8e0d4; border-top: none; border-radius: 0 0 16px 16px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b5d4d; width: 130px;">Naam</td><td style="padding: 8px 0; font-weight: 600;">${data.naam}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b5d4d;">E-mail</td><td style="padding: 8px 0;">${data.email}</td></tr>
              ${data.datum ? `<tr><td style="padding: 8px 0; color: #6b5d4d;">Gewenste datum</td><td style="padding: 8px 0; font-weight: 600;">${data.datum}</td></tr>` : ""}
              ${data.tijd ? `<tr><td style="padding: 8px 0; color: #6b5d4d;">Voorkeurstijd</td><td style="padding: 8px 0;">${data.tijd}</td></tr>` : ""}
              ${data.bericht ? `<tr><td style="padding: 8px 0; color: #6b5d4d; vertical-align: top;">Bericht</td><td style="padding: 8px 0;">${data.bericht}</td></tr>` : ""}
            </table>
            <p style="font-size: 12px; color: #9a8b78; margin-top: 20px; text-align: center;">Dit bericht is automatisch verzonden via simweert.nl</p>
          </div>
        </div>
      `;
      text = `Nieuwe rondleiding aanvraag\n\nNaam: ${data.naam}\nE-mail: ${data.email}\nDatum: ${data.datum || "Niet opgegeven"}\nTijd: ${data.tijd || "Niet opgegeven"}\nBericht: ${data.bericht || "Geen"}`;
    } else if (type === "crowdfunding_donation") {
      // Confirmation email to donor
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
