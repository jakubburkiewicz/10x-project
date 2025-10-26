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
