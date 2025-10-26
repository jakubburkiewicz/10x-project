import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const { email } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
    });
  }

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers, runtime: locals.runtime });

  // Note: `site` is not available here, so we construct the URL manually.
  // This assumes the app is hosted at the root of the domain.
  const redirectTo = new URL("/update-password", request.url).href;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(null, { status: 204 });
};
