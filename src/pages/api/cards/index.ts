import type { APIRoute } from "astro";
import { ZodError, z } from "zod";
import { createCard, getCards } from "@/lib/cards.service";
import { CreateCardDtoSchema } from "@/types";

const GetCardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  source: z.enum(["manual", "ai"]).optional(),
  sortBy: z.enum(["created_at", "updated_at", "due_date"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const GET: APIRoute = async ({ request, locals }) => {
  const { user, session } = await locals.auth.getSession();

  if (!user || !session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = GetCardsQuerySchema.parse(queryParams);

    const { data, count } = await getCards(locals.supabase, user.id, validatedQuery);

    return new Response(JSON.stringify({ data, count }), {
      status: 200,
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
