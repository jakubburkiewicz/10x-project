import type { APIRoute } from "astro";
import { SaveGeneratedCardsCommandSchema } from "@/types";
import { aiService } from "@/lib/ai.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;

  /*
  if (!session || !user) {
    return new Response("Unauthorized", { status: 401 });
  }
  */
  const userId = user?.id ?? "00000000-0000-0000-0000-000000000000"; // Temporary user for testing

  const validationResult = SaveGeneratedCardsCommandSchema.safeParse(await request.json());

  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error), { status: 400 });
  }

  try {
    const { savedCards } = await aiService.saveGeneratedCards(supabase, userId, validationResult.data);

    return new Response(
      JSON.stringify({
        message: `Successfully saved ${savedCards?.length ?? 0} cards.`,
        savedCards,
      }),
      { status: 201 }
    );
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
};
