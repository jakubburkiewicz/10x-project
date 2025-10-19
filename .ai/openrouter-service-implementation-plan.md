# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis usługi

`OpenRouterService` to klasa TypeScript zaprojektowana do hermetyzacji interakcji z API OpenRouter.ai. Jej celem jest uproszczenie procesu wysyłania zapytań do modeli językowych (LLM), obsługi odpowiedzi (w tym odpowiedzi o ustrukturyzowanej składni JSON) oraz zarządzania błędami i konfiguracją w sposób scentralizowany. Usługa będzie działać po stronie serwera w środowisku Astro/Node.js.

## 2. Opis konstruktora

Konstruktor klasy `OpenRouterService` inicjalizuje nową instancję usługi. Pobiera on klucz API OpenRouter ze zmiennych środowiskowych, zapewniając, że usługa jest gotowa do wysyłania uwierzytelnionych żądań.

```typescript
// src/lib/openrouter.service.ts

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly openRouterApiUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor() {
    // Używamy import.meta.env do pobierania zmiennych środowiskowych w Astro
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not defined in environment variables.");
    }
    this.apiKey = apiKey;
  }

  // ... reszta implementacji
}
```

## 3. Publiczne metody i pola

### `public async getJsonResponse<T extends object>(params: GetJsonResponseParams): Promise<T>`

Główna metoda publiczna usługi. Umożliwia wysłanie zapytania do modelu LLM i otrzymanie odpowiedzi w postaci obiektu JSON o zdefiniowanym schemacie.

- **Parametry:**
  - `systemPrompt` (string): Komunikat systemowy, który instruuje model co do jego roli i formatu odpowiedzi.
  - `userPrompt` (string): Konkretne zapytanie lub polecenie od użytkownika.
  - `modelName` (string): Nazwa modelu do użycia (np. `anthropic/claude-3.5-sonnet`).
  - `responseSchema` (object): Obiekt Zod definiujący schemat oczekiwanej odpowiedzi JSON.
  - `modelParams` (object, opcjonalne): Dodatkowe parametry modelu, takie jak `temperature` czy `max_tokens`.
- **Zwraca:** `Promise<T>`, gdzie `T` to typ wynikający ze schematu Zod, reprezentujący sparsowaną odpowiedź JSON od modelu.

## 4. Prywatne metody i pola

### `private readonly apiKey: string`

Przechowuje klucz API OpenRouter pobrany ze zmiennych środowiskowych. Pole jest tylko do odczytu.

### `private readonly openRouterApiUrl: string`

Przechowuje stały adres URL punktu końcowego API OpenRouter.

### `private buildRequestBody(params: GetJsonResponseParams): object`

Prywatna metoda pomocnicza do konstruowania ciała żądania (`body`) dla API OpenRouter na podstawie parametrów przekazanych do metody publicznej. Odpowiada za poprawne sformatowanie komunikatów oraz struktury `response_format`.

## 5. Obsługa błędów

Usługa implementuje kompleksową obsługę błędów, aby zapewnić stabilność i przewidywalność działania.

1.  **Błąd konfiguracji:** Konstruktor rzuca błąd (`Error`), jeśli zmienna środowiskowa `OPENROUTER_API_KEY` nie jest ustawiona, co uniemożliwia utworzenie instancji usługi bez klucza API.
2.  **Błędy sieciowe i API:** Metoda `getJsonResponse` jest opakowana w blok `try...catch`. W przypadku niepowodzenia żądania `fetch` (np. błąd sieci, błąd serwera 5xx), rzucany jest `Error` z odpowiednim komunikatem.
3.  **Błędy walidacji odpowiedzi:** Po otrzymaniu odpowiedzi od modelu, jej zawartość jest walidowana za pomocą dostarczonego schematu Zod. Jeśli odpowiedź nie pasuje do schematu, rzucany jest `ZodError`, co informuje o niezgodności struktury danych.
4.  **Błędy parsowania JSON:** Jeśli odpowiedź modelu nie jest poprawnym formatem JSON, `JSON.parse` rzuci błąd, który zostanie przechwycony i obsłużony.

## 6. Kwestie bezpieczeństwa

