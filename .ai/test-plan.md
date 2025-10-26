
# Plan Testów dla Projektu "AI Flashcards"

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie
Niniejszy dokument opisuje plan testów dla aplikacji "AI Flashcards", której celem jest umożliwienie użytkownikom tworzenia i zarządzania fiszkami, w tym generowania ich z pomocą sztucznej inteligencji. Plan obejmuje strategię, zakres, zasoby i harmonogram działań testowych mających na celu zapewnienie wysokiej jakości, bezpieczeństwa i niezawodności aplikacji.

### 1.2. Cele testowania
- **Weryfikacja funkcjonalna**: Upewnienie się, że wszystkie funkcje aplikacji działają zgodnie z wymaganiami.
- **Zapewnienie bezpieczeństwa**: Sprawdzenie, czy dane użytkowników są odpowiednio chronione, a aplikacja jest odporna na podstawowe ataki.
- **Ocena wydajności**: Weryfikacja, czy aplikacja działa płynnie i responsywnie pod oczekiwanym obciążeniem.
- **Zapewnienie użyteczności (UX)**: Sprawdzenie, czy interfejs użytkownika jest intuicyjny, spójny i przyjazny.
- **Wykrycie i raportowanie błędów**: Identyfikacja, dokumentacja i śledzenie defektów w celu ich naprawy przed wdrożeniem produkcyjnym.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami
- Moduł autentykacji (rejestracja, logowanie, wylogowywanie, reset hasła).
- Zarządzanie fiszkami (tworzenie, odczyt, aktualizacja, usuwanie - CRUD).
- Moduł generowania fiszek przy użyciu AI.
- Zapisywanie fiszek wygenerowanych przez AI.
- Paginacja i filtrowanie w widoku listy fiszek.
- Ochrona dostępu do danych (użytkownik ma dostęp tylko do swoich fiszek).

### 2.2. Funkcjonalności wyłączone z testów
- Testy obciążeniowe zewnętrznego API (OpenRouter.ai).
- Testy wewnętrznej infrastruktury Supabase.

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe (Unit Tests)**: Weryfikacja pojedynczych komponentów React, funkcji pomocniczych (`/src/lib/utils.ts`) i logiki w serwisach (`/src/lib/*.service.ts`).
- **Testy integracyjne (Integration Tests)**: Sprawdzanie współpracy między komponentami oraz integracji z API Astro i bazą danych Supabase. Testowanie endpointów API i ich interakcji z serwisami.
- **Testy End-to-End (E2E)**: Symulacja pełnych scenariuszy użytkownika w przeglądarce, weryfikująca kluczowe ścieżki (np. od rejestracji po wygenerowanie i zapisanie fiszki).
- **Testy bezpieczeństwa (Security Tests)**: Weryfikacja polityk Row Level Security (RLS) w Supabase, ochrona endpointów API, walidacja danych wejściowych.
- **Testy regresji wizualnej (Visual Regression Tests)**: Automatyczne porównywanie zrzutów ekranu UI w celu wykrycia niezamierzonych zmian wizualnych.
- **Testy manualne (Manual Testing)**: Eksploracyjne testowanie aplikacji w celu znalezienia błędów, które mogły zostać pominięte w testach automatycznych.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Autentykacja
- **TC-AUTH-01**: Użytkownik może pomyślnie zarejestrować się przy użyciu poprawnych danych.
- **TC-AUTH-02**: System uniemożliwia rejestrację z już istniejącym adresem e-mail.
- **TC-AUTH-03**: Użytkownik może pomyślnie zalogować się przy użyciu poprawnych danych.
- **TC-AUTH-04**: Użytkownik nie może zalogować się przy użyciu błędnych danych.
- **TC-AUTH-05**: Zalogowany użytkownik może się wylogować.
- **TC-AUTH-06**: Niezalogowany użytkownik nie ma dostępu do stron chronionych (np. `/cards`, `/generate`).

### 4.2. Zarządzanie fiszkami (CRUD)
- **TC-CARDS-01**: Zalogowany użytkownik może utworzyć nową fiszkę.
- **TC-CARDS-02**: Użytkownik widzi na liście tylko swoje fiszki.
- **TC-CARDS-03**: Użytkownik może edytować swoją fiszkę.
- **TC-CARDS-04**: Użytkownik może usunąć swoją fiszkę.
- **TC-CARDS-05**: Użytkownik nie może edytować ani usunąć fiszki innego użytkownika (np. przez próbę bezpośredniego wywołania API).

