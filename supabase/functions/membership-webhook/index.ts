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
    // Parse payment ID from webhook
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch payment from Mollie
    const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mollieApiKey}` },
    });

    if (!mollieRes.ok) {
      const err = await mollieRes.json();
      console.error("Mollie fetch error:", err);
      throw new Error("Failed to fetch payment from Mollie");
    }

    const payment = await mollieRes.json();
    const metadata = payment.metadata || {};

    // Only handle membership verification payments
    if (metadata.type !== "membership_verification") {
      return new Response(JSON.stringify({ status: "ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const memberId = metadata.member_id;
    const customerId = metadata.customer_id;

    if (payment.status === "paid") {
      console.log(`Membership verification paid for member ${memberId}`);

      // Get the mandate created by the first payment
      const mandateRes = await fetch(
        `https://api.mollie.com/v2/customers/${customerId}/mandates`,
        { headers: { Authorization: `Bearer ${mollieApiKey}` } }
      );

      if (!mandateRes.ok) {
        console.error("Failed to fetch mandates");
        throw new Error("Failed to fetch mandates");
      }

      const mandates = await mandateRes.json();
      const validMandate = mandates._embedded?.mandates?.find(
        (m: any) => m.status === "valid" || m.status === "pending"
      );

      if (!validMandate) {
        console.error("No valid mandate found");
        await supabase.from("members").update({ status: "mandate_failed" }).eq("id", memberId);
        return new Response(JSON.stringify({ status: "no_mandate" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create subscription
      const subscriptionRes = await fetch(
        `https://api.mollie.com/v2/customers/${customerId}/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mollieApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: { currency: "EUR", value: "20.00" },
            interval: "1 month",
            description: "Lidmaatschap Nahda Moskee Weert",
            webhookUrl: `${supabaseUrl}/functions/v1/membership-webhook`,
            metadata: {
              type: "membership_subscription",
              member_id: memberId,
            },
          }),
        }
      );

      if (!subscriptionRes.ok) {
        const err = await subscriptionRes.json();
        console.error("Subscription creation error:", err);
        await supabase.from("members").update({ status: "subscription_failed" }).eq("id", memberId);
        throw new Error("Failed to create subscription");
      }

      const subscription = await subscriptionRes.json();

      // Update member record
      await supabase.from("members").update({
        mollie_subscription_id: subscription.id,
        mollie_mandate_id: validMandate.id,
        status: "active",
      }).eq("id", memberId);

      // Send confirmation email
      const { data: member } = await supabase.from("members").select("*").eq("id", memberId).single();
      if (member?.email) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              type: "membership_confirmation",
              data: {
                email: member.email,
                naam: `${member.voornaam} ${member.achternaam}`,
              },
            }),
          });
        } catch (emailErr) {
          console.error("Email send error:", emailErr);
        }
      }

      console.log(`Subscription ${subscription.id} created for member ${memberId}`);
    } else if (payment.status === "failed" || payment.status === "canceled" || payment.status === "expired") {
      await supabase.from("members").update({ status: "verification_failed" }).eq("id", memberId);
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Membership webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
