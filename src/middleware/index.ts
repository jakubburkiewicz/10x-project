import { createSupabaseServerInstance } from "@/db/supabase.client";
import { defineMiddleware } from "astro:middleware";

const PROTECTED_PATHS = ["/generate"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/update-password"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });
  locals.supabase = supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email ?? "",
      id: user.id,
    };
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
