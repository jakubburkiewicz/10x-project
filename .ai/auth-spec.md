# Specyfikacja Techniczna: Modul Autentykacji Uzytkownikow

Data: 25.10.2025
Autor: GitHub Copilot

## 1. Wprowadzenie

Niniejszy dokument opisuje architekture i szczegoly implementacyjne modulu rejestracji, logowania i odzyskiwania hasla dla aplikacji 10x-cards. Rozwiazanie bazuje na wymaganiach zdefiniowanych w PRD (US-001, US-002) oraz na przyjetym stacku technologicznym (Astro, React, Supabase).

Celem jest stworzenie bezpiecznego i spojnego systemu uwierzytelniania, ktory integruje sie z istniejaca struktura aplikacji, wykorzystujac renderowanie po stronie serwera (SSR) w Astro oraz uslugi Supabase Auth.

---

## 2. ARCHITEKTURA INTERFEJSU UZYTKOWNIKA

### 2.1. Nowe strony Astro (`src/pages`)

Wprowadzone zostana nowe strony odpowiedzialne za obsluge procesow autentykacji. Beda to strony Astro, ktore renderuja interaktywne komponenty React.

- **`/login.astro`**: Strona logowania.
    - Bedzie renderowac komponent `LoginForm.tsx`.
    - Dostepna dla niezalogowanych uzytkownikow. Zalogowani uzytkownicy probujacy uzyskac do niej dostep zostana przekierowani do `/generate`.
- **`/register.astro`**: Strona rejestracji.
    - Bedzie renderowac komponent `RegisterForm.tsx`.
    - Dostepna dla niezalogowanych uzytkownikow. Zalogowani uzytkownicy zostana przekierowani do `/generate`.
- **`/forgot-password.astro`**: Strona do inicjowania procesu odzyskiwania hasla.
    - Bedzie renderowac komponent `ForgotPasswordForm.tsx`.
- **`/update-password.astro`**: Strona do ustawiania nowego hasla (dostepna z linku w mailu).
    - Bedzie renderowac komponent `UpdatePasswordForm.tsx`.
- **`/auth/callback.astro`**: Strona techniczna, ktora bedzie obslugiwac callback od Supabase po potwierdzeniu rejestracji przez e-mail. Jej zadaniem bedzie obsluga sesji i przekierowanie uzytkownika do `/generate`.

### 2.2. Nowe komponenty React (`src/components/auth`)

Interaktywne formularze zostana zaimplementowane jako komponenty React, co pozwoli na dynamiczna walidacje po stronie klienta i obsluge stanu formularza.

- **`LoginForm.tsx`**:
    - Zawiera pola na e-mail i haslo oraz przycisk "Zaloguj sie".
    - Wykorzysta biblioteke `zod` do walidacji po stronie klienta (sprawdzenie formatu e-mail, minimalna dlugosc hasla).
    - Po submisji wysyla zapytanie `POST` do endpointu `/api/auth/login`.
    - Obsluguje stany ladowania (np. blokujac przycisk i pokazujac `Spinner`) oraz bledy zwracane z API (np. "Nieprawidlowe dane logowania").
- **`RegisterForm.tsx`**:
    - Zawiera pola na e-mail, haslo i powtorzenie hasla.
    - Walidacja `zod` po stronie klienta (zgodnosc hasel, format e-mail).
    - Po submisji wysyla zapytanie `POST` do `/api/auth/register`.
    - Po pomyslnej rejestracji wyswietla komunikat o koniecznosci potwierdzenia adresu e-mail.
- **`ForgotPasswordForm.tsx`**:
    - Zawiera pole na e-mail.
    - Po submisji wysyla zapytanie `POST` do `/api/auth/forgot-password`.
    - Wyswietla komunikat o wyslaniu linku do resetu hasla.
- **`UpdatePasswordForm.tsx`**:
    - Zawiera pola na nowe haslo i jego powtorzenie.
    - Po submisji wysyla zapytanie `POST` do `/api/auth/update-password`.

