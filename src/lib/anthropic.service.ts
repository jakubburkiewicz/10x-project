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

export class AnthropicService {
  private readonly apiKey: string;
  private readonly anthropicApiUrl = "https://api.anthropic.com/v1/messages";
  private readonly anthropicVersion = "2023-06-01";

  constructor() {
    const apiKey = import.meta.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not defined in environment variables.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Buduje ciało żądania dla API Anthropic.
   */
  private buildRequestBody<T extends z.ZodType>(params: GetJsonResponseParams<T>): object {
    const jsonSchema = zodToJsonSchema(params.responseSchema, {
      name: "json_output",
      target: "jsonSchema7",
    });

    const completeSchema = {
      ...jsonSchema,
      type: "object",
    };

    return {
      model: params.modelName,
      system: params.systemPrompt,
      max_tokens: 4096,
      messages: [{ role: "user", content: params.userPrompt }],
      tools: [
        {
          name: "json_output",
          description: "A tool to output a JSON object matching the requested schema.",
          input_schema: completeSchema,
        },
      ],
      tool_choice: {
        type: "tool",
        name: "json_output",
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

      const response = await fetch(this.anthropicApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": this.anthropicVersion,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const toolCall = data.content?.find((item: { type: string }) => item.type === "tool_use");

      if (!toolCall || !toolCall.input) {
        throw new Error("Invalid response structure from Anthropic API.");
      }

      // Walidacja odpowiedzi za pomocą schematu Zod
      return params.responseSchema.parse(toolCall.input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Response validation failed: ${error.message}`);
      }
      throw error;
    }
  }
}
