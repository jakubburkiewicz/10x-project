# Plan implementacji widoku "Generuj Fiszki"

## 1. Przegląd

Widok "Generuj Fiszki" umożliwia użytkownikom automatyczne tworzenie fiszek edukacyjnych na podstawie dostarczonego tekstu. Użytkownik wkleja tekst, system generuje propozycje fiszek za pomocą AI, a następnie użytkownik może je przeglądać, edytować, akceptować lub odrzucać przed finalnym zapisaniem w swojej kolekcji. Widok ten realizuje historyjki użytkownika US-003 i US-004.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/generate`. Zostanie utworzony nowy plik strony Astro w lokalizacji `src/pages/generate.astro`.

## 3. Struktura komponentów

Hierarchia komponentów dla widoku będzie następująca:

```
- GenerateView (React, .tsx) - Główny kontener widoku
  - GenerateForm (React, .tsx) - Formularz do wprowadzania tekstu i generowania fiszek
    - Textarea (Shadcn/ui)
    - Button (Shadcn/ui)
    - Spinner (custom lub z biblioteki)
  - SuggestionsList (React, .tsx) - Lista wygenerowanych propozycji fiszek
    - SuggestionCard (React, .tsx) - Pojedyncza karta z propozycją fiszki
      - Card (Shadcn/ui)
      - Button (Shadcn/ui)
  - Toast (Shadcn/ui) - Komponent do wyświetlania powiadomień
