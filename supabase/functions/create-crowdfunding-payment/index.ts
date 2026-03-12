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
    const { amount, naam, email, project_id, anoniem } = await req.json();

    if (!amount || amount < 5) {
      return new Response(
        JSON.stringify({ error: "Minimaal donatiebedrag is €5" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "Project ID is vereist" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) throw new Error("MOLLIE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project title for description
    const { data: project } = await supabase
      .from("crowdfunding_projects")
      .select("titel, slug")
      .eq("id", project_id)
      .single();

    const projectTitle = project?.titel || "Crowdfunding";
    const projectSlug = project?.slug || project_id;

    const webhookUrl = `${supabaseUrl}/functions/v1/mollie-webhook`;
    const redirectUrl = `https://simweert.nl/crowdfunding/${projectSlug}?donated=true`;

    // Create Mollie payment - allow multiple methods
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
        description: `Crowdfunding: ${projectTitle}`,
        redirectUrl,
        webhookUrl,
        metadata: {
          type: "crowdfunding",
          project_id,
          naam: naam || null,
          email: email || null,
          anoniem: anoniem || false,
        },
      }),
    });

    if (!mollieRes.ok) {
      const errorData = await mollieRes.json();
      console.error("Mollie error:", errorData);
      throw new Error(errorData?.detail || "Mollie payment creation failed");
    }

    const molliePayment = await mollieRes.json();

    // Store donation record
    await supabase.from("crowdfunding_donations").insert({
      project_id,
      bedrag: parseFloat(amount),
      naam: naam || null,
      email: email || null,
      anoniem: anoniem || false,
      mollie_payment_id: molliePayment.id,
      status: molliePayment.status,
    });

    return new Response(
      JSON.stringify({ checkoutUrl: molliePayment._links.checkout.href }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Er is een fout opgetreden" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
