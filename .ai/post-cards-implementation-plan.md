# API Endpoint Implementation Plan: POST /api/cards

## 1. Przegląd punktu końcowego
Ten punkt końcowy jest odpowiedzialny za tworzenie nowej fiszki (flashcard) dla uwierzytelnionego użytkownika. Przyjmuje dane fiszki w ciele żądania, waliduje je, a następnie zapisuje w bazie danych. W przypadku sukcesu zwraca nowo utworzony obiekt fiszki.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/cards`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: Brak
- **Request Body**: Wymagany jest obiekt JSON o następującej strukturze:
  ```json
  {
    "front": "string",
    "back": "string",
    "source": "string"
  }
  ```

## 3. Wykorzystywane typy
- **Command Model**: `CreateCardCommand` (`src/types.ts`) - Definiuje kształt danych wejściowych dla tworzenia fiszki.
- **DTO (Data Transfer Object)**: `CardDto` (`src/types.ts`) - Określa strukturę danych fiszki zwracanych przez API, zapewniając spójność i ukrycie pól wewnętrznych.
- **Schemat Walidacji**: `CreateCardSchema` (do zdefiniowania w `src/pages/api/cards.ts`) - Schemat `zod` do walidacji ciała żądania.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (`201 Created`)**: Zwraca obiekt JSON reprezentujący nowo utworzoną fiszkę, zgodny z `CardDto`.
  ```json
  {
    "id": "d4e5f6a1-...",
    "front": "What is the capital of Poland?",
    "back": "Warsaw",
    "source": "manual",
    "due_date": "2025-10-12T14:00:00Z",
    "created_at": "2025-10-12T14:00:00Z",
    "updated_at": "2025-10-12T14:00:00Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe ciało żądania.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wystąpił błąd po stronie serwera (np. błąd bazy danych).

## 5. Przepływ danych
1. Klient wysyła żądanie `POST` na adres `/api/cards` z danymi fiszki w ciele.
2. Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje sesję użytkownika i udostępnia instancję klienta Supabase oraz dane sesji w `context.locals`.
3. Handler `POST` w `src/pages/api/cards.ts` jest wywoływany.
4. Handler sprawdza, czy sesja użytkownika istnieje. Jeśli nie, zwraca `401 Unauthorized`.
5. Ciało żądania jest walidowane przy użyciu schematu `CreateCardSchema` (zod). W przypadku błędu walidacji zwracany jest `400 Bad Request`.
6. Handler wywołuje funkcję `createCard` z serwisu `CardService`, przekazując zweryfikowane dane oraz `user_id` z sesji.
7. `CardService` wykonuje operację wstawienia nowego rekordu do tabeli `cards` w bazie danych Supabase.
8. Po pomyślnym zapisie, `CardService` zwraca pełny obiekt nowej fiszki.
9. Handler API formatuje zwrócony obiekt do postaci `CardDto` i wysyła go do klienta z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest ograniczony tylko do uwierzytelnionych użytkowników. Middleware i handler API muszą rygorystycznie sprawdzać istnienie aktywnej sesji.
- **Autoryzacja**: Każda nowa fiszka jest jednoznacznie powiązana z `user_id` uwierzytelnionego użytkownika, co zapobiega dostępowi do danych innych użytkowników.
- **Walidacja danych wejściowych**: Użycie `zod` do walidacji długości i typu pól `front` i `back` chroni przed przepełnieniem bufora i zapewnia integralność danych.
- **Ochrona przed SQL Injection**: Użycie klienta Supabase zapewnia parametryzację zapytań, co eliminuje ryzyko wstrzyknięcia SQL.

## 7. Rozważania dotyczące wydajności
- Operacja `INSERT` na tabeli `cards` jest zazwyczaj bardzo szybka.
- Potencjalnym wąskim gardłem może być czas odpowiedzi od Supabase, zwłaszcza przy dużym obciążeniu. Należy monitorować wydajność zapytań.
- Indeks na kolumnie `user_id` jest kluczowy dla wydajności przyszłych zapytań odczytujących dane.

## 8. Etapy wdrożenia
1. **Utworzenie pliku serwisu**: Stwórz plik `src/lib/card.service.ts`.
2. **Implementacja logiki serwisu**: W `card.service.ts` zaimplementuj funkcję `createCard(supabase, userId, cardData)`, która będzie odpowiedzialna za dodanie nowej fiszki do bazy danych i zwrócenie utworzonego obiektu.
3. **Utworzenie pliku API route**: Stwórz plik `src/pages/api/cards.ts`.
4. **Implementacja handlera POST**: W `cards.ts` zaimplementuj handler `POST`.
5. **Dodanie walidacji Zod**: W handlerze `POST` zdefiniuj schemat `CreateCardSchema` i użyj go do walidacji przychodzącego ciała żądania.
6. **Integracja z serwisem**: W handlerze `POST` wywołaj funkcję `cardService.createCard` z odpowiednimi parametrami.
7. **Obsługa błędów i odpowiedzi**: Zaimplementuj pełną obsługę błędów (400, 401, 500) oraz pomyślnej odpowiedzi (201) zgodnie ze specyfikacją.
8. **Mapowanie do DTO**: Upewnij się, że odpowiedź jest mapowana do `CardDto`, aby ukryć zbędne pola przed klientem.
9. **Testowanie manualne**: Przetestuj endpoint za pomocą narzędzia do testowania API (np. Postman, Insomnia lub wbudowane w VS Code), sprawdzając wszystkie scenariusze (sukces, błędy walidacji, brak uwierzytelnienia).
10. **Dokumentacja**: Upewnij się, że kod jest dobrze skomentowany, a wszelkie decyzje projektowe są udokumentowane.
