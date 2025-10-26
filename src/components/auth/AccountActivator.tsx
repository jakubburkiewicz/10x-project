import { useEffect } from "react";
import { createSupabaseBrowserInstance } from "@/db/supabase.client";
import { Toaster, toast } from "sonner";
import type { AuthError } from "@supabase/supabase-js";

export const AccountActivator = () => {
  useEffect(() => {
    const supabase = createSupabaseBrowserInstance();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === "SIGNED_IN") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("code")) {
          toast.success("Konto zostało pomyślnie aktywowane!");
          url.searchParams.delete("code");
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    });

    const handleCodeExchange = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } catch (error) {
          const authError = error as AuthError;
          toast.error(`Błąd aktywacji konta: ${authError.message}`);
          url.searchParams.delete("code");
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    };

    handleCodeExchange();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <Toaster richColors />;
};
