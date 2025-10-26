# Plan implementacji widoku Moje Fiszki

## 1. Przegląd
Widok "Moje Fiszki" jest centralnym miejscem do zarządzania fiszkami edukacyjnymi użytkownika. Umożliwia on wyświetlanie, tworzenie, edytowanie i usuwanie fiszek. Widok integruje się z API w celu zapewnienia spójności danych i obsługuje paginację, sortowanie oraz filtrowanie, aby ułatwić nawigację po dużej liczbie fiszek.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/cards`. Należy utworzyć nowy plik strony Astro `src/pages/cards.astro`, który będzie renderował główny komponent React.

## 3. Struktura komponentów
Hierarchia komponentów została zaprojektowana w celu oddzielenia logiki biznesowej od prezentacji.

```
src/pages/cards.astro
└── src/components/views/cards/CardsView.tsx (Komponent główny)
    ├── src/components/views/cards/CardsTable.tsx (Tabela z listą fiszek)
    │   └── src/components/views/cards/DataTableRowActions.tsx (Menu akcji dla wiersza)
    ├── src/components/views/cards/CardFormDialog.tsx (Modal do tworzenia/edycji fiszki)
    └── src/components/views/cards/DeleteConfirmationDialog.tsx (Modal potwierdzenia usunięcia)
```

## 4. Szczegóły komponentów

### `CardsView.tsx`
- **Opis komponentu:** Główny komponent orkiestrujący, odpowiedzialny za pobieranie danych, zarządzanie stanem (fiszki, paginacja, filtry, stan ładowania) oraz obsługę logiki biznesowej.
- **Główne elementy:** Wykorzystuje `CardsTable` do wyświetlania danych oraz `CardFormDialog` i `DeleteConfirmationDialog` do interakcji z użytkownikiem. Zawiera przycisk "Dodaj fiszkę".
- **Obsługiwane interakcje:**
  - Otwarcie modala dodawania nowej fiszki.
  - Otwarcie modala edycji po otrzymaniu zdarzenia z `DataTableRowActions`.
  - Otwarcie modala potwierdzenia usunięcia po otrzymaniu zdarzenia z `DataTableRowActions`.
  - Zmiana strony w paginacji.
  - Zmiana sortowania i filtrowania.
- **Warunki walidacji:** Brak bezpośredniej walidacji; przekazuje logikę do komponentów podrzędnych.
- **Typy:** `CardDto`, `GetCardsResponseDto`, `CardsViewModel`.
- **Propsy:** Brak.

### `CardsTable.tsx`
- **Opis komponentu:** Komponent prezentacyjny, który renderuje tabelę z fiszkami przy użyciu komponentów `Table` z biblioteki `shadcn/ui`.
- **Główne elementy:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead`. W ostatniej kolumnie renderuje komponent `DataTableRowActions`.
- **Obsługiwane interakcje:** Brak; deleguje obsługę zdarzeń do `DataTableRowActions`.
- **Warunki walidacji:** Brak.
- **Typy:** `CardDto`, `GetCardsResponseDto["pagination"]`.
- **Propsy:**
  - `cards: CardDto[]`: Lista fiszek do wyświetlenia.
  - `pagination: GetCardsResponseDto["pagination"]`: Dane do obsługi paginacji.
  - `onEdit: (card: CardDto) => void`: Funkcja zwrotna wywoływana przy edycji.
  - `onDelete: (cardId: string) => void`: Funkcja zwrotna wywoływana przy usuwaniu.

### `DataTableRowActions.tsx`
- **Opis komponentu:** Komponent osadzony w wierszu tabeli, zawierający menu kontekstowe dla poszczególnych fiszek.
- **Główne elementy:** `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` z `shadcn/ui`.
- **Obsługiwane interakcje:**
  - Kliknięcie opcji "Edytuj" wywołuje `onEdit`.
  - Kliknięcie opcji "Usuń" wywołuje `onDelete`.
- **Warunki walidacji:** Brak.
- **Typy:** `CardDto`.
- **Propsy:**
  - `card: CardDto`: Obiekt fiszki, której dotyczy menu.
  - `onEdit: (card: CardDto) => void`: Funkcja zwrotna.
  - `onDelete: (cardId: string) => void`: Funkcja zwrotna.

### `CardFormDialog.tsx`
- **Opis komponentu:** Modal z formularzem do tworzenia lub edycji fiszki. Działa w dwóch trybach: "create" i "edit".
- **Główne elementy:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `Form`, `FormField`, `Input`, `Textarea`, `Button` z `shadcn/ui`.
- **Obsługiwane interakcje:**
  - Wypełnianie pól formularza.
  - Przesłanie formularza (`onSubmit`).
  - Zamknięcie modala.
