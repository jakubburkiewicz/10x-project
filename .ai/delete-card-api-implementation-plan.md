# API Endpoint Implementation Plan: DELETE /api/cards/{id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy jest odpowiedzialny za usuwanie istniejącej fiszki (`card`) z bazy danych na podstawie jej unikalnego identyfikatora (`id`). Operacja jest dostępna tylko dla uwierzytelnionych użytkowników i jest ograniczona do usuwania wyłącznie własnych fiszek.

## 2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/cards/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (w ścieżce URL): Unikalny identyfikator (UUID) fiszki do usunięcia.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
Implementacja nie wymaga tworzenia nowych typów DTO ani Command Models. Wykorzystany zostanie jedynie parametr `id` typu `string` z adresu URL.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu**:
  - **Kod stanu**: `204 No Content`
  - **Treść**: Brak. Odpowiedź nie zawiera ciała.
- **Odpowiedzi błędów**:
  - **Kod stanu**: `400 Bad Request` - gdy `id` nie jest poprawnym UUID.
  - **Kod stanu**: `401 Unauthorized` - gdy użytkownik nie jest uwierzytelniony.
  - **Kod stanu**: `404 Not Found` - gdy fiszka o podanym `id` nie istnieje lub nie należy do użytkownika.
  - **Kod stanu**: `500 Internal Server Error` - w przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `DELETE` na adres `/api/cards/{id}`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token sesji użytkownika i dołącza klienta Supabase (`supabase`) oraz dane sesji do `context.locals`.
3.  Handler API w `src/pages/api/cards/[id].ts` jest wywoływany.
4.  Handler sprawdza, czy użytkownik jest uwierzytelniony. Jeśli nie, zwraca `401 Unauthorized`.
5.  Handler waliduje format parametru `id` przy użyciu Zod, aby upewnić się, że jest to prawidłowy UUID. Jeśli nie, zwraca `400 Bad Request`.
6.  Handler wywołuje funkcję `deleteCard` z serwisu `cards.service.ts`, przekazując `id` i klienta `supabase`.
7.  Funkcja `deleteCard` wykonuje zapytanie `DELETE` do tabeli `cards` w bazie danych Supabase.
8.  Polityka Row Level Security (RLS) w PostgreSQL zapewnia, że operacja usunięcia powiedzie się tylko wtedy, gdy `user_id` fiszki pasuje do `id` uwierzytelnionego użytkownika.
9.  Jeśli zapytanie `DELETE` nie usunęło żadnego wiersza (ponieważ fiszka nie istnieje lub nie należy do użytkownika), serwis zwraca informację o niepowodzeniu. Handler API interpretuje to jako `404 Not Found`.
10. Jeśli usunięcie się powiedzie, handler API zwraca odpowiedź `204 No Content`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony przez middleware, który sprawdza ważność sesji użytkownika. Każde żądanie bez ważnej sesji zostanie odrzucone z kodem `401 Unauthorized`.
- **Autoryzacja**: Autoryzacja jest wymuszana na poziomie bazy danych za pomocą polityki Row Level Security (RLS) w Supabase. Polityka `DELETE` na tabeli `cards` gwarantuje, że użytkownicy mogą usuwać tylko i wyłącznie swoje własne fiszki. To kluczowy mechanizm zapobiegający nieautoryzowanemu dostępowi do danych.
- **Walidacja danych wejściowych**: Parametr `id` jest walidowany, aby upewnić się, że jest to prawidłowy UUID. Chroni to bazę danych przed niepoprawnymi lub potencjalnie złośliwymi zapytaniami.

## 7. Obsługa błędów
- **Brak uwierzytelnienia**: Zwracany jest błąd `401 Unauthorized`.
- **Nieprawidłowe ID**: Zwracany jest błąd `400 Bad Request` z komunikatem o błędzie walidacji.
- **Zasób nieznaleziony**: Zwracany jest błąd `404 Not Found`. Dzieje się tak zarówno wtedy, gdy fiszka o danym `id` nie istnieje, jak i wtedy, gdy należy do innego użytkownika, aby zapobiec wyciekowi informacji.
- **Błędy serwera**: Wszelkie nieoczekiwane błędy (np. problemy z połączeniem z bazą danych) będą logowane na serwerze i zwracany będzie ogólny błąd `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności
- Operacja `DELETE` na kluczu głównym (`id`) z indeksem jest bardzo wydajna.
- Dodatkowy warunek `WHERE user_id = auth.uid()` nałożony przez RLS również operuje na indeksowanej kolumnie (`user_id`), co zapewnia wysoką wydajność zapytań.
- Nie przewiduje się żadnych wąskich gardeł wydajnościowych dla tego punktu końcowego.

## 9. Etapy wdrożenia
1.  **Utworzenie pliku API**: Stwórz nowy plik `src/pages/api/cards/[id].ts`.
2.  **Implementacja handlera `DELETE`**: W pliku `[id].ts` zaimplementuj funkcję `export async function DELETE({ params, locals }: APIContext)`.
3.  **Sprawdzenie uwierzytelnienia**: Na początku handlera dodaj logikę sprawdzającą, czy `locals.session` istnieje. Jeśli nie, zwróć `401 Unauthorized`.
4.  **Walidacja ID**: Zdefiniuj schemat Zod dla UUID (`z.string().uuid()`) i użyj go do walidacji `params.id`. W przypadku błędu zwróć `400 Bad Request`.
5.  **Utworzenie serwisu (jeśli nie istnieje)**:
    - Stwórz plik `src/lib/cards.service.ts`.
    - Dodaj funkcję `deleteCard(cardId: string, supabase: SupabaseClient)`.
6.  **Implementacja logiki usuwania**: W funkcji `deleteCard` zaimplementuj logikę usuwania fiszki za pomocą klienta Supabase:
    ```typescript
    const { error, count } = await supabase
      .from("cards")
      .delete({ count: "exact" })
      .eq("id", cardId);
    ```
7.  **Obsługa wyników w serwisie**:
    - Jeśli wystąpi `error`, zaloguj go i rzuć wyjątek lub zwróć obiekt błędu.
    - Jeśli `count` wynosi `0`, oznacza to, że fiszka nie została znaleziona (lub nie należała do użytkownika). Zwróć odpowiedni status.
8.  **Integracja handlera z serwisem**: W handlerze `DELETE` wywołaj `cardsService.deleteCard`, opakowując wywołanie w blok `try...catch` do obsługi błędów serwera.
9.  **Zwracanie odpowiedzi**:
    - Jeśli `deleteCard` zwróci status "not found", zwróć `404 Not Found`.
    - Jeśli `deleteCard` zakończy się sukcesem, zwróć `204 No Content`.
    - W bloku `catch` zwróć `500 Internal Server Error`.
10. **Testowanie**: Przygotuj testy manualne lub automatyczne weryfikujące wszystkie scenariusze: sukces, brak uwierzytelnienia, niepoprawne ID, próba usunięcia cudzej fiszki oraz brak fiszki.
