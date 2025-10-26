/// <reference types="astro/client" />

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      auth: {
        getSession: () => Promise<{
          session: Session | null;
          user: User | null;
        }>;
      };
      session: Session | null;
      user: User | null;
      runtime?: {
        env?: {
          SUPABASE_URL?: string;
          SUPABASE_KEY?: string;
        };
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
