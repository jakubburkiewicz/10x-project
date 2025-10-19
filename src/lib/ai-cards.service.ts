import type {
  GenerateCardsCommand,
  GenerateCardsResponseDto,
  SaveGeneratedCardsCommand,
  SaveGeneratedCardsResponseDto,
} from "@/types";

/**
 * Calls the API to generate card suggestions from the provided text.
 * @param command - The command object containing the text.
 * @returns A promise that resolves to the generated suggestions.
 */
export const generateCardSuggestions = async (command: GenerateCardsCommand): Promise<GenerateCardsResponseDto> => {
  const response = await fetch("/api/ai/generate-cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Błąd serwera: ${response.status}`);
  }

  return response.json();
};

/**
 * Calls the API to save the accepted card suggestions.
 * @param command - The command object containing the cards to save.
 * @returns A promise that resolves to the confirmation message.
 */
export const saveGeneratedCards = async (
  command: SaveGeneratedCardsCommand
): Promise<SaveGeneratedCardsResponseDto> => {
  const response = await fetch("/api/ai/save-generated-cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Błąd serwera: ${response.status}`);
  }

  return response.json();
};
