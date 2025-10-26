import { createSupabaseServerInstance } from "@/db/supabase.client";
import { defineMiddleware } from "astro:middleware";

const PROTECTED_PATHS = ["/generate"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });
  locals.supabase = supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    if (user) {
      return redirect("/generate");
    }
    return redirect("/login");
  }

  if (user) {
    locals.user = user;
    if (AUTH_PATHS.includes(url.pathname)) {
      return redirect("/generate");
    }
  } else {
    locals.user = null;
    if (PROTECTED_PATHS.some((path) => url.pathname.startsWith(path))) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectedFrom", url.pathname);
      return redirect(redirectUrl.toString());
    }
  }

  return next();
});
