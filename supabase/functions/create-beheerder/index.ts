import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: isAdmin } = await callerClient.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Alleen superadmins mogen beheerders aanmaken" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { email, naam } = body;
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "E-mail is verplicht" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const password = generatePassword(12);

    // Create user (or find existing)
    let userId: string | null = null;
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: naam || "" },
    });

    if (createErr) {
      const msg = createErr.message || "";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        // User exists — look up id and reset password
        const { data: list } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (!existing) {
          return new Response(JSON.stringify({ error: "Gebruiker bestaat al maar kon niet worden gevonden" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    // Update profile name if provided
    if (naam) {
      await adminClient.from("profiles").update({ full_name: naam }).eq("id", userId);
    }

    // Assign 'beheerder' role (idempotent)
    const { error: roleErr } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: "beheerder" }, { onConflict: "user_id,role" });
    if (roleErr) {
      return new Response(JSON.stringify({ error: `Rol toekennen mislukt: ${roleErr.message}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Send invite email
    try {
      await adminClient.functions.invoke("send-email", {
        body: { type: "beheerder_invite", data: { email, naam, password } },
      });
    } catch (e) {
      console.error("Email send failed:", e);
      return new Response(JSON.stringify({ success: true, warning: "Account aangemaakt maar e-mail kon niet worden verzonden", password }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("create-beheerder error:", err);
    return new Response(JSON.stringify({ error: err.message || "Onbekende fout" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