```

## 4. Szczegóły komponentów

### GenerateView

-   **Opis komponentu**: Główny komponent-kontener, który zarządza stanem całego widoku, w tym komunikacją między formularzem a listą sugestii. Odpowiada za obsługę wywołań API.
-   **Główne elementy**: `GenerateForm`, `SuggestionsList`, `Toast`.
-   **Obsługiwane interakcje**: Brak bezpośrednich interakcji z użytkownikiem. Komponent orkiestruje przepływ danych.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `CardSuggestionViewModel`, `GenerateCardsCommand`, `SaveGeneratedCardsCommand`.
-   **Propsy**: Brak.

### GenerateForm

-   **Opis komponentu**: Komponent formularza, który zawiera pole tekstowe do wklejenia treści oraz przycisk do uruchomienia procesu generowania fiszek.
-   **Główne elementy**: `Textarea`, `Button`, `Spinner` (wyświetlany warunkowo).
-   **Obsługiwane interakcje**:
    -   Wprowadzanie tekstu w pole `Textarea`.
    -   Kliknięcie przycisku "Generuj".
-   **Obsługiwana walidacja**:
    -   Przycisk "Generuj" jest nieaktywny, jeśli tekst nie spełnia kryterium długości (min. 1000, max. 10000 znaków).
    -   Wyświetlanie komunikatu o błędzie walidacji pod polem tekstowym.
-   **Typy**: Brak specyficznych typów.
-   **Propsy**:
    -   `isLoading: boolean`
    -   `onGenerate: (text: string) => void`

### SuggestionsList

-   **Opis komponentu**: Komponent wyświetlający listę wygenerowanych propozycji fiszek. Umożliwia zapisanie zaakceptowanych kart.
-   **Główne elementy**: Lista komponentów `SuggestionCard`, przycisk "Zapisz wybrane".
-   **Obsługiwane interakcje**:
    -   Kliknięcie przycisku "Zapisz wybrane".
-   **Obsługiwana walidacja**:
    -   Przycisk "Zapisz wybrane" jest nieaktywny, jeśli żadna propozycja nie została zaakceptowana.
-   **Typy**: `CardSuggestionViewModel[]`.
-   **Propsy**:
    -   `suggestions: CardSuggestionViewModel[]`
    -   `onSave: (acceptedCards: CardSuggestionDto[]) => void`
    -   `onUpdateSuggestion: (id: string, updatedSuggestion: Partial<CardSuggestionViewModel>) => void`

### SuggestionCard

-   **Opis komponentu**: Reprezentuje pojedynczą propozycję fiszki na liście. Umożliwia użytkownikowi akceptację, odrzucenie lub edycję propozycji.
-   **Główne elementy**: `Card` (Shadcn/ui), `Button` (do akcji), `Textarea` (do edycji inline).
-   **Obsługiwane interakcje**:
    -   Kliknięcie "Akceptuj": zmienia stan propozycji na zaakceptowany.
    -   Kliknięcie "Odrzuć": zmienia stan propozycji na odrzucony.
    -   Kliknięcie "Edytuj": przełącza kartę w tryb edycji.
    -   Kliknięcie "Zapisz" (w trybie edycji): zapisuje zmiany.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `CardSuggestionViewModel`.
-   **Propsy**:
    -   `suggestion: CardSuggestionViewModel`
    -   `onUpdate: (id: string, updatedSuggestion: Partial<CardSuggestionViewModel>) => void`

## 5. Typy

Do implementacji widoku, oprócz istniejących typów DTO, potrzebny będzie nowy typ `ViewModel`:

-   **`CardSuggestionViewModel`**: Rozszerza `CardSuggestionDto` o dodatkowe pola potrzebne do zarządzania stanem w interfejsie użytkownika.
    -   `id: string` (unikalny identyfikator po stronie klienta, np. UUID)
    -   `front: string` (z `CardSuggestionDto`)
    -   `back: string` (z `CardSuggestionDto`)
    -   `status: 'pending' | 'accepted' | 'rejected'` (do śledzenia decyzji użytkownika)
    -   `isEditing: boolean` (do przełączania trybu edycji)

## 6. Zarządzanie stanem

Stan będzie zarządzany w głównym komponencie `GenerateView` przy użyciu hooka `useState` z Reacta. Rozważone zostanie stworzenie customowego hooka `useGenerateCards` w celu hermetyzacji logiki.

-   **`text: string`**: Przechowuje aktualną zawartość pola tekstowego.
-   **`suggestions: CardSuggestionViewModel[]`**: Lista propozycji fiszek zwróconych przez API, wzbogacona o stan UI.
-   **`isLoading: boolean`**: Flaga informująca o stanie ładowania podczas generowania fiszek.
-   **`error: string | null`**: Przechowuje komunikaty o błędach (walidacja, API).

## 7. Integracja API

Integracja z API będzie realizowana w komponencie `GenerateView` za pomocą funkcji `fetch`.

1.  **Generowanie propozycji**:
    -   **Endpoint**: `POST /api/ai/generate-cards`
    -   **Akcja**: Wywoływane po kliknięciu przycisku "Generuj" w `GenerateForm`.
    -   **Typ żądania**: `GenerateCardsCommand` (`{ text: string }`)
    -   **Typ odpowiedzi**: `GenerateCardsResponseDto` (`{ suggestions: CardSuggestionDto[] }`)
    -   **Obsługa odpowiedzi**: Odpowiedź jest mapowana na `CardSuggestionViewModel[]`, dodając `id`, `status: 'pending'` i `isEditing: false`, a następnie zapisywana w stanie.

2.  **Zapisywanie zaakceptowanych fiszek**:
    -   **Endpoint**: `POST /api/ai/save-generated-cards`
    -   **Akcja**: Wywoływane po kliknięciu "Zapisz wybrane" w `SuggestionsList`.
    -   **Typ żądania**: `SaveGeneratedCardsCommand` (`{ originalText: string, generatedCount: number, acceptedCards: CardSuggestionDto[] }`)
    -   **Typ odpowiedzi**: `SaveGeneratedCardsResponseDto`
    -   **Obsługa odpowiedzi**: Po pomyślnym zapisie wyświetlany jest komunikat `Toast` z informacją o liczbie zapisanych kart, a lista sugestii jest czyszczona.

## 8. Interakcje użytkownika

-   **Wprowadzanie tekstu**: Użytkownik wkleja tekst. Stan `text` jest aktualizowany.
-   **Generowanie fiszek**: Użytkownik klika "Generuj". `isLoading` ustawiane jest na `true`. Wywoływane jest API. Po otrzymaniu odpowiedzi `isLoading` wraca na `false`, a `suggestions` jest aktualizowane.
-   **Akceptacja/Odrzucenie propozycji**: Kliknięcie przycisku na `SuggestionCard` aktualizuje pole `status` w odpowiednim obiekcie `CardSuggestionViewModel`.
-   **Edycja propozycji**: Kliknięcie "Edytuj" ustawia `isEditing` na `true`. Po zmianie tekstu i kliknięciu "Zapisz", stan `front`/`back` jest aktualizowany, a `isEditing` wraca na `false`.
-   **Zapisywanie fiszek**: Użytkownik klika "Zapisz wybrane". Filtrowane są sugestie ze statusem `accepted`, tworzony jest obiekt żądania i wysyłany do API.

## 9. Warunki i walidacja

-   **Formularz generowania (`GenerateForm`)**:
    -   **Warunek**: Długość tekstu w polu `Textarea` musi zawierać się w przedziale od 1000 do 10000 znaków.
    -   **Walidacja**: Sprawdzane na bieżąco po stronie klienta.
    -   **Efekt**: Przycisk "Generuj" jest `disabled`, jeśli warunek nie jest spełniony. Pod polem tekstowym wyświetlany jest komunikat pomocniczy (np. "Wprowadź od 1000 do 10000 znaków").
-   **Lista sugestii (`SuggestionsList`)**:
    -   **Warunek**: Co najmniej jedna propozycja musi mieć status `accepted`.
    -   **Walidacja**: Sprawdzane na podstawie stanu `suggestions`.
    -   **Efekt**: Przycisk "Zapisz wybrane" jest `disabled`, jeśli warunek nie jest spełniony.

## 10. Obsługa błędów

-   **Błąd walidacji (400 Bad Request)** z `generate-cards`: Komunikat o błędzie jest wyświetlany pod polem tekstowym.
-   **Brak autoryzacji (401 Unauthorized)**: Użytkownik jest przekierowywany na stronę logowania.
-   **Zbyt wiele żądań (429 Too Many Requests)**: Wyświetlany jest `Toast` z informacją "Zbyt wiele żądań. Spróbuj ponownie później."
-   **Błąd usługi LLM (503 Service Unavailable)**: Wyświetlany jest `Toast` z komunikatem "Usługa generowania jest tymczasowo niedostępna."
-   **Inne błędy serwera (500 Internal Server Error)**: Wyświetlany jest generyczny `Toast` z komunikatem "Wystąpił nieoczekiwany błąd serwera."

## 11. Kroki implementacji

1.  Utworzenie pliku strony `src/pages/generate.astro` i osadzenie w nim głównego komponentu React `GenerateView`.
2.  Stworzenie struktury plików dla komponentów React: `src/components/views/generate/GenerateView.tsx`, `GenerateForm.tsx`, `SuggestionsList.tsx`, `SuggestionCard.tsx`.
3.  Implementacja komponentu `GenerateForm` z polem `Textarea`, przyciskiem i logiką walidacji długości tekstu.
4.  Implementacja komponentu `SuggestionCard` do wyświetlania pojedynczej propozycji z opcjami akcji (Akceptuj, Odrzuć, Edytuj).
5.  Implementacja komponentu `SuggestionsList`, który renderuje listę `SuggestionCard` i zawiera przycisk "Zapisz wybrane".
6.  Implementacja głównego komponentu `GenerateView`, który zarządza stanem (`text`, `suggestions`, `isLoading`, `error`).
7.  Dodanie w `GenerateView` logiki do obsługi wywołania API `POST /api/ai/generate-cards`, w tym obsługi ładowania i błędów.
8.  Zaimplementowanie logiki aktualizacji stanu sugestii (akceptacja, odrzucenie, edycja) w `GenerateView` i przekazanie funkcji do komponentów podrzędnych.
9.  Dodanie w `GenerateView` logiki do obsługi wywołania API `POST /api/ai/save-generated-cards` po kliknięciu przycisku "Zapisz wybrane".
10. Zintegrowanie komponentu `Toast` (z Shadcn/ui) do wyświetlania powiadomień o sukcesie lub błędach.
11. Przeprowadzenie testów manualnych w celu weryfikacji wszystkich interakcji, walidacji i obsługi błędów zgodnie z wymaganiami.
12. Zapewnienie zgodności z wytycznymi dostępności, m.in. poprzez użycie atrybutów `aria-live` dla dynamicznie zmieniających się treści.
