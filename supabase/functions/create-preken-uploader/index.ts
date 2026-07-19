import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_EMAIL = "imad.gasmi@hotmail.com";

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) pwd += chars[arr[i] % chars.length];
  return pwd + "!";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const email = ALLOWED_EMAIL;
    const naam = "Imad Gasmi";
    const password = generatePassword(12);

    let userId: string | null = null;
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: naam },
    });

    if (createErr) {
      const msg = (createErr.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        const { data: list } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (!existing) {
          return new Response(JSON.stringify({ error: "Gebruiker bestaat maar niet gevonden" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        userId = existing.id;
        await adminClient.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
      } else {
        return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      userId = created.user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Kon gebruiker niet aanmaken" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await adminClient.from("profiles").update({ full_name: naam }).eq("id", userId);

    const { error: roleErr } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: "preken_uploader" as any }, { onConflict: "user_id,role" });
    if (roleErr) {
      return new Response(JSON.stringify({ error: `Rol toekennen mislukt: ${roleErr.message}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    try {
      await adminClient.functions.invoke("send-email", {
        body: { type: "preken_uploader_invite", data: { email, naam, password } },
      });
    } catch (e) {
      console.error("Email send failed:", e);
      return new Response(JSON.stringify({ success: true, warning: "Account aangemaakt maar e-mail kon niet worden verzonden", password }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("create-preken-uploader error:", err);
    return new Response(JSON.stringify({ error: err.message || "Onbekende fout" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
