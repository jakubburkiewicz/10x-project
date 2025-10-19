import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardSuggestionDto, SaveGeneratedCardsCommand } from "@/types";

const SYSTEM_PROMPT = `
You are an expert in creating flashcards. Your task is to analyze the provided text and generate a list of question-and-answer pairs that can be used as flashcards for studying.

RULES:
- Generate between 5 and 15 flashcards.
- Each flashcard must have a "front" (question) and a "back" (answer).
- Questions should be clear and concise.
- Answers should be accurate and directly related to the question.
- The output must be a valid JSON array of objects, where each object represents a flashcard.
- The JSON output should follow this structure: [{ "front": "Question", "back": "Answer" }, ...].
- Do not include any text other than the JSON array in your response.
`;

export class LLMServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMServiceError";
  }
}

async function generateCardSuggestions(text: string): Promise<CardSuggestionDto[]> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("LLM API request failed:", response.status, errorBody);
      throw new LLMServiceError(`LLM API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("LLM API response is missing content:", data);
      throw new LLMServiceError("LLM API response is missing content.");
    }

    const suggestions = JSON.parse(content);
    return suggestions;
  } catch (error) {
    console.error("Error generating card suggestions:", error);
    if (error instanceof LLMServiceError) {
      throw error;
    }
    throw new LLMServiceError("Failed to generate card suggestions.");
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
