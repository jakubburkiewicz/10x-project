// src/lib/openrouter.service.ts

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Definicja typów dla parametrów metody publicznej
export interface GetJsonResponseParams<T extends z.ZodType> {
  systemPrompt: string;
  userPrompt: string;
  modelName: string;
  responseSchema: T;
  modelParams?: Record<string, unknown>;
}

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly openRouterApiUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor() {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not defined in environment variables.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Buduje ciało żądania dla API OpenRouter.
   */
  private buildRequestBody<T extends z.ZodType>(params: GetJsonResponseParams<T>): object {
    const jsonSchema = zodToJsonSchema(params.responseSchema, {
      name: "response_schema",
      target: "jsonSchema7",
    });

    return {
      model: params.modelName,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      response_format: {
        type: "json_object",
        schema: jsonSchema,
      },
      ...params.modelParams,
    };
  }

  /**
   * Wysyła zapytanie do modelu i zwraca odpowiedź w formacie JSON zgodnym ze schematem.
   */
  public async getJsonResponse<T extends z.ZodType>(params: GetJsonResponseParams<T>): Promise<z.infer<T>> {
    try {
      const body = this.buildRequestBody(params);

      const response = await fetch(this.openRouterApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const messageContent = data.choices[0]?.message?.content;

      if (!messageContent) {
        throw new Error("Invalid response structure from OpenRouter API.");
      }

      // Parsowanie i walidacja odpowiedzi za pomocą schematu Zod
      const parsedJson = JSON.parse(messageContent);
      return params.responseSchema.parse(parsedJson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Response validation failed: ${error.message}`);
      }
      throw error; // Rzuć dalej oryginalny błąd, jeśli nie jest to błąd Zod
    }
  }
}

// Eksport pojedynczej instancji (singleton) dla łatwego użycia w aplikacji
export const openRouterService = new OpenRouterService();
