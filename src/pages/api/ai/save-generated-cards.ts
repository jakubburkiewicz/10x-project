import type { APIRoute } from "astro";
import { SaveGeneratedCardsCommandSchema } from "@/types";
import { aiService } from "@/lib/ai.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const { session, supabase, user } = locals;

  if (!session || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const validationResult = SaveGeneratedCardsCommandSchema.safeParse(await request.json());

  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error), { status: 400 });
  }

  try {
    const { savedCards } = await aiService.saveGeneratedCards(supabase, user.id, validationResult.data);

    return new Response(
      JSON.stringify({
        message: `Successfully saved ${savedCards?.length ?? 0} cards.`,
        savedCards,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving generated cards:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
