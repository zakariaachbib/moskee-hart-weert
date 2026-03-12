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
    let to = "info@simweert.nl";

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
