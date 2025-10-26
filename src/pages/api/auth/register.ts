import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const POST: APIRoute = async ({ request, cookies, url, locals }) => {
  const { email, password } = await request.json();

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers, runtime: locals.runtime });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: url.origin,
    },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
  });
};
