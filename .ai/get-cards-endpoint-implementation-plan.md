# API Endpoint Implementation Plan: GET /api/cards

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest umożliwienie uwierzytelnionym użytkownikom pobierania listy swoich fiszek. Endpoint wspiera paginację, filtrowanie według źródła (`manual` lub `ai`) oraz sortowanie według różnych pól, co zapewnia elastyczność w przeglądaniu danych.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/cards`
- **Parametry zapytania (Query Parameters)**:
  - **Wymagane**: Brak.
  - **Opcjonalne**:
    - `page` (number, domyślnie: `1`): Numer strony do paginacji.
    - `pageSize` (number, domyślnie: `10`): Liczba elementów na stronie.
    - `source` (string, enum: `'manual'`, `'ai'`): Filtruje fiszki według źródła.
    - `sortBy` (string, domyślnie: `'created_at'`): Pole do sortowania (np. `due_date`, `updated_at`).
    - `order` (string, enum: `'asc'`, `'desc'`, domyślnie: `'desc'`): Kierunek sortowania.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
W celu zapewnienia bezpieczeństwa typów i spójności danych, zostaną zdefiniowane następujące typy w `src/types.ts`:

- **`GetCardsQueryDto`**: Obiekt transferu danych (DTO) dla parametrów zapytania.
  ```typescript
  export interface GetCardsQueryDto {
    page: number;
    pageSize: number;
    source?: 'manual' | 'ai';
    sortBy: string;
    order: 'asc' | 'desc';
  }
  ```
- **`CardDto`**: DTO reprezentujący fiszkę w odpowiedzi API.
  ```typescript
  export interface CardDto {
    id: string;
    front: string;
    back: string;
    source: 'manual' | 'ai';
    due_date: string;
    created_at: string;
    updated_at: string;
  }
  ```
- **`PaginatedResponseDto<T>`**: Generyczny DTO dla paginowanych odpowiedzi.
  ```typescript
  export interface PaginatedResponseDto<T> {
    data: T[];
    pagination: Pagination;
  }
  ```
- **`Pagination`**: Obiekt opisujący stan paginacji.
  ```typescript
  export interface Pagination {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  }
  ```

## 4. Szczegóły odpowiedzi
- **Struktura odpowiedzi (Success `200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": "c3a4b1d2-...",
        "front": "What is Astro?",
        "back": "A web framework...",
        "source": "manual",
        "due_date": "2025-10-20T10:00:00Z",
        "created_at": "2025-10-12T12:00:00Z",
        "updated_at": "2025-10-12T12:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalCount": 50
    }
  }
  ```
- **Kody statusu**:
  - `200 OK`: Pomyślnie pobrano listę fiszek.
  - `400 Bad Request`: Nieprawidłowe parametry zapytania.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do endpointu Astro `/api/cards`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika. Jeśli sesja jest nieprawidłowa, zwraca `401 Unauthorized`.
3.  Endpoint API (`src/pages/api/cards/index.ts`) parsuje i waliduje parametry zapytania przy użyciu schematu Zod. W razie błędu zwraca `400 Bad Request`.
4.  Endpoint wywołuje metodę `getCards` z nowo utworzonego serwisu `CardService` (`src/lib/services/card.service.ts`), przekazując zweryfikowane parametry oraz `userId` pobrane z sesji.
5.  `CardService` buduje zapytanie do bazy danych Supabase, uwzględniając filtrowanie, sortowanie i paginację.
6.  Zapytanie jest wykonywane na tabeli `cards`. Dzięki politykom RLS, Supabase automatycznie filtruje wyniki, aby zwrócić tylko fiszki należące do zalogowanego użytkownika.
7.  Serwis oblicza metadane paginacji (całkowita liczba rekordów, liczba stron).
8.  Serwis zwraca paginowane dane do endpointu API.
9.  Endpoint API formatuje odpowiedź jako `PaginatedResponseDto<CardDto>` i wysyła ją do klienta z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony. Middleware Astro sprawdzi obecność i ważność tokena sesji Supabase.
- **Autoryzacja**: Polityki Row Level Security (RLS) na tabeli `cards` w Supabase zapewniają, że użytkownik ma dostęp wyłącznie do swoich fiszek. Zapytania `SELECT` będą dozwolone tylko wtedy, gdy `auth.uid() = cards.user_id`.
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania będą rygorystycznie walidowane przy użyciu Zod, aby zapobiec nieoczekiwanemu zachowaniu i potencjalnym atakom (np. przez manipulację `sortBy`). Dozwolone kolumny do sortowania zostaną zdefiniowane w białej liście.

## 7. Obsługa błędów
- **Błędy walidacji (`400`)**: Zod obsłuży walidację. W przypadku błędu, API zwróci odpowiedź z kodem `400` i szczegółami błędu.
- **Brak uwierzytelnienia (`401`)**: Middleware Astro zwróci `401`, jeśli użytkownik nie jest zalogowany.
- **Błędy serwera (`500`)**: Wszelkie nieoczekiwane błędy (np. błąd połączenia z bazą danych) zostaną przechwycone w bloku `try...catch`. Błąd zostanie zalogowany po stronie serwera, a do klienta zostanie wysłana generyczna odpowiedź z kodem `500`.

## 8. Rozważania dotyczące wydajności
- **Indeksy bazy danych**: Aby zapewnić szybkie wykonywanie zapytań, istniejące indeksy na kolumnach `user_id` i `due_date` w tabeli `cards` zostaną wykorzystane. Należy zweryfikować, czy sortowanie po innych dozwolonych polach również jest wydajne i w razie potrzeby dodać kolejne indeksy.
- **Paginacja**: Paginacja po stronie serwera jest kluczowa, aby unikać przesyłania dużych ilości danych i zmniejszyć obciążenie zarówno serwera, jak i klienta.

## 9. Etapy wdrożenia
1.  **Aktualizacja typów**: W pliku `src/types.ts` zdefiniować interfejsy: `GetCardsQueryDto`, `CardDto`, `PaginatedResponseDto<T>` i `Pagination`.
2.  **Utworzenie schematu walidacji**: W nowym pliku `src/lib/schemas/card.schema.ts` zdefiniować schemat Zod `GetCardsQuerySchema` do walidacji parametrów zapytania.
3.  **Implementacja serwisu**:
    - Utworzyć plik `src/lib/services/card.service.ts`.
    - Zaimplementować w nim klasę `CardService` z metodą `getCards(supabase: SupabaseClient, userId: string, query: GetCardsQueryDto)`.
    - Metoda ta będzie zawierać logikę budowania i wykonywania zapytania do Supabase oraz obliczania paginacji.
4.  **Implementacja endpointu API**:
    - Utworzyć plik `src/pages/api/cards/index.ts`.
    - Dodać `export const prerender = false;` dla renderowania dynamicznego.
    - Zaimplementować funkcję `GET({ request, locals }: APIContext)`.
    - Wewnątrz funkcji:
        - Sprawdzić, czy użytkownik jest zalogowany (`locals.user`).
        - Sparsować parametry URL i zwalidować je przy użyciu `GetCardsQuerySchema`.
        - Wywołać `cardService.getCards()` z klientem Supabase (`locals.supabase`) i danymi użytkownika.
        - Zwrócić odpowiedź w formacie JSON z odpowiednim kodem statusu.
        - Dodać obsługę błędów w bloku `try...catch`.
5.  **Testowanie**:
    - Napisać testy jednostkowe dla `CardService`, mockując klienta Supabase.
    - Przeprowadzić testy integracyjne endpointu API przy użyciu narzędzia do testowania API (np. Postman, Insomnia), sprawdzając wszystkie przypadki użycia: paginację, filtrowanie, sortowanie oraz scenariusze błędów.
