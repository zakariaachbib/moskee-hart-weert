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
    const { id: paymentId } = await req.json();

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Missing payment id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) {
      throw new Error("MOLLIE_API_KEY not configured");
    }

    // Fetch payment status from Mollie
    const mollieRes = await fetch(
      `https://api.mollie.com/v2/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${mollieApiKey}`,
        },
      }
    );

    if (!mollieRes.ok) {
      const errorData = await mollieRes.json();
      console.error("Mollie fetch error:", errorData);
      throw new Error("Failed to fetch payment from Mollie");
    }

    const molliePayment = await mollieRes.json();
    const status = molliePayment.status; // open, canceled, pending, expired, failed, paid

    // Update payment status in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("payments")
      .update({ status })
      .eq("mollie_payment_id", paymentId);

    if (error) {
      console.error("DB update error:", error);
      throw new Error("Failed to update payment status");
    }

    // If paid, also update the donations table
    if (status === "paid") {
      const metadata = molliePayment.metadata || {};
      await supabase.from("donations").insert({
        naam: metadata.naam || null,
        email: metadata.email || null,
        bedrag: parseFloat(molliePayment.amount.value),
        type: "mollie",
        notitie: metadata.notitie || null,
      });
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook processing failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