### 2.3. Modyfikacje w `Layout.astro` (`src/layouts`)

Glowny layout aplikacji zostanie zaktualizowany, aby dynamicznie renderowac elementy w zaleznosci od statusu zalogowania uzytkownika.

- **Sprawdzanie sesji**: `Layout.astro` bedzie sprawdzal, czy `Astro.locals.user` istnieje (dane dostarczone przez middleware).
- **Nawigacja warunkowa**:
    - **Tryb non-auth**: W naglowku widoczne beda przyciski "Zaloguj sie" (link do `/login`) i "Zarejestruj sie" (link do `/register`).
    - **Tryb auth**: W naglowku widoczny bedzie adres e-mail zalogowanego uzytkownika oraz przycisk/link "Wyloguj sie".
- **Przycisk "Wyloguj sie"**: Bedzie to formularz `POST` wskazujacy na endpoint `/api/auth/logout`, co zapewni bezpieczne wylogowanie bez uzycia metody `GET`.

### 2.4. Scenariusze i obsluga bledow

- **Walidacja**: Komunikaty o bledach walidacji (np. "Hasla nie sa zgodne", "Nieprawidlowy format e-mail") beda wyswietlane pod odpowiednimi polami formularzy. Komponenty React beda zarzadzac stanem bledow.
- **Bledy API**: Bledy serwera (np. "Uzytkownik o tym adresie e-mail juz istnieje", "Limit zapytan przekroczony") beda wyswietlane jako ogolny komunikat bledu dla formularza, np. przy uzyciu komponentu `Sonner`.
- **Przekierowania**: Po pomyslnym logowaniu lub rejestracji (po potwierdzeniu e-mail), uzytkownik zostanie automatycznie przekierowany do strony `/generate`.

---

## 3. LOGIKA BACKENDOWA

Logika backendowa zostanie zrealizowana z wykorzystaniem Astro API Routes oraz middleware, zgodnie z trybem `output: "server"`.

### 3.1. Middleware (`src/middleware/index.ts`)

Middleware bedzie kluczowym elementem systemu, wykonujacym sie przed kazdym zapytaniem.

- **Inicjalizacja Supabase**: Stworzy instancje klienta Supabase dla kazdego zapytania, uzywajac `createSupabaseClient` z pakietu `@supabase/ssr`. Klient bedzie uzywal cookies z zapytania do zarzadzania sesja.
- **Zarzadzanie sesja**: Odczyta token JWT z cookies i zweryfikuje go po stronie serwera. Dane zalogowanego uzytkownika (`session` i `user`) zostana dolaczone do `context.locals`.
- **Ochrona scierzek**:
    - Sprawdzi, czy uzytkownik probuje uzyskac dostep do chronionej strony (np. `/generate`, `/api/ai/*`).
    - Jesli uzytkownik nie jest zalogowany (`!context.locals.user`), zostanie przekierowany na strone `/login`.
    - Jesli zalogowany uzytkownik probuje wejsc na `/login` lub `/register`, zostanie przekierowany na `/generate`.
- **Przekazanie klienta Supabase**: Instancja klienta Supabase zostanie przekazana do `Astro.locals.supabase`, aby byla dostepna w endpointach API i na stronach Astro.

### 3.2. Endpointy API (`src/pages/api/auth`)

Endpointy beda obslugiwac logike autentykacji, komunikujac sie z Supabase Auth.

- **`POST /api/auth/register.ts`**:
    - Odbiera `email` i `password`.
    - Waliduje dane wejsciowe za pomoca Zod.
    - Wywoluje `supabase.auth.signUp()` z opcja `emailRedirectTo`, ktora wskazaze na `/auth/callback`.
    - Obsluguje bledy (np. uzytkownik juz istnieje) i zwraca odpowiedni status HTTP.
