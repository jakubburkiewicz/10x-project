import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { password, code } = await request.json();

  if (!password) {
    return new Response(JSON.stringify({ error: "Hasło jest wymagane." }), {
      status: 400,
    });
  }

  // Forgot password flow: Exchange code for session
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy lub wygasły token. Spróbuj ponownie poprosić o zresetowanie hasła." }),
        { status: 401 }
      );
    }
  } else {
    // Logged-in user flow: Check for existing session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji. Sesja wygasła lub jest nieprawidłowa." }), {
        status: 401,
      });
    }
  }

  // At this point, the user is authenticated either via code or an existing session.
  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ message: "Hasło zostało pomyślnie zaktualizowane." }), { status: 200 });
};
