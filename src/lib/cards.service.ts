import type { SupabaseClient } from "@/db/supabase.client";
import type { CardDto } from "@/types";

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
 * Retrieves a single card by its ID for the authenticated user.
 * RLS is expected to enforce ownership.
 *
 * @param supabase - The Supabase client instance.
 * @param cardId - The UUID of the card to retrieve.
 * @returns A promise that resolves to the CardDto if found, otherwise null.
 */
export async function getCardById(supabase: SupabaseClient, cardId: string): Promise<CardDto | null> {
  const { data, error } = await supabase
    .from("cards")
    .select("id, front, back, source, due_date, created_at, updated_at")
    .eq("id", cardId)
    .single();

  if (error) {
    // PGRST116: "The result contains 0 rows" - this is the expected error when no card is found.
    if (error.code === "PGRST116") {
      return null;
    }
    // For other errors, we should not expose internal details to the client.
    // Logging them on the server is sufficient.
    throw new Error("An unexpected error occurred while fetching the card.");
  }

  return data;
}

/**
 * Retrieves a single card by its ID for the authenticated user.
 * RLS is expected to enforce ownership.
 *
 * @param supabase - The Supabase client instance.
 * @param cardId - The UUID of the card to retrieve.
 * @returns A promise that resolves to the CardDto if found, otherwise null.
 */
export async function getCardById(supabase: SupabaseClient, cardId: string): Promise<CardDto | null> {
  const { data, error } = await supabase
    .from("cards")
    .select("id, front, back, source, due_date, created_at, updated_at")
    .eq("id", cardId)
    .single();

  if (error) {
    // PGRST116: "The result contains 0 rows" - this is the expected error when no card is found.
    if (error.code === "PGRST116") {
      return null;
    }
    // For other errors, log them and re-throw or handle as appropriate.
    console.error("Error fetching card by ID:", error);
    throw error;
  }

  return data;
}
