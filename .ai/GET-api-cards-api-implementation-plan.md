
# API Endpoint Implementation Plan: GET /api/cards

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest umożliwienie uwierzytelnionym użytkownikom pobierania listy ich fiszek. Endpoint wspiera paginację, filtrowanie wyników na podstawie źródła (`manual` lub `ai`) oraz sortowanie według różnych kryteriów (`created_at`, `updated_at`, `due_date`).

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/cards`
- **Parametry zapytania (Query Parameters)**:
  - **Wymagane**: Brak.
  - **Opcjonalne**:
    - `page` (number): Numer strony do pobrania. Domyślnie `1`.
    - `pageSize` (number): Liczba fiszek na stronie. Domyślnie `10`, maksymalnie `100`.
    - `source` (string): Filtr źródła fiszek. Dopuszczalne wartości: `'manual'`, `'ai'`.
    - `sortBy` (string): Pole, według którego sortowane są wyniki. Dopuszczalne wartości: `'created_at'`, `'updated_at'`, `'due_date'`. Domyślnie `'created_at'`.
    - `order` (string): Kierunek sortowania. Dopuszczalne wartości: `'asc'`, `'desc'`. Domyślnie `'desc'`.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **`CardDto`**: Obiekt transferu danych (DTO) reprezentujący pojedynczą fiszkę zwracaną przez API. Zawiera publicznie dostępne pola z encji `Card`.
- **`GetCardsResponseDto`**: DTO definiujący kompletną strukturę odpowiedzi, zawierającą tablicę `data` (z obiektami `CardDto`) oraz obiekt `pagination` z metadanymi.

## 4. Szczegóły odpowiedzi
- **Struktura odpowiedzi sukcesu (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "source": "manual" | "ai",
        "due_date": "timestamptz",
        "created_at": "timestamptz",
        "updated_at": "timestamptz"
      }
    ],
    "pagination": {
      "currentPage": "number",
      "pageSize": "number",
      "totalPages": "number",
      "totalCount": "number"
    }
  }
  ```
- **Struktura odpowiedzi błędu (400 Bad Request)**:
  ```json
  {
    "error": "Bad Request",
    "details": [ /* komunikaty błędów z Zod */ ]
  }
  ```

## 5. Przepływ danych
1.  Żądanie `GET` trafia do endpointu `/api/cards/index.ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika i udostępnia klienta Supabase oraz dane sesji w `context.locals`.
3.  Handler w `index.ts` sprawdza, czy użytkownik jest zalogowany. Jeśli nie, zwraca błąd `401 Unauthorized`.
4.  Parametry zapytania są parsowane i walidowane przy użyciu schemy `zod`. W przypadku błędu walidacji zwracany jest błąd `400 Bad Request`.
5.  Handler wywołuje funkcję `getCardsForUser` z nowo utworzonego serwisu `src/lib/cards.service.ts`, przekazując ID użytkownika oraz zwalidowane parametry.
6.  Serwis `cards.service.ts` buduje zapytanie do Supabase, uwzględniając filtrowanie, sortowanie i paginację.
7.  Zapytanie jest wykonywane na tabeli `cards` w bazie danych. Polityki RLS zapewniają, że zapytanie zwróci tylko fiszki należące do zalogowanego użytkownika.
8.  Serwis zwraca pobrane dane (fiszki i łączną liczbę rekordów) do handlera.
9.  Handler formatuje dane do postaci `GetCardsResponseDto` i wysyła odpowiedź `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest ograniczony tylko do zalogowanych użytkowników. Każde żądanie musi być poprzedzone weryfikacją sesji w `context.locals.session`.
- **Autoryzacja**: Polityki Row Level Security (RLS) w PostgreSQL zapewniają, że użytkownik ma dostęp wyłącznie do swoich fiszek. Zapytania do bazy danych automatycznie filtrują wyniki na podstawie `user_id` zgodnego z `auth.uid()`.
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania są rygorystycznie walidowane za pomocą `zod`, co chroni przed nieoczekiwanymi danymi wejściowymi i potencjalnymi atakami.

## 7. Obsługa błędów
- **`400 Bad Request`**: Zwracany, gdy parametry zapytania nie przejdą walidacji `zod`. Odpowiedź będzie zawierać szczegółowe informacje o błędach.
- **`401 Unauthorized`**: Zwracany, gdy użytkownik nie jest uwierzytelniony (brak aktywnej sesji).
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych problemów po stronie serwera, np. błędu połączenia z bazą danych. Błąd zostanie zalogowany na serwerze w celu dalszej analizy.

## 8. Rozważania dotyczące wydajności
- **Paginacja**: Obowiązkowa paginacja z maksymalnym rozmiarem strony (`pageSize=100`) zapobiega pobieraniu zbyt dużej ilości danych naraz.
- **Indeksy**: Istniejące indeksy na kolumnach `user_id` i `due_date` w tabeli `cards` przyspieszą wykonywanie zapytań filtrujących i sortujących. Należy rozważyć dodanie indeksów dla `created_at` i `updated_at`, jeśli staną się one często używanymi kryteriami sortowania.
- **Selektywne pobieranie kolumn**: Zapytanie Supabase powinno precyzyjnie określać wymagane kolumny (`id`, `front`, `back`, `source`, `due_date`, `created_at`, `updated_at`), aby zminimalizować transfer danych między bazą a serwerem.

## 9. Etapy wdrożenia
1.  **Utworzenie serwisu**: Stworzyć plik `src/lib/cards.service.ts`.
2.  **Implementacja logiki serwisu**: W `cards.service.ts` zaimplementować funkcję `getCardsForUser(userId, params)`, która:
    - Przyjmuje ID użytkownika i zwalidowane parametry.
    - Buduje zapytanie do Supabase z użyciem `.select()`, `.eq('user_id', ...)`, `.range()`, `.order()`.
    - Warunkowo dodaje filtr `.eq('source', ...)` jeśli został podany.
    - Wykonuje dwa zapytania: jedno do pobrania paginowanych danych, drugie do zliczenia wszystkich pasujących rekordów (`count`).
    - Zwraca obiekt `{ data, totalCount }`.
3.  **Utworzenie pliku endpointu**: Stworzyć plik `src/pages/api/cards/index.ts`.
4.  **Implementacja handlera `GET`**: W `index.ts`:
    - Zdefiniować `export function GET({ request, locals }: APIContext)`.
    - Sprawdzić sesję użytkownika w `locals.session`.
    - Zdefiniować i zastosować schemę walidacji `zod` dla parametrów URL.
    - Wywołać serwis `getCardsForUser`.
    - Obliczyć `totalPages` i zbudować obiekt `pagination`.
    - Zwrócić odpowiedź w formacie `GetCardsResponseDto` z kodem `200 OK` lub odpowiedni błąd.
5.  **Testowanie**: Ręcznie przetestować endpoint przy użyciu narzędzi takich jak Postman lub curl, sprawdzając wszystkie parametry, scenariusze błędów i poprawność paginacji.
