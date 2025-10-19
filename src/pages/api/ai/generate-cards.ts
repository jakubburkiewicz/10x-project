import type { APIContext } from "astro";
import { GenerateCardsCommandSchema } from "@/types";
import { rateLimiterService } from "@/lib/rate-limiter.service";
import { aiService, LLMServiceError } from "@/lib/ai.service";

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const { user } = context.locals;

  /*
  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!rateLimiterService.checkLimit(user.id)) {
    return new Response(JSON.stringify({ message: "Too Many Requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }
  */

  const validation = GenerateCardsCommandSchema.safeParse(await context.request.json());

  if (!validation.success) {
    return new Response(JSON.stringify({ message: "Bad Request", errors: validation.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { text } = validation.data;
    const suggestions = await aiService.generateCardSuggestions(text);

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof LLMServiceError) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Unexpected error in generate-cards endpoint:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
