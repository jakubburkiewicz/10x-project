# API Endpoint Implementation Plan: `POST /api/study-session/review`

## 1. Przegląd punktu końcowego
Ten punkt końcowy jest kluczowym elementem mechanizmu nauki, umożliwiającym aktualizację metadanych karty w oparciu o algorytm Spaced Repetition System (SRS). Po każdej ocenie karty przez użytkownika, endpoint ten oblicza nowy interwał powtórki, współczynnik łatwości oraz datę następnej sesji dla danej karty, optymalizując proces zapamiętywania.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/study-session/review`
- **Parametry**: Brak parametrów URL.
- **Request Body**: Wymagany jest obiekt JSON o następującej strukturze:
  ```json
  {
    "cardId": "string (uuid)",
    "quality": "number (integer, 0-5)"
  }
  ```

## 3. Wykorzystywane typy
- **Command Model**: `ReviewCardCommand` (walidowany przez `ReviewCardCommandSchema` z biblioteki Zod) do obsługi danych wejściowych.
- **DTO**: `ReviewCardResponseDto` do strukturyzacji danych w odpowiedzi API.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "message": "Card review status updated.",
    "updatedCard": {
      "id": "c3a4b1d2-...",
      "interval": 6,
      "repetition": 1,
      "ease_factor": 2.6,
      "due_date": "2025-10-18T15:30:00Z"
    }
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Karta nie została znaleziona.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na `/api/study-session/review` z `cardId` i `quality` w ciele żądania.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT i udostępnia sesję użytkownika oraz klienta Supabase w `context.locals`.
3.  Handler API w `src/pages/api/study-session/review.ts` parsuje i waliduje ciało żądania przy użyciu `ReviewCardCommandSchema`.
4.  Handler wywołuje funkcję `reviewCard` z nowo utworzonego serwisu `StudySessionService` (`src/lib/services/study-session.service.ts`), przekazując `cardId`, `quality`, ID użytkownika oraz instancję klienta Supabase.
5.  `StudySessionService`:
    a. Pobiera kartę z bazy danych, używając `cardId` i `userId`, aby upewnić się, że użytkownik jest jej właścicielem.
    b. Jeśli karta nie zostanie znaleziona, zwraca błąd.
    c. Implementuje logikę algorytmu SRS (bazującą na SM-2) do obliczenia nowych wartości: `repetition`, `ease_factor`, `interval` i `due_date`.
    d. Aktualizuje rekord karty w bazie danych z nowymi wartościami.
    e. Zwraca zaktualizowane dane karty do handlera API.
6.  Handler API formatuje odpowiedź, używając `ReviewCardResponseDto`, i wysyła ją do klienta z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony przez middleware, które weryfikuje token JWT (Supabase Auth). Żądania bez ważnego tokenu zostaną odrzucone z kodem `401 Unauthorized`.
- **Autoryzacja**: Logika biznesowa w serwisie musi weryfikować, czy `user_id` pobranej karty jest zgodny z ID uwierzytelnionego użytkownika. Dodatkowo, polityki RLS w bazie danych Supabase zapewnią, że użytkownik może modyfikować tylko własne dane.
- **Walidacja danych**: Wszystkie dane wejściowe są ściśle walidowane za pomocą `ReviewCardCommandSchema` (Zod), aby zapobiec błędom przetwarzania i potencjalnym atakom (np. przez podanie nieprawidłowych typów danych lub wartości spoza zakresu).

## 7. Obsługa błędów
| Kod statusu | Opis błędu                                                                                             | Sposób obsługi                                                                                                                            |
|-------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `400`       | Nieprawidłowe ciało żądania (brak `cardId`/`quality` lub `quality` poza zakresem 0-5).                   | Handler API zwraca odpowiedź z listą błędów walidacji Zod.                                                                                  |
| `401`       | Brak lub nieprawidłowy token `Authorization`.                                                          | Middleware Astro automatycznie blokuje żądanie.                                                                                           |
| `404`       | Karta o podanym `cardId` nie istnieje lub nie należy do uwierzytelnionego użytkownika.                   | Serwis `StudySessionService` zwraca błąd, który handler API przekształca na odpowiedź `404 Not Found`.                                     |
| `500`       | Błąd podczas komunikacji z bazą danych, nieoczekiwany wyjątek w logice algorytmu SRS lub inny błąd serwera. | Handler API przechwytuje wyjątek, loguje go po stronie serwera i zwraca generyczną odpowiedź `500 Internal Server Error`.                  |

## 8. Rozważania dotyczące wydajności
- Operacje na bazie danych ograniczają się do jednego odczytu (`SELECT`) i jednej aktualizacji (`UPDATE`), co powinno być wysoce wydajne przy prawidłowym indeksowaniu klucza głównego (`id`) i obcego (`user_id`).
- Logika algorytmu SRS jest wykonywana w pamięci i nie powinna stanowić wąskiego gardła.
- Należy unikać zbędnych zapytań do bazy danych; wszystkie potrzebne dane karty powinny być pobierane w jednym zapytaniu.

## 9. Etapy wdrożenia
1.  **Utworzenie pliku serwisu**: Stwórz nowy plik `src/lib/services/study-session.service.ts`.
2.  **Implementacja logiki SRS**: W `study-session.service.ts` zaimplementuj funkcję `reviewCard`, która będzie zawierać:
    - Pobieranie karty z bazy danych.
    - Weryfikację właściciela karty.
    - Implementację uproszczonego algorytmu SM-2 do obliczania nowych parametrów SRS.
    - Aktualizację karty w bazie danych.
3.  **Utworzenie pliku API route**: Stwórz nowy plik `src/pages/api/study-session/review.ts`.
4.  **Implementacja handlera API**: W `review.ts` zaimplementuj handler `POST`, który:
    - Pobiera sesję użytkownika z `context.locals`.
    - Waliduje ciało żądania za pomocą `ReviewCardCommandSchema`.
    - Wywołuje serwis `reviewCard`.
    - Obsługuje błędy i zwraca odpowiednie kody statusu.
    - Formatuje i zwraca pomyślną odpowiedź.
5.  **Testowanie**:
    - Napisz testy jednostkowe dla serwisu `StudySessionService`, sprawdzając poprawność obliczeń SRS dla różnych wartości `quality`.
    - Przeprowadź testy integracyjne dla endpointu API, symulując różne scenariusze (sukces, błędy walidacji, brak autoryzacji, karta nieznaleziona).
