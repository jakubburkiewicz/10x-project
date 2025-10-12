# API Endpoint Implementation Plan: `POST /api/ai/generate-cards`

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest generowanie propozycji fiszek (pytanie-odpowiedź) na podstawie dostarczonego przez użytkownika tekstu. Proces ten wykorzystuje zewnętrzną usługę LLM (Large Language Model). Endpoint nie zapisuje wygenerowanych fiszek w bazie danych; jedynie zwraca je jako sugestie do klienta. Dostęp jest ograniczony do uwierzytelnionych użytkowników.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/ai/generate-cards`
- **Parametry**:
  - **Wymagane**: Brak parametrów URL.
  - **Opcjonalne**: Brak.
- **Request Body**: Wymagane jest ciało żądania w formacie `application/json`.
  ```json
  {
    "text": "string"
  }
  ```
  - `text`: Musi być ciągiem znaków o długości od 1000 do 10000 znaków.

## 3. Wykorzystywane typy
- **Command Model (wejście)**: `GenerateCardsCommand` (`z.object({ text: z.string().min(1000).max(10000) })`) do walidacji danych wejściowych.
- **DTO (wyjście)**: `GenerateCardsResponseDto` (`{ suggestions: CardSuggestionDto[] }`) jako struktura odpowiedzi.
- **DTO (sugestia)**: `CardSuggestionDto` (`{ front: string, back: string }`) dla pojedynczej sugestii fiszki.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt JSON z listą sugestii.
  ```json
  {
    "suggestions": [
      {
        "front": "Pytanie 1",
        "back": "Odpowiedź 1"
      },
      {
        "front": "Pytanie 2",
        "back": "Odpowiedź 2"
      }
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (np. brak pola `text`, zła długość).
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `503 Service Unavailable`: Błąd komunikacji z usługą LLM lub błąd parsowania jej odpowiedzi.

## 5. Przepływ danych
1. Klient wysyła żądanie `POST` na `/api/ai/generate-cards` z tekstem w ciele żądania.
2. Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT Supabase i, jeśli jest prawidłowy, dołącza klienta Supabase i sesję użytkownika do `context.locals`.
3. Handler API w `src/pages/api/ai/generate-cards.ts` jest wywoływany.
4. Handler sprawdza, czy użytkownik jest zalogowany (`context.locals.user`). Jeśli nie, zwraca `401 Unauthorized`.
5. Handler używa schematu `GenerateCardsCommandSchema` (Zod) do walidacji ciała żądania. W przypadku błędu zwraca `400 Bad Request`.
6. Handler wywołuje funkcję `generateCardSuggestions(text)` z nowo utworzonego serwisu `src/lib/ai.service.ts`.
7. Funkcja w serwisie `ai.service.ts` konstruuje prompt systemowy, który instruuje LLM, aby wygenerował fiszki w formacie JSON, a następnie wysyła zapytanie do API LLM (np. OpenRouter) z tekstem użytkownika.
8. Serwis odbiera odpowiedź od LLM, parsuje ją i transformuje do formatu `CardSuggestionDto[]`.
9. Handler API otrzymuje listę sugestii z serwisu i zwraca ją do klienta z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu musi być chroniony. Middleware Astro musi weryfikować token JWT i zapewniać, że tylko zalogowani użytkownicy mogą korzystać z tej funkcji.
- **Autoryzacja**: Każde żądanie musi być powiązane z konkretnym użytkownikiem w celu ewentualnego śledzenia i ograniczania nadużyć.
- **Walidacja danych wejściowych**: Ścisła walidacja za pomocą Zod (`GenerateCardsCommandSchema`) chroni przed nieoczekiwanymi danymi i potencjalnymi atakami.
- **Zarządzanie kluczami API**: Klucz do usługi LLM musi być przechowywany jako prywatna zmienna środowiskowa (np. `PRIVATE_OPENROUTER_API_KEY`) i nigdy nie może być ujawniony po stronie klienta.
- **Ochrona przed nadużyciami**: Należy zaimplementować mechanizm *rate limiting* (np. 5 zapytań na godzinę na użytkownika), aby kontrolować koszty API LLM i zapobiegać atakom DoS.

## 7. Obsługa błędów
- **Błędy walidacji (400)**: Zod automatycznie obsłuży błędy walidacji. Odpowiedź powinna zawierać szczegóły błędu.
- **Brak autoryzacji (401)**: Middleware lub handler powinien zwrócić ten status, jeśli `context.locals.user` jest `null`.
- **Błędy usługi LLM (503)**: Serwis `ai.service.ts` powinien opakowywać wywołania API w blok `try...catch`. W przypadku błędu sieciowego, statusu HTTP != 200 od LLM, lub błędu parsowania odpowiedzi, serwis powinien rzucić dedykowany błąd (np. `LLMServiceError`), który handler API przechwyci i przetłumaczy na odpowiedź `503 Service Unavailable`.
- **Logowanie**: Wszystkie błędy 5xx powinny być logowane po stronie serwera (`console.error`) w celu monitorowania stabilności usługi.

## 8. Rozważania dotyczące wydajności
- **Czas odpowiedzi LLM**: Zapytania do LLM mogą trwać kilka sekund. Klient powinien być poinformowany o trwającym procesie (np. przez wyświetlenie wskaźnika ładowania).
- **Rozmiar payloadu**: Ograniczenie długości tekstu wejściowego (10000 znaków) zapobiega wysyłaniu zbyt dużych zapytań, co mogłoby wpłynąć na wydajność i koszty.

## 9. Etapy wdrożenia
1. **Konfiguracja zmiennych środowiskowych**: Dodać `PRIVATE_OPENROUTER_API_KEY` do pliku `.env` i zaktualizować `src/env.d.ts`.
2. **Utworzenie serwisu AI**:
   - Stworzyć plik `src/lib/ai.service.ts`.
   - Zaimplementować w nim funkcję `generateCardSuggestions(text: string): Promise<CardSuggestionDto[]>`.
   - Funkcja ta powinna zawierać logikę konstruowania promptu, wywoływania API LLM oraz parsowania odpowiedzi.
   - Dodać solidną obsługę błędów komunikacji z LLM.
3. **Utworzenie endpointu API**:
   - Stworzyć plik `src/pages/api/ai/generate-cards.ts`.
   - Zaimplementować handler `POST` zgodnie z `APIContext` z Astro.
   - Dodać sprawdzenie autoryzacji użytkownika (`context.locals.user`).
   - Zintegrować walidację Zod przy użyciu `GenerateCardsCommandSchema.safeParse()`.
   - Wywołać serwis `ai.service.ts` i obsłużyć jego odpowiedź lub błędy.
   - Zwrócić odpowiednie odpowiedzi HTTP (`200`, `400`, `401`, `503`).
4. **Aktualizacja middleware (jeśli konieczne)**: Upewnić się, że middleware w `src/middleware/index.ts` poprawnie obsługuje sesje dla wszystkich tras `/api/*`.
5. **Testowanie**:
   - Napisać testy jednostkowe dla serwisu `ai.service.ts`, mockując wywołania API LLM.
   - Przeprowadzić testy integracyjne endpointu przy użyciu narzędzi takich jak Postman lub testów end-to-end, sprawdzając wszystkie scenariusze (sukces, błędy walidacji, brak autoryzacji, błąd LLM).
6. **Implementacja Rate Limiting**: Dodać mechanizm ograniczający liczbę zapytań na użytkownika w określonym czasie.
