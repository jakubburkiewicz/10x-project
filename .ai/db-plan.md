# Database Schema Plan for 10x-cards

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### Tabela: `cards`
Przechowuje fiszki użytkowników wraz z danymi wymaganymi przez algorytm Spaced Repetition.

| Nazwa kolumny | Typ danych    | Ograniczenia                                                                                             | Opis                                                                 |
|---------------|---------------|----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| `id`          | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                                               | Unikalny identyfikator fiszki.                                       |
| `user_id`     | `uuid`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                                                | Klucz obcy wskazujący na właściciela fiszki w tabeli `auth.users`.   |
| `front`       | `varchar(200)`| `NOT NULL`                                                                                               | Treść przodu fiszki.                                                 |
| `back`        | `varchar(500)`| `NOT NULL`                                                                                               | Treść tyłu fiszki.                                                   |
| `source`      | `text`        | `NOT NULL`, `CHECK (source IN ('manual', 'ai'))`                                                         | Źródło pochodzenia fiszki ('manual' lub 'ai').                       |
| `interval`    | `integer`     | `NOT NULL`, `DEFAULT 0`                                                                                  | Interwał (w dniach) do następnej powtórki.                           |
| `repetition`  | `integer`     | `NOT NULL`, `DEFAULT 0`                                                                                  | Liczba pomyślnych powtórek.                                          |
| `ease_factor` | `real`        | `NOT NULL`, `DEFAULT 2.5`                                                                                | Współczynnik łatwości używany przez algorytm SRS.                    |
| `due_date`    | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                                                              | Data następnej zaplanowanej powtórki.                                |
| `created_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                                                              | Znacznik czasowy utworzenia rekordu.                                 |
| `updated_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                                                              | Znacznik czasowy ostatniej modyfikacji rekordu.                      |

### Tabela: `ai_generations`
Loguje metryki związane z generowaniem fiszek przez AI.

| Nazwa kolumny     | Typ danych    | Ograniczenia                                                              | Opis                                                                 |
|-------------------|---------------|---------------------------------------------------------------------------|----------------------------------------------------------------------|
| `id`              | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                | Unikalny identyfikator wpisu logu.                                   |
| `user_id`         | `uuid`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                 | Klucz obcy wskazujący na użytkownika, który wygenerował fiszki.      |
| `input_text`      | `text`        | `NOT NULL`                                                                | Tekst źródłowy użyty do generowania fiszek.                          |
| `generated_count` | `integer`     | `NOT NULL`                                                                | Liczba fiszek wygenerowanych przez AI.                               |
| `accepted_count`  | `integer`     | `NOT NULL`                                                                | Liczba fiszek zaakceptowanych przez użytkownika.                     |
| `created_at`      | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                               | Znacznik czasowy utworzenia rekordu.                                 |

## 2. Relacje między tabelami

- **`auth.users` 1-do-wielu `cards`**: Jeden użytkownik może mieć wiele fiszek. Relacja jest zdefiniowana przez klucz obcy `cards.user_id`.
- **`auth.users` 1-do-wielu `ai_generations`**: Jeden użytkownik może mieć wiele wpisów w logu generowania. Relacja jest zdefiniowana przez klucz obcy `ai_generations.user_id`.

## 3. Indeksy

W celu optymalizacji wydajności zapytań, zostaną utworzone następujące indeksy:

- `CREATE INDEX ON cards (user_id);`
- `CREATE INDEX ON cards (due_date);`
- `CREATE INDEX ON ai_generations (user_id);`

## 4. Zasady PostgreSQL (Row Level Security)

Aby zapewnić, że użytkownicy mają dostęp tylko do swoich danych, zostaną włączone i zdefiniowane następujące polityki RLS.

### Tabela `cards`:
1.  **Włączenie RLS**: `ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;`
2.  **Polityka `SELECT`**: Użytkownik może odczytywać tylko własne fiszki.
    ```sql
    CREATE POLICY "Allow individual read access" ON public.cards FOR SELECT USING (auth.uid() = user_id);
    ```
3.  **Polityka `INSERT`**: Użytkownik może dodawać fiszki tylko dla siebie.
    ```sql
    CREATE POLICY "Allow individual insert access" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
    ```
4.  **Polityka `UPDATE`**: Użytkownik może aktualizować tylko własne fiszki.
    ```sql
    CREATE POLICY "Allow individual update access" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
    ```
5.  **Polityka `DELETE`**: Użytkownik może usuwać tylko własne fiszki.
    ```sql
    CREATE POLICY "Allow individual delete access" ON public.cards FOR DELETE USING (auth.uid() = user_id);
    ```

### Tabela `ai_generations`:
1.  **Włączenie RLS**: `ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;`
2.  **Polityka `SELECT`**: Użytkownik może odczytywać tylko własne logi.
    ```sql
    CREATE POLICY "Allow individual read access" ON public.ai_generations FOR SELECT USING (auth.uid() = user_id);
    ```
3.  **Polityka `INSERT`**: Użytkownik może tworzyć logi tylko dla siebie.
    ```sql
    CREATE POLICY "Allow individual insert access" ON public.ai_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
    ```

## 5. Dodatkowe uwagi

- **Kaskadowe usuwanie**: Użycie `ON DELETE CASCADE` na kluczach obcych `user_id` w tabelach `cards` i `ai_generations` zapewnia, że wszystkie dane powiązane z użytkownikiem zostaną automatycznie usunięte po usunięciu jego konta z `auth.users`, co jest zgodne z wymaganiami RODO.
- **Brak tabeli `profiles`**: Zgodnie z decyzją, dane użytkownika z tabeli `auth.users` dostarczanej przez Supabase są wystarczające dla MVP. Nie ma potrzeby tworzenia dodatkowej tabeli `profiles`.
- **Automatyczne `updated_at`**: W celu automatycznego aktualizowania kolumny `updated_at` przy każdej modyfikacji rekordu, zostanie utworzona dedykowana funkcja i trigger.
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER on_cards_update
  BEFORE UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
  ```