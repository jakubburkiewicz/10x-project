import { useEffect } from "react";
import { createSupabaseBrowserInstance } from "@/db/supabase.client";
import { Toaster, toast } from "sonner";
import type { AuthError } from "@supabase/supabase-js";

export const AccountActivator = () => {
  useEffect(() => {
    const supabase = createSupabaseBrowserInstance();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("code")) {
          toast.success("Konto zostało pomyślnie aktywowane!");
          // Redirect to /generate after successful activation
          setTimeout(() => {
            window.location.href = "/generate";
          }, 1000);
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
          // Redirect to login on error
          setTimeout(() => {
            window.location.href = "/login?error=activation_failed";
          }, 2000);
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
