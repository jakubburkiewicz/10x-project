import type { APIRoute } from "astro";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { rateLimiterService } from "@/lib/rate-limiter.service";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

  if (!rateLimiterService.checkLimit(ip)) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
      }),
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: fromZodError(parsed.error).toString(),
      }),
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const { supabase } = locals;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === "Invalid login credentials") {
      return new Response(JSON.stringify({ error: "Nieprawidłowe dane logowania." }), {
        status: 401,
      });
    }
    if (error.message === "Email not confirmed") {
      return new Response(JSON.stringify({ error: "Proszę potwierdzić adres e-mail." }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
  });
};
