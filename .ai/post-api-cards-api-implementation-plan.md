# API Endpoint Implementation Plan: POST /api/cards

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie nowych fiszek. Akceptuje dane fiszki w ciele żądania, przetwarza je, zapisuje w bazie danych i zwraca nowo utworzony zasób.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/cards`
- **Parametry**: Brak parametrów query.
- **Ciało żądania**: Wymagany jest obiekt JSON o następującej strukturze:
  ```json
  {
    "front": "string",
    "back": "string",
    "source": "string"
  }
  ```
  - **Wymagane pola**:
    - `front`: `string` (min. 1, maks. 200 znaków)
    - `back`: `string` (min. 1, maks. 500 znaków)
    - `source`: `enum('manual', 'ai')`

## 3. Wykorzystywane typy
Do implementacji zostaną wykorzystane następujące typy, które należy zdefiniować w `src/types.ts`:

- **`CreateCardDtoSchema` (Zod Schema)**: Schemat do walidacji danych wejściowych.
  ```typescript
  export const CreateCardDtoSchema = z.object({
    front: z.string().min(1, "Front is required.").max(200),
    back: z.string().min(1, "Back is required.").max(500),
    source: z.enum(['manual', 'ai']),
  });
  ```
- **`CreateCardDto`**: Typ generowany na podstawie schematu Zod.
  ```typescript
  export type CreateCardDto = z.infer<typeof CreateCardDtoSchema>;
  ```
- **`Card`**: Encja reprezentująca fiszkę w bazie danych.
  ```typescript
  export type Card = {
    id: string;
    user_id: string;
    front: string;
    back: string;
    source: 'manual' | 'ai';
    interval: number;
    repetition: number;
    ease_factor: number;
    due_date: string;
    created_at: string;
    updated_at: string;
  };
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (`201 Created`)**: Zwraca obiekt JSON z pełnymi danymi nowo utworzonej fiszki.
  ```json
  {
    "id": "d4e5f6a1-...",
    "user_id": "a1b2c3d4-...",
    "front": "What is the capital of Poland?",
    "back": "Warsaw",
    "source": "manual",
    "interval": 0,
    "repetition": 0,
    "ease_factor": 2.5,
    "due_date": "2025-10-12T14:00:00Z",
    "created_at": "2025-10-12T14:00:00Z",
    "updated_at": "2025-10-12T14:00:00Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `405 Method Not Allowed`: Użyto nieobsługiwanej metody HTTP.
  - `500 Internal Server Error`: Wystąpił błąd serwera.

## 5. Przepływ danych
1. Klient wysyła żądanie `POST` na adres `/api/cards` z danymi fiszki w ciele.
2. Middleware Astro weryfikuje sesję użytkownika. Jeśli sesja jest nieprawidłowa, zwraca `401 Unauthorized`.
3. Handler API w `src/pages/api/cards/index.ts` odbiera żądanie.
4. Handler używa schematu `CreateCardDtoSchema` (Zod) do walidacji ciała żądania. W przypadku błędu walidacji zwraca `400 Bad Request`.
5. Handler wywołuje funkcję `createCard` z nowego serwisu `src/lib/cards.service.ts`, przekazując zwalidowane dane oraz `user_id` pobrane z sesji.
6. Funkcja `createCard` wykonuje operację `insert` na tabeli `cards` w bazie danych Supabase.
7. Baza danych, dzięki polityce RLS, zapewnia, że `user_id` jest zgodny z ID uwierzytelnionego użytkownika.
8. Po pomyślnym zapisie, serwis `createCard` zwraca pełny obiekt nowej fiszki.
9. Handler API zwraca otrzymany obiekt do klienta z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do punktu końcowego jest chroniony przez middleware, które weryfikuje sesję użytkownika za pomocą Supabase Auth. Tylko zalogowani użytkownicy mogą z niego korzystać.
- **Autoryzacja**: Polityka Row Level Security (RLS) w PostgreSQL jest skonfigurowana na tabeli `cards`, aby zapewnić, że użytkownicy mogą tworzyć fiszki wyłącznie dla siebie (`WITH CHECK (auth.uid() = user_id)`).
- **Walidacja danych**: Wszystkie dane wejściowe są rygorystycznie walidowane za pomocą Zod, co zapobiega błędom i potencjalnym atakom, takim jak SQL Injection czy XSS.

## 7. Obsługa błędów
- **Brak sesji użytkownika**: Middleware zwróci `401 Unauthorized`.
- **Nieprawidłowe dane wejściowe**: Handler zwróci `400 Bad Request` z komunikatem o błędach walidacji z Zod.
- **Błąd zapisu do bazy danych**: Serwis `cards.service.ts` przechwyci błąd z klienta Supabase. Handler API zaloguje błąd i zwróci `500 Internal Server Error`.
- **Nieobsługiwana metoda HTTP**: Astro automatycznie zwróci `405 Method Not Allowed` dla metod innych niż `POST`.

## 8. Rozważania dotyczące wydajności
- Operacja `INSERT` na tabeli `cards` jest szybka i wydajna.
- Indeks na kolumnie `user_id` nie ma bezpośredniego wpływu na wydajność zapisu, ale jest kluczowy dla operacji odczytu, które będą implementowane w przyszłości.
- Obciążenie jest minimalne, ponieważ punkt końcowy wykonuje pojedynczą, prostą operację na bazie danych. Nie przewiduje się wąskich gardeł wydajnościowych.

## 9. Etapy wdrożenia
1.  **Aktualizacja typów**: W pliku `src/types.ts` zdefiniować typ `Card` oraz schemat walidacji `CreateCardDtoSchema` i typ `CreateCardDto`.
2.  **Utworzenie serwisu**: Stworzyć nowy plik `src/lib/cards.service.ts`.
3.  **Implementacja logiki serwisu**: W `src/lib/cards.service.ts` zaimplementować funkcję `createCard(dto: CreateCardDto, userId: string, supabase: SupabaseClient)`, która będzie odpowiedzialna za wstawienie nowego rekordu do tabeli `cards` i zwrócenie go.
4.  **Utworzenie pliku API route**: Stworzyć plik `src/pages/api/cards/index.ts`.
5.  **Implementacja handlera API**: W `src/pages/api/cards/index.ts` zaimplementować handler `POST`, który:
    - Sprawdza sesję użytkownika.
    - Waliduje ciało żądania za pomocą `CreateCardDtoSchema`.
    - Wywołuje serwis `cards.service.ts`.
    - Obsługuje błędy i zwraca odpowiednie kody statusu.
    - W przypadku sukcesu zwraca `201 Created` z danymi nowej fiszki.
6.  **Testowanie manualne**: Po wdrożeniu, przetestować punkt końcowy za pomocą narzędzia do testowania API (np. Postman lub wbudowany klient w IDE), sprawdzając wszystkie scenariusze sukcesu i błędów.