- **Warunki walidacji:**
  - `front`: Wymagane, minimum 1 znak, maksimum 200 znaków.
  - `back`: Wymagane, minimum 1 znak, maksimum 500 znaków.
  Walidacja realizowana przy użyciu `zod` i `react-hook-form` na podstawie `CreateCardDtoSchema` i `UpdateCardCommand`.
- **Typy:** `CreateCardDto`, `UpdateCardCommand`, `CardDto`.
- **Propsy:**
  - `isOpen: boolean`: Kontroluje widoczność modala.
  - `onOpenChange: (isOpen: boolean) => void`: Funkcja zwrotna przy zmianie stanu modala.
  - `onSubmit: (data: CreateCardDto | UpdateCardCommand) => void`: Funkcja zwrotna po pomyślnym przesłaniu formularza.
  - `cardToEdit?: CardDto`: Opcjonalny obiekt fiszki do edycji. Jeśli nie zostanie podany, formularz działa w trybie tworzenia.

### `DeleteConfirmationDialog.tsx`
- **Opis komponentu:** Prosty modal do potwierdzenia operacji usunięcia fiszki.
- **Główne elementy:** `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` z `shadcn/ui`.
- **Obsługiwane interakcje:**
  - Potwierdzenie usunięcia (`onConfirm`).
  - Anulowanie operacji.
- **Warunki walidacji:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `isOpen: boolean`: Kontroluje widoczność modala.
  - `onOpenChange: (isOpen: boolean) => void`: Funkcja zwrotna.
  - `onConfirm: () => void`: Funkcja zwrotna wywoływana po potwierdzeniu.

## 5. Typy
Do implementacji widoku wymagane będą istniejące typy DTO oraz nowy typ `CardsViewModel`.

- **`CardDto`**: (istniejący) Używany do wyświetlania danych fiszki w tabeli.
- **`CreateCardDto`**: (istniejący) Używany jako kontrakt danych dla formularza tworzenia nowej fiszki.
- **`UpdateCardCommand`**: (istniejący) Używany jako kontrakt danych dla formularza edycji fiszki.
- **`GetCardsResponseDto`**: (istniejący) Definiuje strukturę odpowiedzi z API dla listy fiszek, w tym dane paginacji.
- **`CardsViewModel`**: (nowy) Obiekt stanu dla głównego komponentu `CardsView`.
  ```typescript
  interface CardsViewModel {
    cards: CardDto[];
    pagination: GetCardsResponseDto["pagination"];
    isLoading: boolean;
    error: string | null;
    filters: {
      page: number;
      pageSize: number;
      source?: "manual" | "ai";
      sortBy: string;
      order: "asc" | "desc";
    };
    dialogs: {
      editCard: CardDto | null; // null -> tryb 'create', obiekt -> tryb 'edit'
      deleteCardId: string | null;
    };
  }
  ```

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie w komponencie `CardsView.tsx` przy użyciu hooka `useState` lub `useReducer` dla bardziej złożonej logiki. Nie ma potrzeby tworzenia globalnego stanu ani customowego hooka w początkowej fazie, jednak można go wprowadzić (`useCards`) w przyszłości w celu hermetyzacji logiki.

Główny obiekt stanu będzie zgodny z typem `CardsViewModel` i będzie przechowywał:
- Listę fiszek i dane paginacji.
- Stan ładowania i błędu.
- Aktywne filtry i parametry sortowania.
- Stan otwartych okien dialogowych i dane potrzebne do ich działania (np. fiszka do edycji).

## 7. Integracja API
Komponent `CardsView` będzie odpowiedzialny za komunikację z API.

- **`GET /api/cards`**:
  - **Akcja:** Pobieranie listy fiszek przy pierwszym renderowaniu oraz przy zmianie filtrów, sortowania lub paginacji.
  - **Parametry zapytania:** `page`, `pageSize`, `source`, `sortBy`, `order` (z obiektu `filters` w stanie).
  - **Typ odpowiedzi:** `GetCardsResponseDto`.
  - **Obsługa:** Zaktualizowanie stanu `cards` i `pagination`.

- **`POST /api/cards`**:
  - **Akcja:** Tworzenie nowej fiszki po przesłaniu formularza w `CardFormDialog`.
  - **Typ żądania:** `CreateCardDto`.
  - **Typ odpowiedzi:** `Card`.
  - **Obsługa:** Po sukcesie, odświeżenie listy fiszek (ponowne wywołanie `GET /api/cards`) i wyświetlenie powiadomienia (`Toast`).

- **`PATCH /api/cards/{id}`**:
  - **Akcja:** Aktualizacja istniejącej fiszki po przesłaniu formularza w `CardFormDialog`.
  - **Typ żądania:** `UpdateCardCommand`.
  - **Typ odpowiedzi:** `Card`.
  - **Obsługa:** Po sukcesie, zaktualizowanie fiszki na liście (optymistyczne UI lub odświeżenie) i wyświetlenie powiadomienia.

