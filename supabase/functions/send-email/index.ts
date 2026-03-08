import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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

    const client = new SmtpClient();

    await client.connectTLS({
      hostname: "smtp.strato.de",
      port: 465,
      username: "info@simweert.nl",
      password: SMTP_PASSWORD,
    });

    let subject = "";
    let body = "";

    if (type === "contact") {
      subject = `Nieuw contactbericht: ${data.onderwerp}`;
      body = `Er is een nieuw contactbericht ontvangen via de website.\n\n` +
        `Naam: ${data.naam}\n` +
        `E-mail: ${data.email}\n` +
        `Onderwerp: ${data.onderwerp}\n\n` +
        `Bericht:\n${data.bericht}\n\n` +
        `---\nDit bericht is automatisch verzonden via simweert.nl`;
    } else if (type === "membership") {
      subject = `Nieuwe lidmaatschapsaanvraag: ${data.naam}`;
      body = `Er is een nieuwe lidmaatschapsaanvraag ontvangen via de website.\n\n` +
        `Naam: ${data.naam}\n` +
        `E-mail: ${data.email}\n` +
        `Telefoon: ${data.telefoon || "Niet opgegeven"}\n` +
        `Adres: ${data.adres || "Niet opgegeven"}\n` +
        `Geboortedatum: ${data.geboortedatum || "Niet opgegeven"}\n` +
        `Opmerking: ${data.opmerking || "Geen"}\n\n` +
        `---\nDit bericht is automatisch verzonden via simweert.nl`;
    } else {
      throw new Error("Unknown email type");
    }

    await client.send({
      from: "info@simweert.nl",
      to: "info@simweert.nl",
      subject,
      content: body,
    });

    await client.close();

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