1.  **Zarządzanie kluczem API:** Klucz API jest przechowywany wyłącznie w zmiennych środowiskowych (`.env`) i nigdy nie jest eksponowany po stronie klienta ani umieszczany w kodzie źródłowym. Plik `.env` musi być dodany do `.gitignore`.
2.  **Walidacja danych wejściowych:** Chociaż usługa jest przeznaczona do użytku po stronie serwera, wszelkie dane pochodzące od użytkownika (np. `userPrompt`) powinny być odpowiednio oczyszczone i zwalidowane w warstwie wywołującej (np. w API route), aby zapobiec atakom typu prompt injection.
3.  **Ograniczenie dostępu:** Usługa powinna być wywoływana wyłącznie z zaufanego środowiska serwerowego (Astro API routes, middleware).

## 7. Plan wdrożenia krok po kroku

### Krok 1: Konfiguracja zmiennych środowiskowych

1.  Utwórz plik `.env` w głównym katalogu projektu (jeśli jeszcze nie istnieje).
2.  Dodaj do niego swój klucz API OpenRouter:

    ```env
    # .env
    OPENROUTER_API_KEY="sk-or-v1-..."
    ```

3.  Upewnij się, że plik `.env` jest dodany do `.gitignore`.

### Krok 2: Instalacja zależności

Zainstaluj bibliotekę `zod` do walidacji schematów oraz `zod-to-json-schema` do konwersji schematów Zod na format JSON Schema.

```bash
npm install zod zod-to-json-schema
```

### Krok 3: Utworzenie pliku usługi

Utwórz nowy plik `src/lib/openrouter.service.ts` i umieść w nim poniższy kod.

```typescript
// src/lib/openrouter.service.ts

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Definicja typów dla parametrów metody publicznej
export interface GetJsonResponseParams {
  systemPrompt: string;
  userPrompt: string;
  modelName: string;
  responseSchema: z.ZodType<any, any>;
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
  private buildRequestBody(params: GetJsonResponseParams): object {
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
  public async getJsonResponse<T extends object>(params: GetJsonResponseParams): Promise<T> {
    try {
      const body = this.buildRequestBody(params);

      const response = await fetch(this.openRouterApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
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
      return params.responseSchema.parse(parsedJson) as T;

    } catch (error) {
      console.error("Error in OpenRouterService:", error);
      if (error instanceof z.ZodError) {
        throw new Error(`Response validation failed: ${error.message}`);
      }
      throw error; // Rzuć dalej oryginalny błąd, jeśli nie jest to błąd Zod
    }
  }
}

// Eksport pojedynczej instancji (singleton) dla łatwego użycia w aplikacji
export const openRouterService = new OpenRouterService();
```

### Krok 4: Użycie usługi w API Route

Poniższy przykład pokazuje, jak użyć `openRouterService` wewnątrz Astro API route (`src/pages/api/generate.ts`) do wygenerowania quizu na podstawie tematu podanego przez użytkownika.

1.  Utwórz plik `src/pages/api/generate.ts`.
2.  Dodaj poniższy kod:

```typescript
// src/pages/api/generate.ts

import type { APIRoute } from "astro";
import { z } from "zod";
import { openRouterService } from "@/lib/openrouter.service";

// 1. Definicja schematu odpowiedzi za pomocą Zod
const quizSchema = z.object({
  topic: z.string().describe("The main topic of the quiz"),
  questions: z.array(
    z.object({
      questionText: z.string().describe("The text of the question"),
      answers: z.array(
        z.object({
          answerText: z.string(),
          isCorrect: z.boolean(),
        })
      ),
    })
  ).min(3).describe("An array of at least 3 questions"),
});

// Definicja typu na podstawie schematu
type Quiz = z.infer<typeof quizSchema>;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const topic = body.topic;

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "Topic is required and must be a string." }),
        { status: 400 }
      );
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
    console.error("[API Generate Error]", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate quiz." }),
      { status: 500 }
    );
  }
};
```

Ten przewodnik dostarcza kompletny plan wdrożenia, od konfiguracji po praktyczne użycie, zapewniając solidne i bezpieczne fundamenty dla interakcji z API OpenRouter w Twoim projekcie.
