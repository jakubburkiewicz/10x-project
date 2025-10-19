import type { APIRoute } from "astro";
import { z } from "zod";
import { openRouterService } from "@/lib/openrouter.service";

// 1. Definicja schematu odpowiedzi za pomocą Zod
const quizSchema = z.object({
  topic: z.string().describe("The main topic of the quiz"),
  questions: z
    .array(
      z.object({
        questionText: z.string().describe("The text of the question"),
        answers: z.array(
          z.object({
            answerText: z.string(),
            isCorrect: z.boolean(),
          })
        ),
      })
    )
    .min(3)
    .describe("An array of at least 3 questions"),
});

// Definicja typu na podstawie schematu
type Quiz = z.infer<typeof quizSchema>;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "Topic is required and must be a string." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Definicja komunikatów systemowego i użytkownika
    const systemPrompt = `You are an expert quiz creator. Your task is to generate a quiz in JSON format based on the user's topic. The JSON must strictly adhere to the provided schema.`;
    const userPrompt = `Generate a quiz about: "${topic}".`;

    // 3. Wywołanie usługi z odpowiednimi parametrami
    const quiz: Quiz = await openRouterService.getJsonResponse({
      systemPrompt,
      userPrompt,
      modelName: "anthropic/claude-3.5-sonnet", // Nazwa modelu
      responseSchema: quizSchema, // Schemat Zod
      modelParams: { temperature: 0.5 }, // Opcjonalne parametry
    });

    // 4. Zwrócenie pomyślnej odpowiedzi
    return new Response(JSON.stringify(quiz), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // W prawdziwej aplikacji warto zalogować ten błąd do serwisu logującego
    return new Response(JSON.stringify({ error: "Failed to generate quiz." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
