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
    // Mollie sends webhook as application/x-www-form-urlencoded
    const contentType = req.headers.get("content-type") || "";
    let paymentId: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      paymentId = params.get("id");
    } else {
      try {
        const body = await req.json();
        paymentId = body.id;
      } catch {
        const text = await req.text();
        const params = new URLSearchParams(text);
        paymentId = params.get("id");
      }
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Missing payment id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) throw new Error("MOLLIE_API_KEY not configured");

    // Fetch payment status from Mollie
    const mollieRes = await fetch(
      `https://api.mollie.com/v2/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${mollieApiKey}` } }
    );

    if (!mollieRes.ok) {
      const errorData = await mollieRes.json();
      console.error("Mollie fetch error:", errorData);
      throw new Error("Failed to fetch payment from Mollie");
    }

    const molliePayment = await mollieRes.json();
    const status = molliePayment.status;
    const metadata = molliePayment.metadata || {};

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a crowdfunding payment
    if (metadata.type === "crowdfunding") {
      // Update crowdfunding donation status
      await supabase
        .from("crowdfunding_donations")
        .update({ status })
        .eq("mollie_payment_id", paymentId);

      // If paid, update project total and send confirmation email
      if (status === "paid") {
        const amount = parseFloat(molliePayment.amount.value);
        const { data: project } = await supabase
          .from("crowdfunding_projects")
          .select("opgehaald_bedrag, titel")
          .eq("id", metadata.project_id)
          .single();

        if (project) {
          await supabase
            .from("crowdfunding_projects")
            .update({ opgehaald_bedrag: (project.opgehaald_bedrag || 0) + amount })
            .eq("id", metadata.project_id);
        }

        // Send confirmation email to donor if email provided
        if (metadata.email) {
          try {
            const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                type: "crowdfunding_donation",
                data: {
                  email: metadata.email,
                  naam: metadata.naam || null,
                  bedrag: amount.toFixed(2),
                  projectTitle: project?.titel || "Crowdfunding",
                },
              }),
            });
            if (!emailRes.ok) {
              console.error("Email send failed:", await emailRes.text());
            }
          } catch (emailErr) {
            console.error("Email send error:", emailErr);
          }
        }
      }
    } else {
      // Regular donation - update payments table
      const { error } = await supabase
        .from("payments")
        .update({ status })
        .eq("mollie_payment_id", paymentId);

      if (error) {
        console.error("DB update error:", error);
        throw new Error("Failed to update payment status");
      }

      // If paid, also insert into donations table
      if (status === "paid") {
        await supabase.from("donations").insert({
          naam: metadata.naam || null,
          email: metadata.email || null,
          bedrag: parseFloat(molliePayment.amount.value),
          type: "mollie",
          notitie: metadata.notitie || null,
        });
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});