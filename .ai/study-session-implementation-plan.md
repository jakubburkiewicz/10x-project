# API Endpoint Implementation Plan: `GET /api/study-session`

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest pobranie listy fiszek, które są gotowe do powtórki w ramach sesji nauki. Endpoint wykorzystuje algorytm Spaced Repetition, filtrując fiszki, których data powtórki (`due_date`) jest w przeszłości. Dostęp jest ograniczony wyłącznie do uwierzytelnionych użytkowników.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/study-session`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**:
    - `limit` (query parameter): `number` - Maksymalna liczba fiszek do zwrócenia. Domyślna wartość to `20`, a maksymalna `100`.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
Do implementacji zostaną wykorzystane następujące, już istniejące, typy z `src/types.ts`:
- `GetStudySessionResponseDto`: Definiuje strukturę obiektu odpowiedzi.
- `StudySessionCardDto`: Definiuje strukturę pojedynczej fiszki w odpowiedzi.

## 4. Szczegóły odpowiedzi
- **Struktura odpowiedzi sukcesu (200 OK)**:
  ```json
  {
    "sessionCards": [
      {
        "id": "c3a4b1d2-...",
        "front": "What is Astro?",
        "back": "A web framework...",
        "source": "manual"
      }
    ]
  }
  ```
- **Kody statusu**:
  - `200 OK`: Żądanie zakończone pomyślnie. Zwraca tablicę `sessionCards` (może być pusta).
  - `400 Bad Request`: Parametr `limit` jest nieprawidłowy.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wystąpił błąd po stronie serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do endpointu `/api/study-session`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika. Jeśli użytkownik jest nieprawidłowy, zwraca `401 Unauthorized`. W przeciwnym razie, przekazuje instancję `supabase` i dane sesji w `context.locals`.
3.  Handler `GET` w `src/pages/api/study-session.ts` parsuje i waliduje parametr `limit` z URL.
4.  Handler wywołuje metodę z serwisu `StudySessionService` (np. `getDueCardsForUser`), przekazując `supabase`, ID użytkownika i zweryfikowany `limit`.
5.  `StudySessionService` wykonuje zapytanie do bazy danych Supabase, aby pobrać fiszki (`cards`) spełniające kryteria:
    - `user_id` jest zgodny z ID zalogowanego użytkownika.
    - `due_date` jest mniejsza lub równa aktualnemu czasowi.
    - Wyniki są sortowane (np. po `due_date` rosnąco) i ograniczone przez `limit`.
6.  Serwis zwraca listę fiszek do handlera.
7.  Handler mapuje wyniki na `StudySessionCardDto`, tworzy obiekt `GetStudySessionResponseDto` i zwraca go z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint musi być chroniony. Logika w handlerze musi sprawdzać istnienie sesji użytkownika w `context.locals.session`. Jeśli sesja nie istnieje, należy natychmiast zwrócić `401 Unauthorized`.
- **Autoryzacja**: Zapytanie do bazy danych musi bezwzględnie zawierać warunek `where('user_id', 'eq', userId)`, aby uniemożliwić jednemu użytkownikowi dostęp do fiszek innego.
- **Walidacja danych wejściowych**: Parametr `limit` musi być walidowany za pomocą `zod`, aby zapobiec potencjalnym atakom (np. SQL Injection, chociaż Supabase ORM temu przeciwdziała) i zapewnić, że wartość jest w oczekiwanym zakresie (np. `1-100`).

## 7. Rozważania dotyczące wydajności
- **Indeksowanie bazy danych**: Aby zapewnić szybkie wykonywanie zapytań, kolumny `user_id` i `due_date` w tabeli `cards` powinny być indeksowane.
- **Limitowanie wyników**: Domyślny i maksymalny `limit` zapobiegają pobieraniu zbyt dużej ilości danych, co mogłoby obciążyć zarówno bazę danych, jak i sieć.
- **Paginacja**: Obecnie endpoint nie wspiera paginacji. Jeśli sesje nauki mogłyby być bardzo duże, w przyszłości można rozważyć jej dodanie.

## 8. Etapy wdrożenia
1.  **Utworzenie serwisu**: Stworzyć plik `src/lib/services/StudySessionService.ts`.
2.  **Implementacja logiki serwisu**: W `StudySessionService.ts` zaimplementować funkcję `getDueCardsForUser(supabase, userId, limit)`, która będzie pobierać odpowiednie fiszki z bazy danych.
3.  **Utworzenie pliku endpointu**: Stworzyć plik `src/pages/api/study-session.ts`.
4.  **Implementacja handlera `GET`**: W `study-session.ts` zaimplementować handler `export function GET({ request, locals })`.
5.  **Dodanie walidacji**: W handlerze `GET` zaimplementować walidację parametru `limit` przy użyciu `zod`.
6.  **Integracja z serwisem**: W handlerze `GET` wywołać funkcję z `StudySessionService` w celu pobrania danych.
7.  **Obsługa autoryzacji i błędów**: Dodać weryfikację sesji użytkownika (`locals.session`) i zaimplementować obsługę błędów (400, 401, 500) z odpowiednimi komunikatami.
8.  **Formatowanie odpowiedzi**: Zbudować i zwrócić obiekt odpowiedzi zgodny z `GetStudySessionResponseDto`.
9.  **Testowanie manualne**: Po wdrożeniu, ręcznie przetestować endpoint przy użyciu narzędzia API (np. Postman, Thunder Client) w różnych scenariuszach (użytkownik zalogowany/niezalogowany, z/bez parametru `limit`, nieprawidłowy `limit`).
10. **Code Review**: Przekazać kod do przeglądu przez innego członka zespołu.
