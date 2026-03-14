import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, naam, email, notitie, method } = await req.json();

    if (!amount || amount < 5) {
      return new Response(JSON.stringify({ error: "Minimaal donatiebedrag is €5" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) {
      throw new Error("MOLLIE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Construct webhook URL using Supabase edge function URL
    const webhookUrl = `${supabaseUrl}/functions/v1/mollie-webhook`;

    // Create payment in Mollie
    const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: {
          currency: "EUR",
          value: parseFloat(amount).toFixed(2),
        },
        description: `Donatie SIM Weert${notitie ? ` - ${notitie}` : ""}`,
        redirectUrl: "https://simweert.nl/bedankt",
        webhookUrl,
        ...(method && method !== "applepay" ? { method } : {}),
        ...(method === "applepay" ? { method: "applepay" } : {}),
        metadata: {
          naam: naam || null,
          email: email || null,
          notitie: notitie || null,
        },
      }),
    });

    if (!mollieRes.ok) {
      const errorData = await mollieRes.json();
      console.error("Mollie error:", errorData);
      throw new Error(errorData?.detail || "Mollie payment creation failed");
    }

    const molliePayment = await mollieRes.json();

    // Store payment in payments table
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("payments").insert({
      mollie_payment_id: molliePayment.id,
      amount: parseFloat(amount),
      status: molliePayment.status,
      naam: naam || null,
      email: email || null,
      description: `Donatie SIM Weert${notitie ? ` - ${notitie}` : ""}`,
    });

    return new Response(
      JSON.stringify({ checkoutUrl: molliePayment._links.checkout.href }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Er is een fout opgetreden" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
