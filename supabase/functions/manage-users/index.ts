import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the caller is an edu admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client with caller's token to check permissions
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is edu admin
    const { data: isAdmin } = await callerClient.rpc("has_edu_role", {
      _user_id: caller.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Geen admin rechten" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const url = new URL(req.url);
    const method = req.method;

    // GET: list users with their edu roles
    if (method === "GET") {
      const { data: roles } = await adminClient
        .from("edu_user_roles")
        .select("user_id, role");

      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email, phone_number, is_active, created_at")
        .order("created_at", { ascending: false });

      const users = (profiles || []).map((p: any) => {
        const userRole = (roles || []).find((r: any) => r.user_id === p.id);
        return { ...p, edu_role: userRole?.role || null };
      });

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: create user
    if (method === "POST") {
      const body = await req.json();
      const { email, password, full_name, phone_number, role } = body;

      if (!email || !password || !role) {
        return new Response(JSON.stringify({ error: "Email, wachtwoord en rol zijn verplicht" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || "" },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile
      if (full_name || phone_number) {
        await adminClient.from("profiles").update({
          full_name: full_name || "",
          phone_number: phone_number || null,
        }).eq("id", newUser.user.id);
      }

      // Assign edu role
      const { error: roleError } = await adminClient.from("edu_user_roles").insert({
        user_id: newUser.user.id,
        role,
      });

      if (roleError) {
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ user: newUser.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE: delete user
    if (method === "DELETE") {
      const body = await req.json();
      const { user_id } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is verplicht" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Don't allow deleting yourself
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Je kunt jezelf niet verwijderen" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH: update user role or toggle active
    if (method === "PATCH") {
      const body = await req.json();
      const { user_id, role, is_active } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is verplicht" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (role) {
        // Upsert role
        await adminClient.from("edu_user_roles").delete().eq("user_id", user_id);
        await adminClient.from("edu_user_roles").insert({ user_id, role });
      }

      if (typeof is_active === "boolean") {
        await adminClient.from("profiles").update({ is_active }).eq("id", user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Methode niet ondersteund" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
