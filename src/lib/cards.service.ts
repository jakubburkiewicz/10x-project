import type { SupabaseClient } from "@/db/supabase.client";
import type { CardDto, UpdateCardCommand } from "@/types";

export class CardNotFoundError extends Error {
  constructor(message = "Card not found or you don't have access to it") {
    super(message);
    this.name = "CardNotFoundError";
  }
}

interface GetCardsParams {
  page: number;
  pageSize: number;
  source?: "manual" | "ai";
  sortBy: "created_at" | "updated_at" | "due_date";
  order: "asc" | "desc";
}

/**
 * Fetches a paginated and filtered list of cards for a specific user.
 *
 * @param supabase - The Supabase client instance.
 * @param userId - The ID of the user whose cards are to be fetched.
 * @param params - The parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an object containing the card data and the total count.
 */
export async function getCardsForUser(
  supabase: SupabaseClient,
  userId: string,
  params: GetCardsParams
): Promise<{ data: CardDto[]; totalCount: number }> {
  const { page, pageSize, source, sortBy, order } = params;
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from("cards")
    .select("id, front, back, source, due_date, created_at, updated_at", {
      count: "exact",
    })
    .eq("user_id", userId);

  if (source) {
    query = query.eq("source", source);
  }

  query = query.order(sortBy, { ascending: order === "asc" }).range(rangeFrom, rangeTo);

  const { data, error, count } = await query;

  if (error) {
    throw new Error("Failed to fetch cards from the database.");
  }

  return { data: data || [], totalCount: count || 0 };
}

/**
 * Updates a card for the current user.
 *
 * @param id - The ID of the card to update.
 * @param data - The data to update the card with.
 * @param supabase - The Supabase client instance.
 * @returns The updated card.
 * @throws {CardNotFoundError} If the card is not found.
 * @throws {Error} If there is an error updating the card.
 */
export async function updateCard(id: string, data: UpdateCardCommand, supabase: SupabaseClient) {
  const { data: updatedCard, error } = await supabase
    .from("cards")
    .update(data)
    .eq("id", id)
    .select("id, front, back, source, due_date, created_at, updated_at")
    .single();

  if (error) {
    // RLS will prevent updates and return an empty data array, but the query itself doesn't error.
    // The .single() method will then trigger an error if no row is found.
    // We can interpret this as the card not being found for the current user.
    throw new CardNotFoundError();
  }

  return updatedCard;
}

/**
 * Deletes a card for the current user.
 *
 * @param cardId - The ID of the card to delete.
 * @param supabase - The Supabase client instance.
 * @throws {CardNotFoundError} If the card is not found or the user does not have permission to delete it.
 * @throws {Error} If there is a database error.
 */
export async function deleteCard(cardId: string, supabase: SupabaseClient) {
  const { error, count } = await supabase.from("cards").delete({ count: "exact" }).eq("id", cardId);

  if (error) {
    throw new Error("Failed to delete card from the database.");
  }

  if (count === 0) {
    // RLS prevents deletion, so the card either doesn't exist or doesn't belong to the user.
    throw new CardNotFoundError();
  }
}
