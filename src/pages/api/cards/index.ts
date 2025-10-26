import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { createCard } from "@/lib/cards.service";
import { CreateCardDtoSchema } from "@/types";

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, session } = await locals.auth.getSession();

  if (!user || !session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = CreateCardDtoSchema.parse(body);

    const newCard = await createCard(validatedData, user.id, locals.supabase);

    return new Response(JSON.stringify(newCard), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(JSON.stringify(error.flatten()), { status: 400 });
    }

    // TODO: Add proper error logging
    return new Response("Internal Server Error", { status: 500 });
  }
};
