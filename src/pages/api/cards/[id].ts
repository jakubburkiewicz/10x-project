import type { APIContext } from "astro";
import { z } from "zod";
import { CardNotFoundError, getCardById, updateCard } from "@/lib/cards.service";

const CardIdSchema = z.string().uuid();
const UpdateCardBodySchema = z
  .object({
    front: z.string().max(200).optional(),
    back: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.front !== undefined || data.back !== undefined,
    "At least one of the fields (front, back) must be provided"
  );

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

/**
 * PATCH /api/cards/{id}
 *
 * Updates an existing card.
 * - Requires authentication.
 * - The user can only update their own cards (enforced by RLS).
 *
 * Path Parameters:
 * @param {string} id - The UUID of the card to update.
 *
 * Request Body:
 * @param {object} card - The card data to update.
 * @param {string} [card.front] - The front text of the card (optional).
 * @param {string} [card.back] - The back text of the card (optional).
 *
 * Responses:
 * @returns {Response} 200 OK - The updated card data as a JSON object.
 * @returns {Response} 400 Bad Request - If the provided ID is not a valid UUID or the request body is invalid.
 * @returns {Response} 404 Not Found - If the card does not exist or the user does not have access.
 * @returns {Response} 401 Unauthorized - If the user is not authenticated.
 * @returns {Response} 500 Internal Server Error - For any other server-side errors.
 */
export async function PATCH({ params, request, locals }: APIContext): Promise<Response> {
  try {
    const { user, supabase } = locals;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cardId = params.id;
    const idValidation = CardIdSchema.safeParse(cardId);

    if (!idValidation.success) {
      return new Response(JSON.stringify({ error: "Invalid card ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const bodyValidation = UpdateCardBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      return new Response(JSON.stringify({ error: bodyValidation.error.flatten() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedCard = await updateCard(idValidation.data, bodyValidation.data, supabase);

    return new Response(JSON.stringify(updatedCard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof CardNotFoundError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Error in PATCH /api/cards/[id]:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
