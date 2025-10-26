# API Endpoint Implementation Plan: `PATCH /api/cards/{id}`

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom aktualizację istniejącej fiszki. Użytkownicy mogą modyfikować treść przodu (`front`) i/lub tyłu (`back`) fiszki, pod warunkiem, że są jej właścicielami.

## 2. Szczegóły żądania
- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/cards/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (w ścieżce URL): Unikalny identyfikator (UUID) fiszki do zaktualizowania.
  - **Opcjonalne**:
    - Ciało żądania musi zawierać co najmniej jedno z poniższych pól.
- **Request Body**:
  - **Typ zawartości**: `application/json`
  - **Struktura**:
    ```json
    {
      "front": "Nowa treść przodu fiszki (opcjonalne, max 200 znaków)",
      "back": "Nowa treść tyłu fiszki (opcjonalne, max 500 znaków)"
    }
    ```

## 3. Wykorzystywane typy
- **Command Model (Request)**: `UpdateCardCommand` (`Partial<Pick<Card, "front" | "back">>)` - reprezentuje dane wejściowe do aktualizacji.
- **DTO (Response)**: `CardDto` (`Pick<Card, "id" | "front" | "back" | "source" | "due_date" | "created_at" | "updated_at">`) - reprezentuje dane fiszki zwracane do klienta po pomyślnej aktualizacji.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (`200 OK`)**:
  - **Warunek**: Fiszka została pomyślnie zaktualizowana.
  - **Ciało odpowiedzi**: Obiekt JSON zawierający zaktualizowane dane fiszki w formacie `CardDto`.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (np. błędny format `id`, ciało żądania niespełniające walidacji).
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Fiszka o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
  - `500 Internal Server Error`: Wystąpił nieoczekiwany błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `PATCH` na adres `/api/cards/{id}` z danymi do aktualizacji w ciele żądania.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje sesję użytkownika i dołącza klienta Supabase oraz dane użytkownika do `context.locals`.
3.  Handler API w `src/pages/api/cards/[id].ts` jest wywoływany.
4.  Handler sprawdza, czy użytkownik jest uwierzytelniony (`context.locals.user`).
5.  Handler waliduje parametr `id` (czy jest to UUID) oraz ciało żądania za pomocą schematu Zod.
6.  Handler wywołuje funkcję `updateCard` z nowo utworzonego serwisu `src/lib/cards.service.ts`, przekazując `id`, dane do aktualizacji oraz klienta Supabase (`context.locals.supabase`).
7.  Funkcja `updateCard` wykonuje zapytanie `UPDATE` do tabeli `cards` w bazie danych Supabase. Polityka RLS automatycznie zapewnia, że użytkownik może modyfikować tylko swoje fiszki.
8.  Jeśli aktualizacja się powiedzie, serwis zwraca zaktualizowane dane fiszki.
9.  Handler API formatuje zwrócone dane do postaci `CardDto` i odsyła je do klienta z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest ograniczony do uwierzytelnionych użytkowników. Middleware i handler API będą weryfikować istnienie aktywnej sesji użytkownika. Żądania bez ważnej sesji zostaną odrzucone z kodem `401 Unauthorized`.
- **Autoryzacja**: Polityka Row Level Security (RLS) w PostgreSQL/Supabase jest kluczowym mechanizmem zabezpieczającym. Polityka `Allow individual update access` na tabeli `cards` gwarantuje, że operacja `UPDATE` powiedzie się tylko wtedy, gdy `auth.uid()` zgadza się z `user_id` modyfikowanego wiersza. To zapobiega modyfikacji danych przez nieuprawnionych użytkowników.
- **Walidacja danych wejściowych**: Wszystkie dane wejściowe (`id` z URL i ciało żądania) będą rygorystycznie walidowane za pomocą Zod, aby zapobiec atakom typu SQL Injection (choć Supabase client parametryzuje zapytania) oraz błędom wynikającym z nieprawidłowych danych. Limity długości pól (`front`, `back`) będą zgodne ze schematem bazy danych.

## 7. Obsługa błędów
- **`400 Bad Request`**: Zwracany, gdy walidacja `id` lub ciała żądania nie powiedzie się. Odpowiedź będzie zawierać komunikat o błędzie z Zod.
- **`401 Unauthorized`**: Zwracany przez handler, jeśli `context.locals.user` nie jest zdefiniowany.
- **`404 Not Found`**: Zwracany przez serwis `cards.service.ts`, jeśli zapytanie `UPDATE` nie znajdzie pasującego wiersza (co oznacza, że fiszka nie istnieje lub nie należy do użytkownika).
- **`500 Internal Server Error`**: Zwracany w bloku `catch` w handlerze API dla wszelkich nieprzewidzianych błędów. Szczegóły błędu zostaną zalogowane na serwerze.

## 8. Rozważania dotyczące wydajności
- Operacja `UPDATE` na pojedynczym wierszu przy użyciu klucza głównego (`id`) jest wysoce wydajna i nie powinna stanowić wąskiego gardła.
- Indeks na kolumnie `user_id` wspiera wydajność polityk RLS.
- Obciążenie endpointu jest niskie, ponieważ operacje są ograniczone do pojedynczych, prostych zapytań do bazy danych.

## 9. Etapy wdrożenia
1.  **Utworzenie serwisu `cards.service.ts`**:
    - Stworzyć plik `src/lib/cards.service.ts`.
    - Zaimplementować w nim funkcję `updateCard(id: string, data: UpdateCardCommand, supabase: SupabaseClient)`.
    - Funkcja powinna wykonać zapytanie `supabase.from('cards').update(data).eq('id', id).select().single()`.
    - Funkcja powinna obsługiwać błąd, gdy `data` jest `null` (brak fiszki), i rzucać odpowiedni błąd (np. `NotFoundError`).
2.  **Utworzenie schematu walidacji Zod**:
    - W pliku `src/pages/api/cards/[id].ts` zdefiniować schemat Zod dla `UpdateCardCommand`.
    - Schemat powinien walidować `front` (string, max 200), `back` (string, max 500) i używać `.refine()` do sprawdzenia, czy co najmniej jedno pole jest obecne.
3.  **Implementacja handlera API**:
    - Utworzyć plik `src/pages/api/cards/[id].ts`.
    - Dodać `export const prerender = false;`.
    - Zaimplementować handler `PATCH({ params, request, context }: APIContext)`.
    - Sprawdzić uwierzytelnienie: `if (!context.locals.user) { ... }`.
    - Zwalidować `params.id` jako UUID.
    - Odczytać i zwalidować ciało żądania przy użyciu zdefiniowanego schematu Zod.
    - Wywołać `cardsService.updateCard(...)` w bloku `try...catch`.
    - W przypadku sukcesu, zwrócić odpowiedź `200 OK` z danymi `CardDto`.
    - W blokach `catch` obsługiwać specyficzne błędy (np. `NotFoundError`) i zwracać odpowiednie kody statusu (`404`, `500`).
4.  **Testowanie**:
    - Napisać testy jednostkowe dla serwisu `cards.service.ts`.
    - Przeprowadzić testy manualne lub automatyczne dla endpointu, obejmujące przypadki sukcesu i wszystkie scenariusze błędów.
