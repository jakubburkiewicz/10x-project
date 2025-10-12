import type { Tables, TablesInsert } from "@/db/database.types";
import { z } from "zod";

/**
 * Represents the full Card entity, derived directly from the database schema.
 * This type should be used internally within the application's business logic.
 */
export type Card = Tables<"cards">;

/**
 * DTO for a card object returned by the API.
 * It exposes a subset of the card's properties to the client.
 *
 * Used in:
 * - `GET /api/cards`
 * - `GET /api/cards/{id}`
 */
export type CardDto = Pick<Card, "id" | "front" | "back" | "source" | "due_date" | "created_at" | "updated_at">;

/**
 * Command Model for creating a new card.
 * It includes only the fields required from the user.
 *
 * Used in:
 * - `POST /api/cards`
 */
export type CreateCardCommand = Pick<TablesInsert<"cards">, "front" | "back" | "source">;

/**
 * Command Model for updating an existing card.
 * All fields are optional, allowing for partial updates.
 *
 * Used in:
 * - `PATCH /api/cards/{id}`
 */
export type UpdateCardCommand = Partial<Pick<Card, "front" | "back">>;

/**
 * DTO for the response of the `GET /api/cards` endpoint.
 * Includes the paginated list of cards and pagination metadata.
 */
export interface GetCardsResponseDto {
  data: CardDto[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}

/**
 * Command Model for generating card suggestions from text.
 *
 * Used in:
 * - `POST /api/ai/generate-cards`
 */
export const GenerateCardsCommandSchema = z.object({
  text: z.string().min(1000).max(10000),
});
export type GenerateCardsCommand = z.infer<typeof GenerateCardsCommandSchema>;

/**
 * DTO for a single AI-generated card suggestion.
 * This is a temporary structure before a card is saved.
 */
export type CardSuggestionDto = Pick<Card, "front" | "back">;

/**
 * DTO for the response of the `POST /api/ai/generate-cards` endpoint.
 */
export interface GenerateCardsResponseDto {
  suggestions: CardSuggestionDto[];
}

/**
 * Command Model for saving selected AI-generated cards.
 *
 * Used in:
 * - `POST /api/ai/save-generated-cards`
 */
export const SaveGeneratedCardsCommandSchema = z.object({
  originalText: z.string(),
  generatedCount: z.number().int().positive(),
  acceptedCards: z.array(
    z.object({
      front: z.string().max(200),
      back: z.string().max(500),
    })
  ),
});
export type SaveGeneratedCardsCommand = z.infer<typeof SaveGeneratedCardsCommandSchema>;

/**
 * DTO for the response of the `POST /api/ai/save-generated-cards` endpoint.
 */
export interface SaveGeneratedCardsResponseDto {
  message: string;
  savedCards: CardDto[];
}

/**
 * DTO for a card presented during a study session.
 * It contains only the essential information for studying.
 *
 * Used in:
 * - `GET /api/study-session`
 */
export type StudySessionCardDto = Pick<Card, "id" | "front" | "back" | "source">;

/**
 * DTO for the response of the `GET /api/study-session` endpoint.
 */
export interface GetStudySessionResponseDto {
  sessionCards: StudySessionCardDto[];
}

/**
 * Command Model for submitting a card review during a study session.
 *
 * Used in:
 * - `POST /api/study-session/review`
 */
export const ReviewCardCommandSchema = z.object({
  cardId: z.string().uuid(),
  quality: z.number().int().min(0).max(5),
});
export type ReviewCardCommand = z.infer<typeof ReviewCardCommandSchema>;

/**
 * DTO for the updated card data returned after a review.
 *
 * Used in:
 * - `POST /api/study-session/review`
 */
export interface ReviewCardResponseDto {
  message: string;
  updatedCard: Pick<Card, "id" | "interval" | "repetition" | "ease_factor" | "due_date">;
}
