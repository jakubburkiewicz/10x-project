import type { APIContext } from "astro";
import { z } from "zod";
import { getCardById } from "@/lib/cards.service";

const CardIdSchema = z.string().uuid();

/**
 * GET /api/cards/{id}
 *
 * Retrieves a single card by its unique identifier.
 * - Requires authentication.
 * - The user can only retrieve their own cards (enforced by RLS).
 *
 * Path Parameters:
 * @param {string} id - The UUID of the card to retrieve.
 *
 * Responses:
 * @returns {Response} 200 OK - The card data as a JSON object.
 * @returns {Response} 400 Bad Request - If the provided ID is not a valid UUID.
 * @returns {Response} 404 Not Found - If the card does not exist or the user does not have access.
 * @returns {Response} 500 Internal Server Error - For any other server-side errors.
 */
export async function GET({ locals, params }: APIContext): Promise<Response> {
  const { supabase } = locals;
  const cardId = params.id;

  const validationResult = CardIdSchema.safeParse(cardId);
  if (!validationResult.success) {
    return new Response(JSON.stringify({ error: "Invalid card ID format. Must be a UUID." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const card = await getCardById(supabase, validationResult.data);

    if (!card) {
      return new Response(JSON.stringify({ error: "Card not found or you do not have permission to view it." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(card), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