- **`DELETE /api/cards/{id}`**:
  - **Akcja:** Usunięcie fiszki po potwierdzeniu w `DeleteConfirmationDialog`.
  - **Obsługa:** Optymistyczne UI: natychmiastowe usunięcie fiszki z lokalnego stanu i wyświetlenie `Toast` z opcją cofnięcia. W przypadku błędu przywrócenie fiszki na listę.

## 8. Interakcje użytkownika
- **Dodawanie fiszki:** Użytkownik klika "Dodaj fiszkę", co otwiera `CardFormDialog`. Po wypełnieniu i zatwierdzeniu formularza, fiszka jest dodawana do bazy, a lista zostaje odświeżona.
- **Edycja fiszki:** Użytkownik klika "Edytuj" w menu wiersza, co otwiera `CardFormDialog` z wypełnionymi danymi. Po zatwierdzeniu zmian, dane są aktualizowane.
- **Usuwanie fiszki:** Użytkownik klika "Usuń" w menu wiersza, co otwiera `DeleteConfirmationDialog`. Po potwierdzeniu, fiszka znika z listy (optymistyczne UI).
- **Paginacja:** Użytkownik klika przyciski paginacji, co powoduje ponowne pobranie danych dla nowej strony.

## 9. Warunki i walidacja
Walidacja danych wejściowych odbywa się w komponencie `CardFormDialog` przed wysłaniem żądania do API.
- **Pola `front` i `back`:** Muszą być niepuste.
- **Długość pól:** `front` do 200 znaków, `back` do 500 znaków.
- **Komunikaty o błędach:** Wyświetlane są pod odpowiednimi polami formularza.
- **Stan przycisku:** Przycisk "Zapisz" jest nieaktywny, dopóki formularz nie przejdzie walidacji.

## 10. Obsługa błędów
- **Błędy API:** W przypadku niepowodzenia żądania (np. błąd serwera 500, brak autoryzacji 401), użytkownikowi zostanie wyświetlony globalny komunikat o błędzie (np. za pomocą `Toast` z `sonner`).
- **Błędy walidacji:** Obsługiwane lokalnie w formularzu, jak opisano powyżej.
- **Brak danych:** Jeśli lista fiszek jest pusta, tabela powinna wyświetlić komunikat "Nie znaleziono żadnych fiszek. Dodaj swoją pierwszą fiszkę!".
- **Optymistyczne UI:** W przypadku błędu serwera po optymistycznym usunięciu, fiszka jest przywracana na listę, a użytkownik otrzymuje stosowne powiadomienie.

## 11. Kroki implementacji
1. **Utworzenie struktury plików:** Stwórz plik `src/pages/cards.astro` oraz wszystkie wymagane komponenty React w katalogu `src/components/views/cards/`.
2. **Implementacja strony Astro:** W `cards.astro` zaimportuj i wyrenderuj główny komponent `CardsView.tsx`, przekazując mu `client:load`.
3. **Implementacja `CardsView.tsx`:** Zaimplementuj logikę pobierania danych z `GET /api/cards` przy użyciu `useEffect`. Zdefiniuj stan `CardsViewModel`.
4. **Implementacja `CardsTable.tsx` i `DataTableRowActions.tsx`:** Stwórz komponenty do wyświetlania danych. Połącz akcje z `DataTableRowActions` z funkcjami zwrotnymi w `CardsView`.
5. **Implementacja `CardFormDialog.tsx`:** Zbuduj formularz z walidacją `zod` i `react-hook-form`. Obsłuż tryby "create" i "edit". Połącz `onSubmit` z logiką wysyłania żądań `POST` i `PATCH` w `CardsView`.
6. **Implementacja `DeleteConfirmationDialog.tsx`:** Stwórz modal potwierdzenia i połącz go z logiką usuwania w `CardsView`, implementując optymistyczne UI.
7. **Integracja API:** Zaimplementuj wszystkie wywołania API (`fetch`) w `CardsView` i powiąż je z odpowiednimi interakcjami użytkownika.
8. **Obsługa stanu i błędów:** Dodaj obsługę stanów ładowania (np. wyświetlanie spinnera) i błędów (wyświetlanie `Toast`).
9. **Stylowanie i dostępność:** Dopracuj wygląd widoku za pomocą Tailwind CSS i upewnij się, że wszystkie interaktywne elementy mają odpowiednie atrybuty ARIA.
10. **Testowanie manualne:** Przetestuj wszystkie historyjki użytkownika (US-005, US-006, US-007), weryfikując działanie dodawania, edycji, usuwania, paginacji i obsługi błędów.
