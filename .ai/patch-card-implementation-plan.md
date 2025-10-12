
# API Endpoint Implementation Plan: PATCH /api/cards/{id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom aktualizację istniejącej fiszki (`card`) na podstawie jej unikalnego identyfikatora (`id`). Aktualizacja obejmuje częściową modyfikację treści przodu (`front`) i/lub tyłu (`back`) fiszki.

## 2. Szczegóły żądania
- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/cards/[id]`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): UUID fiszki do zaktualizowania.
  - **Opcjonalne**: Brak.
- **Request Body**:
  - **Typ zawartości**: `application/json`
  - **Struktura**: Obiekt JSON zawierający co najmniej jedno z poniższych pól.
    ```json
    {
      "front": "Nowa treść przodu fiszki",
      "back": "Nowa treść tyłu fiszki"
    }
    ```

## 3. Wykorzystywane typy
- **Command Model (Request)**: `UpdateCardCommand` (`src/types.ts`)
- **DTO (Response)**: `CardDto` (`src/types.ts`)

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu**:
  - **Kod stanu**: `200 OK`
  - **Ciało odpowiedzi**: Zaktualizowany obiekt fiszki w formacie `CardDto`.
    ```json
    {
      "id": "c3a4b1d2-...",
      "front": "Nowa treść przodu fiszki",
      "back": "Nowa treść tyłu fiszki",
      "source": "manual",
      "due_date": "2025-10-20T10:00:00Z",
      "created_at": "2025-10-12T12:00:00Z",
      "updated_at": "2025-10-13T09:30:00Z"
    }
    ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (np. błędny format UUID, błędy walidacji ciała żądania).
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony (obsługiwane przez middleware).
  - `404 Not Found`: Fiszka o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
  - `500 Internal Server Error`: Wystąpił błąd po stronie serwera, np. problem z połączeniem z bazą danych.

## 5. Przepływ danych
1. Żądanie `PATCH` trafia do endpointu Astro `/api/cards/[id].ts`.
2. Middleware (`src/middleware/index.ts`) weryfikuje token JWT, uwierzytelnia użytkownika i udostępnia sesję w `context.locals`. Jeśli uwierzytelnienie się nie powiedzie, zwraca `401`.
3. Endpoint pobiera `id` z parametrów ścieżki (`context.params.id`) oraz ciało żądania.
4. Dane wejściowe są walidowane: `id` musi być poprawnym UUID, a ciało żądania musi być zgodne ze schematem Zod dla `UpdateCardCommand`. W przypadku błędu zwracany jest status `400`.
5. Wywoływana jest funkcja `updateCard` z serwisu `card.service.ts`, przekazując `userId` (z sesji), `cardId` oraz zwalidowane dane.
6. Serwis `card.service.ts` wykonuje zapytanie `UPDATE` do tabeli `cards` w Supabase, używając klauzuli `WHERE` do dopasowania zarówno `id` fiszki, jak i `user_id`.
7. Jeśli zapytanie zaktualizuje 0 wierszy (co oznacza, że fiszka nie istnieje lub nie należy do użytkownika), serwis zwraca `null`. Endpoint zwraca wtedy `404`.
8. Jeśli aktualizacja się powiedzie, serwis zwraca zaktualizowany obiekt fiszki.
9. Endpoint konwertuje pełny obiekt na `CardDto` i zwraca go w odpowiedzi z kodem `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wszystkie żądania do tego endpointu muszą zawierać prawidłowy token JWT w nagłówku `Authorization`. Jest to egzekwowane przez globalne middleware.
- **Autoryzacja**: Logika biznesowa w serwisie `card.service.ts` musi bezwzględnie sprawdzać, czy fiszka, która ma być zaktualizowana, należy do uwierzytelnionego użytkownika. Zapytanie `UPDATE` musi zawierać warunek `WHERE user_id = :userId`.
- **Walidacja danych wejściowych**: Użycie `zod` do walidacji ciała żądania chroni przed nieprawidłowymi danymi i potencjalnymi atakami (np. NoSQL injection, jeśli backend używałby innej bazy danych). Długość pól `front` i `back` musi być ograniczona zgodnie ze schematem bazy danych.

## 7. Rozważania dotyczące wydajności
- Operacja `UPDATE` na indeksowanej kolumnie `id` (klucz główny) jest bardzo wydajna.
- Dodanie złożonego indeksu na `(user_id, id)` może nieznacznie przyspieszyć zapytania, chociaż przy kluczu głównym jest to zazwyczaj zbędne.
- Obciążenie jest minimalne, ponieważ endpoint wykonuje tylko jedno zapytanie do bazy danych. Nie przewiduje się problemów z wydajnością.

## 8. Etapy wdrożenia
1. **Utworzenie schematu walidacji Zod**:
   - W pliku `src/types.ts` lub nowym pliku `src/lib/schemas.ts` zdefiniować schemat Zod dla `UpdateCardCommand`, który:
     - Sprawdza, czy `front` jest stringiem o maksymalnej długości 200 znaków (opcjonalnie).
     - Sprawdza, czy `back` jest stringiem o maksymalnej długości 500 znaków (opcjonalnie).
     - Używa `.refine()`, aby upewnić się, że co najmniej jedno z pól (`front` lub `back`) jest obecne w żądaniu.
2. **Implementacja logiki w serwisie**:
   - W pliku `src/lib/card.service.ts` (lub utworzenie go, jeśli nie istnieje) dodać funkcję `updateCard(userId: string, cardId: string, data: UpdateCardCommand): Promise<Card | null>`.
   - Funkcja ta powinna używać klienta Supabase do wykonania operacji `update` na tabeli `cards`, filtrując po `id` i `user_id`.
   - Powinna zwracać zaktualizowany obiekt fiszki lub `null`, jeśli nie znaleziono pasującego rekordu.
3. **Utworzenie pliku endpointu**:
   - Stworzyć plik `src/pages/api/cards/[id].ts`.
   - Dodać `export const prerender = false;` na początku pliku.
4. **Implementacja handlera `PATCH`**:
   - W pliku `[id].ts` wyeksportować asynchroniczną funkcję `PATCH({ params, request, locals }: APIContext)`.
   - Sprawdzić, czy `locals.user` istnieje; jeśli nie, zwrócić `401` (chociaż middleware powinien to już załatwić).
   - Zwalidować `params.id` jako UUID.
   - Odczytać i zwalidować ciało żądania za pomocą przygotowanego schematu Zod.
   - W przypadku błędów walidacji zwrócić `400` z odpowiednim komunikatem.
   - Wywołać `cardService.updateCard()` z odpowiednimi parametrami.
   - Jeśli serwis zwróci `null`, zwrócić `404`.
   - Jeśli serwis zwróci zaktualizowaną fiszkę, przekształcić ją na `CardDto`, a następnie zwrócić jako odpowiedź JSON z kodem `200 OK`.
5. **Obsługa błędów**:
   - Dodać bloki `try...catch` do obsługi nieoczekiwanych błędów (np. błędy bazy danych) i zwrócić `500 Internal Server Error`.
6. **Testowanie**:
   - Przygotować testy jednostkowe dla logiki serwisu.
   - Przygotować testy integracyjne/e2e dla endpointu, obejmujące przypadki sukcesu oraz wszystkie scenariusze błędów (400, 401, 404, 500).
