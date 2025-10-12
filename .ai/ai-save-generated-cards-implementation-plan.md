# API Endpoint Implementation Plan: POST /api/ai/save-generated-cards

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest zapisanie w bazie danych fiszek wygenerowanych przez AI, które zostały zaakceptowane przez użytkownika. Dodatkowo, endpoint loguje metryki dotyczące tego zdarzenia, takie jak liczba wygenerowanych i zaakceptowanych fiszek, w celu późniejszej analizy. Operacja wymaga uwierzytelnienia użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/ai/save-generated-cards`
- **Parametry**: Brak parametrów query.
- **Request Body**: Ciało żądania musi być w formacie `application/json` i zgodne ze schematem `SaveGeneratedCardsCommandSchema`.
  ```json
  {
    "originalText": "string",
    "generatedCount": "number",
    "acceptedCards": [
      {
        "front": "string",
        "back": "string"
      }
    ]
  }
  ```
  - **Wymagane**: `originalText`, `generatedCount`, `acceptedCards`.

## 3. Wykorzystywane typy
- **Command Model**: `SaveGeneratedCardsCommand` (z `src/types.ts`) - definiuje strukturę danych wejściowych.
- **Validation Schema**: `SaveGeneratedCardsCommandSchema` (z `src/types.ts`) - schemat Zod do walidacji ciała żądania.
- **Response DTO**: `SaveGeneratedCardsResponseDto` (z `src/types.ts`) - definiuje strukturę odpowiedzi.
- **Data DTO**: `CardDto` (z `src/types.ts`) - definiuje strukturę pojedynczej zapisanej fiszki w odpowiedzi.

## 4. Szczegóły odpowiedzi
- **Struktura odpowiedzi sukcesu (201 Created)**:
  ```json
  {
    "message": "Successfully saved X cards.",
    "savedCards": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "source": "ai",
        "created_at": "timestamptz",
        "updated_at": "timestamptz",
        "due_date": "timestamptz"
      }
    ]
  }
  ```
- **Kody statusu**:
  - `201 Created`: Operacja zakończona pomyślnie.
  - `400 Bad Request`: Nieprawidłowe ciało żądania.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `500 Internal Server Error`: Wystąpił błąd po stronie serwera.

## 5. Przepływ danych
1. Klient wysyła żądanie `POST` na adres `/api/ai/save-generated-cards` z danymi w ciele żądania.
2. Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje sesję użytkownika i udostępnia instancję klienta Supabase oraz dane użytkownika w `context.locals`.
3. Handler API (`src/pages/api/ai/save-generated-cards.ts`) odbiera żądanie.
4. Handler używa `SaveGeneratedCardsCommandSchema` do walidacji ciała żądania. W przypadku błędu zwraca `400 Bad Request`.
5. Handler wywołuje metodę z serwisu `AiService` (np. `saveGeneratedCards`), przekazując zweryfikowane dane oraz `userId` i klienta `supabase` z `context.locals`.
6. `AiService` wykonuje transakcję bazodanową:
   a. Zapisuje zaakceptowane fiszki (`acceptedCards`) do tabeli `cards`, ustawiając `source` na `'ai'` i przypisując `user_id`.
   b. Zapisuje pojedynczy wpis w tabeli `ai_generations` z `user_id`, `input_text` (`originalText`), `generated_count` i `accepted_count` (długość tablicy `acceptedCards`).
7. Jeśli transakcja się powiedzie, serwis zwraca zapisane fiszki do handlera.
8. Handler formatuje odpowiedź zgodnie z `SaveGeneratedCardsResponseDto` i wysyła ją do klienta ze statusem `201 Created`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu musi być chroniony. Middleware Astro musi weryfikować token JWT Supabase i odrzucać żądania od niezalogowanych użytkowników, zwracając status `401 Unauthorized`.
- **Autoryzacja**: Każda zapisywana fiszka i log generowania musi być powiązany z `user_id` zalogowanego użytkownika. Należy upewnić się, że RLS (Row Level Security) w Supabase jest poprawnie skonfigurowane, aby użytkownik mógł zapisywać dane tylko w swoim imieniu.
- **Walidacja danych**: Ścisła walidacja za pomocą Zod (`SaveGeneratedCardsCommandSchema`) zapobiega atakom typu Mass Assignment oraz zapewnia integralność danych. Pola takie jak `front` i `back` powinny mieć ograniczenia długości w schemacie, aby uniknąć przepełnienia bazy danych.

## 7. Obsługa błędów
- **400 Bad Request**: Zwracany, gdy walidacja Zod nie powiedzie się. Odpowiedź powinna zawierać szczegóły błędu walidacji.
- **401 Unauthorized**: Zwracany przez middleware, jeśli brak jest ważnej sesji użytkownika.
- **500 Internal Server Error**: Zwracany w przypadku niepowodzenia operacji bazodanowych (zapisu fiszek lub logu). Błąd powinien być zalogowany po stronie serwera (`console.error`) w celu ułatwienia diagnostyki. Klient otrzyma ogólny komunikat o błędzie.

## 8. Rozważania dotyczące wydajności
- **Transakcje bazodanowe**: Zapis fiszek i logu generowania powinien odbywać się w ramach jednej transakcji, aby zapewnić spójność danych. Supabase RPC może być użyte do opakowania wielu operacji w jedną funkcję PostgreSQL.
- **Operacje hurtowe**: Zapis wielu fiszek powinien być wykonany za pomocą jednej operacji `insert` na tablicy obiektów, co jest znacznie wydajniejsze niż wielokrotne pojedyncze zapytania.

## 9. Etapy wdrożenia
1. **Aktualizacja schematu bazy danych**:
   - Upewnij się, że tabela `ai_generations` istnieje w bazie danych i jej schemat jest zgodny z podanym w specyfikacji. Jeśli nie, utwórz nową migrację Supabase.
   - Zaktualizuj typy TypeScript w `src/db/database.types.ts` za pomocą komendy `npx supabase gen types typescript > src/db/database.types.ts`.

2. **Utworzenie serwisu**:
   - Stwórz plik `src/lib/services/ai.service.ts`.
   - Zaimplementuj w nim funkcję `saveGeneratedCards(command: SaveGeneratedCardsCommand, userId: string, supabase: SupabaseClient)`, która będzie zawierać logikę biznesową (transakcyjny zapis fiszek i logu).

3. **Implementacja handlera API**:
   - Stwórz plik `src/pages/api/ai/save-generated-cards.ts`.
   - Zaimplementuj handler dla metody `POST`.
   - Dodaj `export const prerender = false;` na początku pliku.
   - Pobierz dane użytkownika i klienta Supabase z `context.locals`. Sprawdź, czy użytkownik jest zalogowany.
   - Zwaliduj ciało żądania za pomocą `SaveGeneratedCardsCommandSchema.safeParse()`.
   - Wywołaj metodę z `AiService`, przekazując jej niezbędne dane.
   - Obsłuż błędy i zwróć odpowiednie kody statusu (`201, 400, 500`).
   - Sformatuj i zwróć pomyślną odpowiedź.

4. **Testowanie**:
   - Napisz testy jednostkowe dla serwisu `AiService`, mockując klienta Supabase.
   - Przeprowadź testy integracyjne endpointu API, używając narzędzia do testowania API (np. Postman), aby zweryfikować:
     - Poprawne działanie dla prawidłowych danych.
     - Obsługę błędów walidacji (400).
     - Ochronę endpointu (401).
     - Sprawdzenie, czy dane zostały poprawnie zapisane w tabelach `cards` i `ai_generations`.
