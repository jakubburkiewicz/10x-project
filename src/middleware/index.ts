import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "@/db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  context.locals.supabase = supabaseClient;
  context.locals.session = null;
  context.locals.user = null;

  if (accessToken && refreshToken) {
    const { data } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (data.session) {
      context.locals.session = data.session;
      context.locals.user = data.user;
    }
  }

  return next();
});
