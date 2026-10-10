import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
const schema = z.object({ amount: z.number().finite().min(5).max(1000000), project_id: z.string().uuid(), naam: z.string().max(100).nullable().optional(), email: z.union([z.string().email().max(255), z.literal('')]).nullable().optional(), anoniem: z.boolean().optional() });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Ongeldige donatiegegevens' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { amount, email, project_id } = parsed.data;
    const anoniem = parsed.data.anoniem || !parsed.data.naam?.trim();
    const naam = anoniem ? null : parsed.data.naam?.trim();
    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) throw new Error("MOLLIE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Configuration unavailable");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project title for description
    const { data: project } = await supabase
      .from("crowdfunding_projects")
      .select("titel, slug, actief")
      .eq("id", project_id)
      .single();

    if (!project?.actief) return new Response(JSON.stringify({ error: "Project niet beschikbaar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const donationId = crypto.randomUUID();
    const projectTitle = project?.titel || "Crowdfunding";
    const projectSlug = project?.slug || project_id;

    const webhookUrl = `${supabaseUrl}/functions/v1/mollie-webhook`;
    const redirectUrl = `https://simweert.nl/crowdfunding/${projectSlug}?donated=true&donation=${donationId}`;

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
          value: Number(amount).toFixed(2),
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
    const { error: insertError } = await supabase.from("crowdfunding_donations").insert({
      id: donationId,
      project_id,
      bedrag: Number(amount),
      naam: naam || null,
      email: email || null,
      anoniem: anoniem || false,
      mollie_payment_id: molliePayment.id,
      status: molliePayment.status,
    });

    if (insertError) {
      await fetch(`https://api.mollie.com/v2/payments/${molliePayment.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${mollieApiKey}` } });
      throw new Error("Donation could not be stored");
    }
    return new Response(
      JSON.stringify({ checkoutUrl: molliePayment._links.checkout.href }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Betaling kon niet worden gestart" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
