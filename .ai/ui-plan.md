# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji 10x-cards została zaprojektowana w celu zapewnienia płynnego i intuicyjnego doświadczenia, koncentrując się na głównym zadaniu użytkownika: szybkim tworzeniu i efektywnym uczeniu się fiszek. Aplikacja opiera się na architekturze zorientowanej na komponenty, wykorzystując Astro do renderowania statycznego i React do interaktywnych wysp.

Główny przepływ pracy prowadzi użytkownika od uwierzytelnienia, przez centralny Dashboard, do kluczowej funkcji generowania fiszek za pomocą AI. Po wygenerowaniu, użytkownik w prosty sposób recenzuje, edytuje i akceptuje sugestie, które następnie może przeglądać na dedykowanej liście lub rozpocząć z nimi sesję nauki. Nawigacja jest prosta i spójna, a stany aplikacji (ładowanie, błędy, puste dane) są jasno komunikowane, aby zapewnić przewidywalność i komfort użytkowania.

## 2. Lista widoków

### 1. Widok Uwierzytelnienia
- **Nazwa widoku:** Uwierzytelnienie (Logowanie / Rejestracja)
- **Ścieżka widoku:** `/auth`
- **Główny cel:** Umożliwienie nowym użytkownikom rejestracji, a powracającym zalogowania się do aplikacji (US-001, US-002).
- **Kluczowe informacje do wyświetlenia:** Formularze z polami na e-mail i hasło, przełącznik między logowaniem a rejestracją.
- **Kluczowe komponenty widoku:** `Card`, `Input`, `Button`, `Label`.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Jasne komunikaty o błędach walidacji (np. "Hasło jest za krótkie") wyświetlane inline. Wskaźnik ładowania na przycisku po jego kliknięciu.
  - **Dostępność:** Poprawne etykietowanie pól formularza (`aria-label`), zarządzanie focusem.
  - **Bezpieczeństwo:** Komunikacja z API Supabase odbywa się przez HTTPS. Aplikacja nie przechowuje danych uwierzytelniających po stronie klienta.

### 2. Widok Dashboardu
- **Nazwa widoku:** Dashboard
- **Ścieżka widoku:** `/` (po zalogowaniu)
- **Główny cel:** Służy jako centralny punkt nawigacyjny i zapewnia szybki przegląd kluczowych informacji.
- **Kluczowe informacje do wyświetlenia:** Podstawowe statystyki (np. łączna liczba fiszek, liczba fiszek do powtórki dzisiaj), szybkie linki do głównych sekcji ("Generuj fiszki", "Moje fiszki", "Rozpocznij sesję nauki").
- **Kluczowe komponenty widoku:** `Card` (do statystyk), `Button` (do nawigacji).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Wyświetlanie komponentów `Skeleton` podczas ładowania danych statystycznych.
  - **Dostępność:** Użycie nagłówków do strukturyzacji strony, semantyczne linki nawigacyjne.
  - **Bezpieczeństwo:** Wszystkie dane pobierane są w kontekście zalogowanego użytkownika.

### 3. Widok Generowania Fiszek AI
- **Nazwa widoku:** Generuj Fiszki
- **Ścieżka widoku:** `/generate`
- **Główny cel:** Umożliwienie użytkownikowi wklejenia tekstu i wygenerowania propozycji fiszek przez AI (US-003), a następnie ich przegląd i akceptacja (US-004).
- **Kluczowe informacje do wyświetlenia:** Pole tekstowe na treść, lista wygenerowanych propozycji fiszek z opcjami akcji.
- **Kluczowe komponenty widoku:** `Textarea`, `Button`, `Card` (dla każdej propozycji), `Spinner`, `Toast` (do powiadomień).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Stan ładowania po kliknięciu "Generuj". Propozycje pojawiają się na liście, każda z opcją "Akceptuj", "Edytuj" (inline) i "Odrzuć". Przycisk "Zapisz wybrane" jest nieaktywny, dopóki co najmniej jedna fiszka nie zostanie zaakceptowana.
  - **Dostępność:** Komunikowanie stanu ładowania za pomocą `aria-live` regions. Zapewnienie, że interaktywne elementy na liście propozycji są dostępne z klawiatury.
  - **Bezpieczeństwo:** Walidacja długości tekstu po stronie klienta i serwera.

### 4. Widok "Moje Fiszki"
- **Nazwa widoku:** Moje Fiszki
- **Ścieżka widoku:** `/cards`
- **Główny cel:** Wyświetlanie, zarządzanie, edycja i usuwanie wszystkich fiszek użytkownika (US-005, US-006, US-007).
- **Kluczowe informacje do wyświetlenia:** Tabela z fiszkami (przód, tył, data utworzenia), opcje filtrowania i sortowania, paginacja.
- **Kluczowe komponenty widoku:** `Table`, `Button`, `Dialog` (do edycji i dodawania nowej fiszki), `DropdownMenu` (dla akcji przy wierszu).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Optymistyczne UI przy usuwaniu fiszki (element natychmiast znika z listy, z opcją cofnięcia przez `Toast`). Edycja odbywa się w modalu, aby nie tracić kontekstu listy.
  - **Dostępność:** Tabela jest responsywna i dostępna. Przyciski i kontrolki mają odpowiednie etykiety ARIA.
  - **Bezpieczeństwo:** Wszystkie operacje (odczyt, zapis, usunięcie) są autoryzowane na poziomie API i bazy danych (RLS).

