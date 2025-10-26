import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z
  .object({
    email: z.string().email({
      message: "Nieprawidłowy format adresu e-mail.",
    }),
    password: z.string().min(8, {
      message: "Hasło musi mieć co najmniej 8 znaków.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne.",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // TODO: Implement backend call
    console.log(values);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hasło</FormLabel>
              <FormControl>
                <Input placeholder="********" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Powtórz hasło</FormLabel>
              <FormControl>
                <Input placeholder="********" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : "Zarejestruj się"}
        </Button>
      </form>
    </Form>
  );
}
