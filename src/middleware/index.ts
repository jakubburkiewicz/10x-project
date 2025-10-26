import { createSupabaseServerInstance } from "@/db/supabase.client";
import { defineMiddleware } from "astro:middleware";

const PROTECTED_PATHS = ["/generate", "/cards"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];
const AUTH_API_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/update-password",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request, redirect } = context;

  const supabase = createSupabaseServerInstance({ cookies, runtime: context.locals.runtime });
  locals.supabase = supabase;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  locals.session = session;
  locals.user = session?.user ?? null;
  locals.auth = {
    getSession: async () => ({
      session: locals.session,
      user: locals.user,
    }),
  };

  if (url.pathname.startsWith("/api")) {
    if (AUTH_API_PATHS.includes(url.pathname)) {
      return next();
    }

    if (!locals.session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return next();
  }

  const code = url.searchParams.get("code");

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return redirect("/generate");
    } catch {
      const redirectUrl = new URL(url.origin);
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", "activation_failed");
      return redirect(redirectUrl.toString());
    }
  }

  if (url.pathname === "/") {
    if (locals.user) {
      return redirect("/generate");
    }
    return redirect("/login");
  }

  if (locals.user) {
    if (AUTH_PATHS.includes(url.pathname)) {
      return redirect("/generate");
    }
  } else {
    if (PROTECTED_PATHS.some((path) => url.pathname.startsWith(path))) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectedFrom", url.pathname);
      return redirect(redirectUrl.toString());
    }
  }

  return next();
});