- **`POST /api/auth/login.ts`**:
    - Odbiera `email` i `password`.
    - Waliduje dane.
    - Wywoluje `supabase.auth.signInWithPassword()`.
    - W przypadku sukcesu, Supabase SSR SDK automatycznie ustawi odpowiednie cookies sesyjne w odpowiedzi. Zwraca status 200 OK, co po stronie klienta inicjuje przekierowanie do `/generate`.
    - W przypadku bledu (np. nieprawidlowe dane, brak potwierdzenia e-mail) zwraca odpowiedni status bledu i komunikat.
- **`POST /api/auth/logout.ts`**:
    - Wywoluje `supabase.auth.signOut()`.
    - SDK usuwa cookies sesyjne.
    - Przekierowuje uzytkownika na strone glowna (`/`) po stronie serwera.
- **`POST /api/auth/forgot-password.ts`**:
    - Odbiera `email`.
    - Wywoluje `supabase.auth.resetPasswordForEmail()` z opcja `emailRedirectTo` wskazujaca na strone, gdzie uzytkownik bedzie mogl ustawic nowe haslo (np. `/update-password`).
- **`POST /api/auth/update-password.ts`**:
    - Dziala w kontekscie sesji uzyskanej po kliknieciu linku resetujacego.
    - Odbiera `password`.
    - Wywoluje `supabase.auth.updateUser()`.
    - Po pomyslnej zmianie hasla, uzytkownik jest informowany o sukcesie i moze zostac przekierowany do strony logowania.

### 3.3. Modele danych i walidacja (DTOs)

W pliku `src/types.ts` (lub dedykowanym `src/lib/auth/types.ts`) zdefiniowane zostana schematy Zod do walidacji danych wejsciowych dla kazdego endpointu.

- `RegisterSchema`: `email`, `password` (z `min`, `max`), `confirmPassword`.
- `LoginSchema`: `email`, `password`.
- `ForgotPasswordSchema`: `email`.
- `UpdatePasswordSchema`: `password`, `confirmPassword`.

---

## 4. SYSTEM AUTENTYKACJI (SUPABASE AUTH)

Integracja z Supabase Auth bedzie oparta na podejsciu Server-Side Rendering z wykorzystaniem biblioteki `@supabase/ssr`.

- **Konfiguracja po stronie serwera**: Klucze `SUPABASE_URL` i `SUPABASE_ANON_KEY` beda przechowywane jako zmienne srodowiskowe i dostepne po stronie serwera. Klucz `service_role` nie bedzie potrzebny do operacji autentykacji.
- **Zarzadzanie sesja przez Cookies**: Zamiast przechowywac JWT w `localStorage`, sesja bedzie zarzadzana za pomoca bezpiecznych, serwerowych cookies (`httpOnly`). Biblioteka `@supabase/ssr` zajmie sie ich ustawianiem, odswiezaniem i usuwaniem. To podejscie jest bezpieczniejsze (odporne na XSS) i dziala bezproblemowo w srodowisku SSR.
- **Potwierdzenie e-mail**: Funkcjonalnosc "Confirm email" w Supabase Auth zostanie wlaczona. Po rejestracji uzytkownik otrzyma e-mail z linkiem weryfikacyjnym. Klikniecie go przeniesie go do `/auth/callback`, gdzie sesja zostanie sfinalizowana.
- **Odzyskiwanie hasla**: Wykorzystany zostanie wbudowany mechanizm Supabase. Szablony e-maili (rejestracyjny, odzyskiwania hasla) zostana dostosowane w panelu Supabase.
- **Polityki RLS (Row Level Security)**: Istniejace i przyszle tabele w bazie danych (np. `cards`) musza miec wlaczone RLS. Polityki beda musialy zostac zaktualizowane, aby umozliwic dostep do zasobow tylko zalogowanym uzytkownikom (`authenticated` role) i tylko do ich wlasnych danych (np. `auth.uid() = user_id`).
