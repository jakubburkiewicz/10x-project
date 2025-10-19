import { OpenRouterService } from "@/lib/openrouter.service";
import { AnthropicService } from "@/lib/anthropic.service";
import type { CardSuggestionDto, SaveGeneratedCardsCommand } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const CardSuggestionSchema = z.object({
  front: z.string(),
  back: z.string(),
});

const SuggestionsResponseSchema = z.object({
  suggestions: z.array(CardSuggestionSchema),
});

const SYSTEM_PROMPT = `
You are an expert in creating flashcards. Your task is to analyze the provided text and generate a list of question-and-answer pairs that can be used as flashcards for studying.

RULES:
- Generate between 5 and 15 flashcards.
- Each flashcard must have a "front" (question) and a "back" (answer).
- Questions should be clear and concise.
- Answers should be accurate and directly related to the question.
- The output must be a valid JSON object.
- The JSON output should follow this structure: { "suggestions": [{ "front": "Question", "back": "Answer" }, ...] }.
- Do not include any text other than the JSON object in your response.
`;

export class LLMServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMServiceError";
  }
}

async function generateCardSuggestions(text: string): Promise<CardSuggestionDto[]> {
  try {
    const aiProvider = import.meta.env.AI_PROVIDER ?? "openrouter";
    let response;

    if (aiProvider === "anthropic") {
      const anthropicService = new AnthropicService();
      response = await anthropicService.getJsonResponse({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: text,
        modelName: "claude-3-5-sonnet-20240620",
        responseSchema: SuggestionsResponseSchema,
      });
    } else {
      const openRouterService = new OpenRouterService();
      response = await openRouterService.getJsonResponse({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: text,
        modelName: "openai/gpt-3.5-turbo",
        responseSchema: SuggestionsResponseSchema,
      });
    }

    return response.suggestions;
  } catch (error) {
    if (error instanceof Error) {
      throw new LLMServiceError(error.message);
    }
    throw new LLMServiceError("An unknown error occurred while generating card suggestions.");
  }
}

async function saveGeneratedCards(supabase: SupabaseClient, userId: string, command: SaveGeneratedCardsCommand) {
  const { acceptedCards, generatedCount, originalText } = command;

  if (acceptedCards.length === 0) {
    // Even if no cards are accepted, we should log the generation event.
    const { error: logError } = await supabase.from("ai_generations").insert({
      user_id: userId,
      input_text: originalText,
      generated_count: generatedCount,
      accepted_count: 0,
    });

    if (logError) {
      console.error("Error logging AI generation:", logError);
    }

    return { savedCards: [] };
  }

  const cardsToInsert = acceptedCards.map((card) => ({
    ...card,
    user_id: userId,
    source: "ai" as const,
  }));

  // Perform both operations in a transaction
  const { data, error } = await supabase.rpc("save_cards_and_log_generation", {
    cards_to_insert: cardsToInsert,
    generation_log: {
      user_id: userId,
      input_text: originalText,
      generated_count: generatedCount,
      accepted_count: acceptedCards.length,
    },
  });

  if (error) {
    console.error("Error in save_cards_and_log_generation RPC:", error);
    throw new Error("Failed to save generated cards and log generation.");
  }

  // The RPC function will return the saved cards
  return { savedCards: data };
}

export const aiService = {
  generateCardSuggestions,
  saveGeneratedCards,
};