### 5. Widok Sesji Nauki
- **Nazwa widoku:** Sesja Nauki
- **Ścieżka widoku:** `/study`
- **Główny cel:** Przeprowadzenie użytkownika przez sesję nauki opartą na algorytmie spaced repetition (US-008).
- **Kluczowe informacje do wyświetlenia:** Jedna fiszka na raz (najpierw przód), przyciski do oceny odpowiedzi (np. "Źle", "Dobrze", "Idealnie").
- **Kluczowe komponenty widoku:** `Card` (z animacją odwracania), `Button` (do oceny).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Płynna animacja odwracania karty po kliknięciu. Jasne wskazanie postępu w sesji (np. "Karta 5 z 20").
  - **Dostępność:** Możliwość nawigacji i obsługi sesji za pomocą klawiatury. Treść fiszki jest dostępna dla czytników ekranu.
  - **Bezpieczeństwo:** Identyfikatory kart i oceny są walidowane po stronie serwera.

### 6. Widok Ustawień Użytkownika
- **Nazwa widoku:** Ustawienia
- **Ścieżka widoku:** `/settings`
- **Główny cel:** Umożliwienie użytkownikowi zarządzania swoim kontem, w tym jego usunięcia.
- **Kluczowe informacje do wyświetlenia:** Adres e-mail użytkownika, przycisk "Usuń konto".
- **Kluczowe komponenty widoku:** `Button`, `Dialog` (do potwierdzenia usunięcia konta).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Krytyczna akcja usunięcia konta wymaga dodatkowego potwierdzenia w modalu.
  - **Dostępność:** Przycisk i dialog są w pełni dostępne.
  - **Bezpieczeństwo:** Usunięcie konta jest operacją nieodwracalną i wymaga potwierdzenia hasłem.

## 3. Mapa podróży użytkownika

Główny przepływ pracy (generowanie fiszek z AI):
1.  **Start:** Użytkownik ląduje na stronie `/auth` i loguje się.
2.  **Przekierowanie:** Po pomyślnym zalogowaniu zostaje przekierowany na `/` (Dashboard).
3.  **Nawigacja:** Na Dashboardzie klika przycisk "Generuj fiszki".
4.  **Generowanie:** Użytkownik przechodzi na stronę `/generate`, wkleja tekst w `Textarea` i klika "Generuj".
5.  **Recenzja:** Pod polem tekstowym pojawia się lista propozycji fiszek. Użytkownik przegląda je, edytuje niektóre inline, akceptuje te, które mu odpowiadają, i odrzuca resztę.
6.  **Zapis:** Użytkownik klika "Zapisz zaakceptowane fiszki". Aplikacja wysyła żądanie do `POST /api/ai/save-generated-cards`.
7.  **Potwierdzenie:** Użytkownik otrzymuje powiadomienie (`Toast`) o pomyślnym zapisaniu fiszek.
8.  **Dalsze kroki:** Użytkownik może teraz przejść do `/cards`, aby zobaczyć nowo dodane fiszki na liście, lub do `/study`, aby rozpocząć sesję nauki.

## 4. Układ i struktura nawigacji

Aplikacja będzie miała prosty i spójny układ.
- **Główny układ (Layout):** Składa się z nagłówka (Header) i obszaru na treść strony.
- **Nagłówek:** Zawiera logo aplikacji oraz główną nawigację.
- **Nawigacja główna:** Będzie widoczna po zalogowaniu i umieszczona w nagłówku. Będzie zawierać linki do:
  - Dashboard (`/`)
  - Generuj Fiszki (`/generate`)
  - Moje Fiszki (`/cards`)
  - Sesja Nauki (`/study`)
- **Menu użytkownika:** W prawym rogu nagłówka znajdzie się ikona użytkownika z rozwijanym menu (`DropdownMenu`) zawierającym link do "Ustawień" (`/settings`) oraz opcję "Wyloguj".
- **Przejścia:** Astro View Transitions zostaną zaimplementowane, aby zapewnić płynne przejścia między stronami.

## 5. Kluczowe komponenty

Poniższe komponenty (głównie z biblioteki Shadcn/ui) będą reużywalne w całej aplikacji:
- **`Card`:** Uniwersalny kontener do wyświetlania treści, np. statystyk na dashboardzie, propozycji fiszek, pojedynczej fiszki w sesji nauki.
- **`Button`:** Standardowy przycisk do wywoływania akcji. Będzie obsługiwał stany ładowania (wyświetlając `Spinner`).
- **`Input` & `Textarea`:** Pola formularzy do wprowadzania danych.
- **`Table`:** Do wyświetlania listy fiszek w widoku "Moje Fiszki".
- **`Dialog`:** Modal używany do edycji/tworzenia fiszek oraz do potwierdzania krytycznych akcji (np. usunięcie konta).
- **`Toast`:** Do wyświetlania krótkich, nieblokujących powiadomień (np. "Fiszka usunięta", "Zapisano pomyślnie").
- **`Skeleton`:** Komponent zastępczy wyświetlany podczas ładowania danych, poprawiający postrzeganą wydajność.
- **`Spinner`:** Wskaźnik ładowania używany wewnątrz przycisków lub jako samodzielny element.
