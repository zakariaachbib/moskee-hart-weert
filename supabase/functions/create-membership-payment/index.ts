import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voornaam, achternaam, straat, postcode, plaats, email, telefoon, type, bedrag } = await req.json();

    const memberType = type === "drager" ? "drager" : "lid";
    const memberBedrag = memberType === "drager" ? parseFloat(bedrag) : 20.00;

    // Validate required fields
    if (!voornaam?.trim() || !achternaam?.trim() || !straat?.trim() || !postcode?.trim() || !plaats?.trim() || !email?.trim()) {
      return new Response(JSON.stringify({ error: "Alle verplichte velden moeten ingevuld zijn" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate bedrag for drager
    if (memberType === "drager" && (!memberBedrag || memberBedrag < 5)) {
      return new Response(JSON.stringify({ error: "Het minimale bedrag voor dragers is €5 per maand" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: "Ongeldig e-mailadres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) throw new Error("MOLLIE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create Mollie customer
    const customerRes = await fetch("https://api.mollie.com/v2/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${voornaam.trim()} ${achternaam.trim()}`,
        email: email.trim(),
      }),
    });

    if (!customerRes.ok) {
      const err = await customerRes.json();
      console.error("Mollie customer creation error:", err);
      throw new Error("Kon klant niet aanmaken bij Mollie");
    }

    const customer = await customerRes.json();

    // Step 2: Store member in database
    const { data: member, error: dbError } = await supabase.from("members").insert({
      voornaam: voornaam.trim(),
      achternaam: achternaam.trim(),
      straat: straat.trim(),
      postcode: postcode.trim(),
      plaats: plaats.trim(),
      email: email.trim(),
      telefoon: telefoon?.trim() || null,
      mollie_customer_id: customer.id,
      status: "pending_verification",
      type: memberType,
      bedrag: memberBedrag,
    }).select().single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      throw new Error("Kon lid niet opslaan");
    }

    // Step 3: Create €0.01 iDEAL verification payment
    const webhookUrl = `${supabaseUrl}/functions/v1/membership-webhook`;
    const description = memberType === "drager"
      ? "Verificatie dragerschap Nahda Moskee Weert"
      : "Verificatie lidmaatschap Nahda Moskee Weert";
    const redirectType = memberType === "drager" ? "dragerschap" : "lidmaatschap";

    const paymentRes = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: "0.01" },
        description,
        redirectUrl: `https://simweert.nl/bedankt?type=${redirectType}`,
        webhookUrl,
        method: "ideal",
        customerId: customer.id,
        sequenceType: "first",
        metadata: {
          type: "membership_verification",
          member_id: member.id,
          customer_id: customer.id,
        },
      }),
    });

    if (!paymentRes.ok) {
      const err = await paymentRes.json();
      console.error("Mollie payment error:", err);
      throw new Error(err?.detail || "Kon verificatiebetaling niet aanmaken");
    }

    const payment = await paymentRes.json();

    return new Response(
      JSON.stringify({ checkoutUrl: payment._links.checkout.href }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Membership error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Er is een fout opgetreden" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
