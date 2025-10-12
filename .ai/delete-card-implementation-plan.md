# API Endpoint Implementation Plan: DELETE /api/cards/{id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom trwałe usunięcie jednej ze swoich fiszek na podstawie jej unikalnego identyfikatora (ID). Operacja jest idempotentna. Pomyślne usunięcie nie zwraca treści, a jedynie potwierdzenie w postaci kodu statusu HTTP.

## 2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/cards/[id]`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Identyfikator UUID fiszki do usunięcia.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
Operacja nie wymaga dedykowanych typów DTO ani Command Models. Wykorzystany zostanie jedynie typ `string` dla parametru `id` z walidacją formatu UUID.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu**:
  - **Kod**: `204 No Content`
  - **Body**: Puste.
- **Odpowiedzi błędów**:
  - **Kod**: `400 Bad Request` (dla nieprawidłowego UUID)
  - **Kod**: `401 Unauthorized` (gdy użytkownik nie jest zalogowany)
  - **Kod**: `404 Not Found` (gdy fiszka nie istnieje lub nie należy do użytkownika)
  - **Kod**: `500 Internal Server Error` (dla błędów serwera)

## 5. Przepływ danych
1.  Klient wysyła żądanie `DELETE` na adres `/api/cards/{id}` z tokenem JWT w nagłówku `Authorization`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT i udostępnia sesję Supabase w `context.locals`. Jeśli token jest nieprawidłowy, zwraca `401 Unauthorized`.
3.  Handler endpointu w `src/pages/api/cards/[id].ts` otrzymuje żądanie.
4.  Handler waliduje parametr `id` przy użyciu `zod`, sprawdzając, czy jest to prawidłowy UUID. W przypadku błędu zwraca `400 Bad Request`.
5.  Handler wywołuje metodę `deleteCard(userId, cardId)` z serwisu `CardService` (`src/lib/services/card.service.ts`).
6.  `CardService` wykonuje zapytanie `DELETE` do tabeli `cards` w bazie danych Supabase, używając warunku `WHERE id = {cardId} AND user_id = {userId}`.
7.  Jeśli zapytanie nie usunęło żadnego wiersza (ponieważ fiszka nie istnieje lub nie należy do użytkownika), serwis zwraca informację o błędzie. Handler odpowiada kodem `404 Not Found`.
8.  Jeśli zapytanie zakończy się sukcesem, handler odpowiada kodem `204 No Content`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione za pomocą tokenu JWT Bearer, co jest obsługiwane przez middleware.
- **Autoryzacja**: Kluczowym mechanizmem autoryzacji jest filtrowanie operacji `DELETE` po `user_id` pobranym z sesji. Zapobiega to możliwości usunięcia zasobów innego użytkownika. Zapytanie do bazy danych musi bezwzględnie zawierać klauzulę `AND user_id = :userId`.
- **Walidacja danych wejściowych**: Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom zapytań SQL i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK parametryzuje zapytania).

## 7. Rozważania dotyczące wydajności
Operacja `DELETE` na kluczu głównym (`id`) z dodatkowym warunkiem na indeksowanym kluczu obcym (`user_id`) jest wysoce wydajna w PostgreSQL. Nie przewiduje się wąskich gardeł wydajnościowych dla tego punktu końcowego przy normalnym użytkowaniu.

## 8. Etapy wdrożenia
1.  **Utworzenie pliku endpointu**: Stwórz plik `src/pages/api/cards/[id].ts`.
2.  **Implementacja handlera `DELETE`**: W pliku `[id].ts` wyeksportuj asynchroniczną funkcję `DELETE({ params, locals })`.
3.  **Pobranie sesji i walidacja**: Wewnątrz handlera, pobierz sesję użytkownika z `locals.supabase`. Sprawdź, czy użytkownik jest uwierzytelniony. Zwaliduj `params.id` przy użyciu `zod` (`z.string().uuid()`).
4.  **Stworzenie serwisu (jeśli nie istnieje)**: Utwórz plik `src/lib/services/card.service.ts`.
5.  **Implementacja metody w serwisie**: Dodaj w `CardService` metodę `deleteCard(supabase: SupabaseClient, userId: string, cardId: string)`. Metoda ta powinna:
    - Wykonać zapytanie `supabase.from('cards').delete().match({ id: cardId, user_id: userId })`.
    - Sprawdzić wynik operacji (np. `error` lub `count`) i zwrócić rezultat wskazujący na sukces lub porażkę (np. `404 Not Found`).
6.  **Integracja handlera z serwisem**: W handlerze `DELETE` wywołaj metodę `cardService.deleteCard(...)` i obsłuż jej wynik, zwracając odpowiednie kody statusu HTTP (`204`, `404`, `500`).
7.  **Obsługa błędów**: Zaimplementuj bloki `try...catch` do obsługi nieoczekiwanych błędów serwera i logowania ich do konsoli.
8.  **Testowanie manualne**: Po wdrożeniu, przetestuj endpoint za pomocą narzędzia API (np. Postman lub wbudowany klient w VS Code), sprawdzając wszystkie scenariusze (sukces, brak autoryzacji, zły UUID, nieistniejąca fiszka).
