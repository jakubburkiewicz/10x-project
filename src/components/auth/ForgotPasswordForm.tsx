import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email({
    message: "Nieprawidłowy format adresu e-mail.",
  }),
});

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Wystąpił nieznany błąd.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Nie udało się połączyć z serwerem.");
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-semibold">Sprawdź swoją skrzynkę pocztową</h3>
        <p className="text-sm text-muted-foreground">
          Wysłaliśmy Ci link do zresetowania hasła. Jeśli nie widzisz wiadomości, sprawdź folder ze spamem.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold tracking-tight">Zapomniałeś hasła?</h3>
        <p className="text-sm text-muted-foreground">
          Podaj swój adres e-mail, a wyślemy Ci link do zresetowania hasła.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres e-mail</FormLabel>
                <FormControl>
                  <Input placeholder="jan.kowalski@example.com" {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : "Zresetuj hasło"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
