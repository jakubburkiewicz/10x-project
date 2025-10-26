import { createServerClient, createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types.ts";

export type { SupabaseClient };

interface CloudflareRuntime {
  env?: {
    SUPABASE_URL?: string;
    SUPABASE_KEY?: string;
  };
}

export const createSupabaseServerInstance = (context: {
  cookies: AstroCookies;
  runtime?: CloudflareRuntime;
  headers?: Headers;
}) => {
  // Cloudflare Pages runtime env variables
  const supabaseUrl = context.runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = context.runtime?.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(key: string) {
        return context.cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        context.cookies.set(key, value, options);
      },
      remove(key: string, options: CookieOptions) {
        context.cookies.delete(key, options);
      },
    },
  });
};

export const createSupabaseBrowserInstance = () => {
  // Try to get values from window (injected by server), fallback to import.meta.env
  const supabaseUrl =
    (typeof window !== "undefined" && window.__SUPABASE_URL__) ||
    import.meta.env.PUBLIC_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL;

  const supabaseAnonKey =
    (typeof window !== "undefined" && window.__SUPABASE_ANON_KEY__) ||
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_ANON_KEY;

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};
