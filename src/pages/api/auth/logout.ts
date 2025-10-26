import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
  const { supabase } = locals;

  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  // After signing out, clear the cookies to ensure the session is properly terminated.
  locals.supabase.auth.setSession({
    access_token: "",
    refresh_token: "",
  });

  return redirect("/login");
};
