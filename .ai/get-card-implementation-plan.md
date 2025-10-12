# API Endpoint Implementation Plan: GET /api/cards/{id}

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest umożliwienie uwierzytelnionemu użytkownikowi pobrania pojedynczej, należącej do niego fiszki na podstawie jej unikalnego identyfikatora (ID). Endpoint zapewni bezpieczny dostęp do danych, weryfikując własność zasobu.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/cards/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Unikalny identyfikator fiszki w formacie UUID.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **`CardDto`**: Obiekt transferu danych (DTO) używany w odpowiedzi. Zawiera publicznie dostępne pola fiszki.
  ```typescript
  // src/types.ts
  export type CardDto = Pick<Card, "id" | "front" | "back" | "source" | "due_date" | "created_at" | "updated_at">;
  ```
- **`z.string().uuid()`**: Schemat walidacji Zod do sprawdzenia, czy parametr `id` jest poprawnym identyfikatorem UUID.

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK)**: Zwraca obiekt JSON zawierający dane fiszki zgodnie z typem `CardDto`.
  ```json
  {
    "id": "c3a4b1d2-...",
    "front": "What is Astro?",
    "back": "A web framework...",
    "source": "manual",
    "due_date": "2025-10-20T10:00:00Z",
    "created_at": "2025-10-12T12:00:00Z",
    "updated_at": "2025-10-12T12:00:00Z"
  }
  ```
- **Błędy**:
  - **400 Bad Request**: Nieprawidłowy format `id`.
  - **401 Unauthorized**: Użytkownik nie jest uwierzytelniony.
  - **404 Not Found**: Fiszka o podanym `id` nie istnieje lub nie należy do użytkownika.
  - **500 Internal Server Error**: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1. Żądanie `GET` trafia do dynamicznej trasy Astro `src/pages/api/cards/[id].ts`.
2. Middleware (`src/middleware/index.ts`) weryfikuje token JWT i udostępnia sesję użytkownika oraz klienta Supabase w `context.locals`.
3. Handler `GET` weryfikuje, czy użytkownik jest zalogowany. Jeśli nie, zwraca `401`.
4. Handler waliduje parametr `id` z `context.params` przy użyciu Zod. Jeśli jest nieprawidłowy, zwraca `400`.
5. Handler wywołuje funkcję `getCardById(id, userId, supabase)` z serwisu `src/lib/card.service.ts`.
6. Funkcja `getCardById` wykonuje zapytanie do tabeli `cards` w Supabase, filtrując po `id` i `user_id`, aby zapobiec IDOR.
7. Jeśli zapytanie nie zwróci rekordu, serwis zwraca `null`. Handler API zwraca `404`.
8. Jeśli rekord zostanie znaleziony, serwis zwraca pełny obiekt `Card`.
9. Handler API mapuje obiekt `Card` na `CardDto`, aby ukryć wewnętrzne pola (np. `user_id`, `interval`).
10. Handler zwraca odpowiedź `200 OK` z obiektem `CardDto`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione za pomocą tokenu JWT (Bearer Token), który jest weryfikowany przez middleware Supabase.
- **Autoryzacja**: Logika biznesowa w serwisie `card.service.ts` musi zapewnić, że użytkownik może pobrać tylko własne fiszki. Zapytanie SQL musi zawierać klauzulę `WHERE user_id = <current_user_id>`.
- **Walidacja danych wejściowych**: Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom zapytań do bazy danych i potencjalnym atakom.

## 7. Obsługa błędów
- **Brak sesji użytkownika**: Zwróć `401 Unauthorized` z komunikatem `{"error": "Unauthorized"}`.
- **Nieprawidłowe ID**: Zwróć `400 Bad Request` z komunikatem `{"error": "Invalid card ID format"}`.
- **Nie znaleziono fiszki**: Zwróć `404 Not Found` z komunikatem `{"error": "Card not found"}`.
- **Błąd bazy danych**: Złap błędy z klienta Supabase, zaloguj je po stronie serwera i zwróć `500 Internal Server Error` z komunikatem `{"error": "Internal Server Error"}`.

## 8. Rozważania dotyczące wydajności
- Zapytanie do bazy danych jest proste i wykorzystuje klucz główny (`id`) oraz indeksowany klucz obcy (`user_id`), co zapewnia wysoką wydajność.
- Nie przewiduje się wąskich gardeł wydajnościowych dla tego punktu końcowego.

## 9. Etapy wdrożenia
1. **Utworzenie pliku serwisu**: Stwórz plik `src/lib/card.service.ts`, jeśli nie istnieje.
2. **Implementacja logiki serwisu**:
   - W `src/lib/card.service.ts` dodaj funkcję `getCardById(cardId: string, userId: string, supabase: SupabaseClient): Promise<Card | null>`.
   - Wewnątrz funkcji zaimplementuj zapytanie do Supabase: `supabase.from('cards').select().eq('id', cardId).eq('user_id', userId).single()`.
   - Obsłuż błędy zapytania i zwróć dane lub `null`.
3. **Utworzenie pliku endpointu**: Stwórz plik `src/pages/api/cards/[id].ts`.
4. **Implementacja handlera GET**:
   - W `[id].ts` wyeksportuj asynchroniczną funkcję `GET({ params, locals }: APIContext)`.
   - Pobierz sesję i klienta Supabase z `locals`. Sprawdź uwierzytelnienie.
   - Zwaliduj `params.id` przy użyciu `z.string().uuid()`.
   - Wywołaj `cardService.getCardById(...)` z odpowiednimi parametrami.
   - Obsłuż przypadki, gdy fiszka nie zostanie znaleziona (zwróć 404).
   - Zmapuj wynikowy obiekt `Card` na `CardDto`.
   - Zwróć odpowiedź JSON z kodem `200 OK` i zmapowanym obiektem.
   - Zaimplementuj obsługę błędów (try-catch) dla całego procesu.
5. **Dodanie `export const prerender = false`**: W pliku `[id].ts` dodaj `export const prerender = false;`, aby zapewnić dynamiczne renderowanie po stronie serwera.
6. **Testowanie**: Napisz testy (jeśli dotyczy) lub wykonaj ręczne testy, aby zweryfikować wszystkie scenariusze: sukces, brak autoryzacji, nieprawidłowe ID, nieznaleziony zasób.