### 4.3. Generowanie fiszek AI
- **TC-GEN-01**: Użytkownik może wygenerować sugestie fiszek na podstawie podanego tematu i liczby.
- **TC-GEN-02**: System poprawnie obsługuje błędy zwracane przez API AI (np. przekroczenie limitu, błąd serwera).
- **TC-GEN-03**: Użytkownik może wybrać i zapisać wygenerowane fiszki na swoim koncie.
- **TC-GEN-04**: Endpoint generujący fiszki jest chroniony przed nadużyciami (rate limiting).

## 5. Środowisko testowe

- **Baza danych**: Dedykowana, odizolowana instancja bazy danych Supabase na potrzeby testów automatycznych, resetowana przed każdym cyklem testowym.
- **API Zewnętrzne**: Klucz API do OpenRouter.ai z ustawionymi niskimi limitami kosztów, używany tylko w testach E2E. W pozostałych testach API będzie mockowane.
- **Przeglądarki**: Testy E2E będą uruchamiane na najnowszych wersjach Chrome i Firefox.
- **System CI/CD**: Testy automatyczne będą uruchamiane w ramach pipeline'u GitHub Actions przy każdym pushu do repozytorium oraz przed każdym wdrożeniem.

## 6. Narzędzia do testowania

- **Framework do testów jednostkowych i integracyjnych**: Vitest z React Testing Library.
- **Framework do testów E2E**: Playwright.
- **Mockowanie API**: `msw` (Mock Service Worker) do mockowania API Supabase i OpenRouter.
- **Zarządzanie bazą testową**: Skrypty `supabase-cli` do resetowania bazy danych.
- **CI/CD**: GitHub Actions.

## 7. Harmonogram testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania.
- **Sprint 1-2**: Implementacja i konfiguracja narzędzi testowych. Pisanie testów jednostkowych i integracyjnych dla logiki biznesowej i komponentów.
- **Sprint 3-4**: Rozwój testów E2E dla kluczowych ścieżek użytkownika. Implementacja testów bezpieczeństwa dla RLS.
- **Przed każdym wdrożeniem**: Pełny cykl testów regresji (jednostkowe, integracyjne, E2E).
- **Ciągle**: Testy eksploracyjne i dodawanie nowych testów dla nowo tworzonych funkcjonalności.

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia (rozpoczęcia testów)
- Kod został pomyślnie zintegrowany z główną gałęzią.
- Aplikacja została pomyślnie zbudowana i wdrożona na środowisku testowym.

### 8.2. Kryteria wyjścia (zakończenia testów)
- 100% testów automatycznych (jednostkowych, integracyjnych, E2E) zakończyło się sukcesem.
- Pokrycie kodu testami jednostkowymi i integracyjnymi wynosi co najmniej 80%.
- Wszystkie zidentyfikowane błędy krytyczne (P0) i wysokie (P1) zostały naprawione i zweryfikowane.
- Brak znanych błędów regresji w kluczowych funkcjonalnościach.

## 9. Role i odpowiedzialności

- **Deweloperzy**: Odpowiedzialni za pisanie testów jednostkowych i integracyjnych dla swojego kodu. Naprawa błędów zgłoszonych przez QA.
- **Inżynier QA**: Odpowiedzialny za tworzenie i utrzymanie planu testów, rozwój testów E2E, przeprowadzanie testów manualnych i eksploracyjnych, zarządzanie procesem raportowania błędów.
- **Product Owner**: Odpowiedzialny za priorytetyzację błędów i akceptację funkcjonalności po pomyślnym przejściu testów.

## 10. Procedury raportowania błędów

1.  **Zgłaszanie błędów**: Każdy znaleziony błąd musi zostać zgłoszony jako "Issue" w repozytorium GitHub projektu.
2.  **Format zgłoszenia**: Zgłoszenie musi zawierać:
    - Tytuł: Krótki, zwięzły opis problemu.
    - Opis: Szczegółowy opis błędu.
    - Kroki do reprodukcji: Ponumerowana lista kroków potrzebnych do odtworzenia błędu.
    - Oczekiwany rezultat: Co powinno się stać.
    - Rzeczywisty rezultat: Co się stało.
    - Środowisko: Wersja przeglądarki, system operacyjny.
    - Załączniki: Zrzuty ekranu, nagrania wideo, logi z konsoli.
    - Priorytet: P0 (krytyczny), P1 (wysoki), P2 (średni), P3 (niski).
3.  **Cykl życia błędu**:
    - `Open`: Nowo zgłoszony błąd.
    - `In Progress`: Błąd jest w trakcie naprawy.
    - `Ready for QA`: Błąd został naprawiony i jest gotowy do weryfikacji.
    - `Closed`: Błąd został zweryfikowany i zamknięty.
    - `Reopened`: Błąd nie został poprawnie naprawiony.
