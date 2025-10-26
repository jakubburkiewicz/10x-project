# API Endpoint Implementation Plan: GET /api/cards/{id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy służy do pobierania pojedynczej fiszki na podstawie jej unikalnego identyfikatora (ID). Jest przeznaczony do użytku przez uwierzytelnionych użytkowników, którzy mogą pobierać wyłącznie własne fiszki.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/cards/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Unikalny identyfikator fiszki w formacie UUID.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **`CardDto`**: Obiekt transferu danych (DTO) używany do formatowania odpowiedzi. Zdefiniowany w `src/types.ts`, zawiera pola: `id`, `front`, `back`, `source`, `due_date`, `created_at`, `updated_at`.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
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
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Gdy `id` nie jest prawidłowym UUID.
  - `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Gdy fiszka o podanym `id` nie istnieje lub nie należy do użytkownika.
  - `500 Internal Server Error`: W przypadku błędów serwera.

## 5. Przepływ danych
1. Żądanie `GET` trafia do endpointu Astro `src/pages/api/cards/[id].ts`.
2. Middleware (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje sesję użytkownika i udostępnia klienta Supabase w `context.locals.supabase`. Jeśli użytkownik nie jest zalogowany, middleware zwraca `401 Unauthorized`.
3. Handler `GET` w pliku endpointu odczytuje `id` z parametrów ścieżki (`context.params.id`).
4. `id` jest walidowane przy użyciu `zod` w celu sprawdzenia, czy jest to prawidłowy UUID.
5. Handler wywołuje funkcję serwisową (np. `getCardById`) z nowego serwisu `src/lib/cards.service.ts`, przekazując jej `id` fiszki oraz klienta Supabase.
6. Funkcja serwisowa wykonuje zapytanie do bazy danych Supabase: `supabase.from('cards').select('id, front, back, source, due_date, created_at, updated_at').eq('id', cardId).single()`. Polityka RLS na poziomie bazy danych automatycznie filtruje wyniki, aby zapewnić, że użytkownik ma dostęp tylko do swoich fiszek.
7. Jeśli zapytanie zwróci dane, serwis mapuje wynik na typ `CardDto` i zwraca go do handlera.
8. Jeśli zapytanie nie zwróci danych (lub zwróci błąd `PGRST116`, oznaczający brak wierszy), serwis zwraca `null`.
9. Handler API, na podstawie wyniku z serwisu, zwraca odpowiedź:
   - Jeśli dane zostały zwrócone: `200 OK` z obiektem `CardDto`.
   - Jeśli `null`: `404 Not Found`.
   - W przypadku błędu walidacji: `400 Bad Request`.
   - W przypadku błędu serwera: `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest ograniczony do uwierzytelnionych użytkowników. Jest to realizowane przez globalny middleware, który sprawdza obecność i ważność tokena sesji Supabase.
- **Autoryzacja**: Użytkownicy mogą pobierać tylko własne fiszki. Zabezpieczenie jest podwójne:
  1. **Poziom bazy danych**: Polityka Row Level Security (RLS) na tabeli `cards` zapewnia, że zapytania `SELECT` zwracają tylko wiersze, gdzie `user_id` pasuje do `auth.uid()`.
  2. **Poziom aplikacji**: Chociaż RLS jest głównym mechanizmem, zapytanie w kodzie i tak powinno być jawnie skonstruowane z myślą o izolacji danych użytkownika, jeśli to możliwe.
- **Walidacja danych wejściowych**: Parametr `id` jest walidowany, aby zapobiec błędom zapytań do bazy danych i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK jest przed tym zabezpieczone).

## 7. Rozważania dotyczące wydajności
- Zapytanie do bazy danych jest bardzo wydajne, ponieważ operuje na kluczu głównym (`id`), który jest domyślnie indeksowany.
- Indeks na kolumnie `user_id` (`CREATE INDEX ON cards (user_id);`) dodatkowo wspiera wydajność zapytań filtrowanych przez RLS.
- Obciążenie jest minimalne, ponieważ endpoint zwraca tylko jeden rekord. Nie przewiduje się problemów z wydajnością.

## 8. Etapy wdrożenia
1. **Utworzenie pliku serwisu**: Stwórz nowy plik `src/lib/cards.service.ts`.
2. **Implementacja logiki w serwisie**:
   - W `src/lib/cards.service.ts` dodaj funkcję `getCardById(supabase: SupabaseClient, cardId: string): Promise<CardDto | null>`.
   - Wewnątrz funkcji wykonaj zapytanie do Supabase, aby pobrać fiszkę o podanym `cardId`.
   - Obsłuż przypadki, gdy fiszka nie zostanie znaleziona.
   - Zmapuj wynik na `CardDto` przed zwróceniem.
3. **Utworzenie pliku endpointu**: Stwórz nowy plik `src/pages/api/cards/[id].ts`.
4. **Implementacja handlera API**:
   - W `src/pages/api/cards/[id].ts` zaimportuj `APIRoute` z Astro.
   - Zaimplementuj funkcję `export function GET({ locals, params }: APIContext)`.
   - Pobierz klienta Supabase z `locals.supabase`.
   - Zwaliduj `params.id` za pomocą `zod`, upewniając się, że jest to UUID.
   - Wywołaj funkcję `getCardById` z serwisu.
   - Zwróć odpowiednią odpowiedź HTTP (`200`, `404`, `400`, `500`) w zależności od wyniku operacji.
5. **Testowanie**:
   - Napisz testy jednostkowe dla funkcji serwisowej.
   - Przeprowadź testy integracyjne dla endpointu, sprawdzając wszystkie scenariusze (sukces, brak autoryzacji, nieznalezione ID, nieprawidłowe ID).
