# Plan Testów Aplikacji "10x Personal Pages"

---

## 1. Wprowadzenie i Cele Testów

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji **"10x Personal Pages"**. Projekt ten umożliwia użytkownikom tworzenie i zarządzanie spersonalizowanymi stronami-wizytówkami oraz portfolio projektów. Plan został opracowany w oparciu o analizę struktury kodu, stosu technologicznego oraz kluczowych funkcjonalności aplikacji, aby zapewnić najwyższą jakość i niezawodność produktu końcowego.

### 1.2. Cele Testów

Głównym celem procesu testowania jest weryfikacja, czy aplikacja spełnia wszystkie wymagania funkcjonalne i niefunkcjonalne. Cele szczegółowe to:

*   **Zapewnienie bezpieczeństwa:** Weryfikacja, czy system uwierzytelniania i autoryzacji skutecznie chroni dane użytkowników.
*   **Weryfikacja integralności danych:** Sprawdzenie, czy dane wprowadzane, przetwarzane i przechowywane w systemie są spójne i poprawne.
*   **Potwierdzenie niezawodności:** Upewnienie się, że kluczowe funkcjonalności (zarządzanie stronami, projektami, API) działają stabilnie pod różnymi warunkami.
*   **Zapewnienie jakości User Experience (UX):** Weryfikacja, czy interfejs użytkownika jest intuicyjny, responsywny i dostępny.
*   **Identyfikacja i dokumentacja defektów:** Systematyczne wykrywanie, raportowanie i śledzenie błędów w celu ich naprawy przed wdrożeniem produkcyjnym.

---

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami

*   **Moduł uwierzytelniania i autoryzacji:**
    *   Rejestracja użytkownika (Sign Up).
    *   Logowanie (Sign In) i wylogowywanie (Sign Out).
    *   Zarządzanie sesją użytkownika (ciasteczka i tokeny).
    *   Walidacja uprawnień do zasobów (dostęp wyłącznie do własnych danych).
    *   Obsługa błędów uwierzytelniania.
*   **Publiczne API (`/pages/api/*`):**
    *   Endpointy `auth`: `sign-up`, `sign-in`, `sign-out`, `resend-verification`.
    *   Endpointy `pages`: operacje CRUD na danych strony użytkownika.
    *   Endpointy `projects`: operacje CRUD na projektach, w tym zmiana kolejności (`reorder`).
    *   Walidacja danych wejściowych (DTOs i Commands) dla wszystkich endpointów.
*   **Panel Administracyjny (Dashboard):**
    *   Interaktywne komponenty React do zarządzania treścią strony (`PageContentCard`, `PageSettingsCard`).
    *   Zarządzanie projektami (tworzenie, edycja, usuwanie, zmiana kolejności).
    *   Wybór i zmiana motywu.
*   **Publiczne Strony Użytkowników:**
    *   Poprawne renderowanie statycznych stron w technologii Astro.
    *   Wyświetlanie danych strony i projektów zgodnie z wybranym motywem (`ocean` lub `earth`).
    *   Dynamiczne generowanie linków do podstron projektów.
*   **Logika biznesowa (`/src/lib/services`):**
    *   Poprawność działania usług odpowiedzialnych za interakcje z bazą danych Supabase.
    *   Obsługa błędów i przypadków brzegowych.

### 2.2. Funkcjonalności wyłączone z testów

*   **Wewnętrzna logika bibliotek zewnętrznych:** Testy nie będą obejmować weryfikacji wewnętrznego działania bibliotek takich jak React, Astro, Supabase SDK czy komponentów Shadcn/ui. Testowany będzie wyłącznie sposób ich integracji i wykorzystania w aplikacji.
*   **Testy wydajnościowe infrastruktury Cloudflare i Supabase:** Zakłada się, że dostawcy tych usług zapewniają odpowiednią skalowalność i wydajność.

---

## 3. Rodzaje Testów

| Rodzaj Testu           | Opis                                                                                                                                                                             | Narzędzia/Podejście                              |
|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| **Testy Jednostkowe**  | Weryfikacja pojedynczych funkcji, komponentów i logiki biznesowej w izolacji. Skupią się na walidatorach Zod (`/lib/validators`), logice usług (`/lib/services`) oraz helperach. | Vitest, React Testing Library                    |
| **Testy Integracyjne** | Sprawdzenie współpracy między różnymi częściami systemu. Kluczowe obszary to: integracja API z bazą danych Supabase oraz interakcja komponentów React z endpointami API.         | Vitest, Supertest (dla API), Mock Service Worker |
| **Testy End-to-End**   | Symulacja pełnych przepływów użytkownika w działającej aplikacji, od logowania, przez zarządzanie treścią w panelu, po weryfikację publicznej strony.                            | Playwright                                       |

---

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Uwierzytelnianie

*   **TC-AUTH-01:** Użytkownik poprawnie rejestruje się, podając prawidłowy email i hasło. Oczekiwany rezultat: Konto zostaje utworzone, użytkownik otrzymuje email weryfikacyjny.
*   **TC-AUTH-02:** Próba rejestracji z zajętym adresem email. Oczekiwany rezultat: API zwraca błąd `409 Conflict` z kodem `user_already_exists`.
*   **TC-AUTH-03:** Próba rejestracji z nieprawidłowym hasłem (np. za krótkim). Oczekiwany rezultat: API zwraca błąd `400 Bad Request` z informacją o błędzie walidacji.
*   **TC-AUTH-04:** Zarejestrowany użytkownik loguje się poprawnie. Oczekiwany rezultat: Użytkownik jest zalogowany i zostaje przekierowany do panelu administracyjnego.
*   **TC-AUTH-05:** Próba zalogowania z błędnym hasłem. Oczekiwany rezultat: Wyświetlenie komunikatu o błędnych danych logowania.
*   **TC-AUTH-06:** Zalogowany użytkownik wylogowuje się. Oczekiwany rezultat: Sesja zostaje zakończona, użytkownik zostaje przekierowany na stronę główną.

### 4.2. Zarządzanie Stroną (Pages API & Dashboard)

*   **TC-PAGE-01:** Zalogowany użytkownik tworzy nową stronę, podając unikalny URL. Oczekiwany rezultat: Strona zostaje utworzona w bazie danych, API zwraca `201 Created`.
*   **TC-PAGE-02:** Próba utworzenia strony z już istniejącym URL. Oczekiwany rezultat: API zwraca błąd `409 Conflict` z kodem `url_already_exists`.
*   **TC-PAGE-03:** Użytkownik aktualizuje dane swojej strony (np. bio, kontakty) za pomocą edytora YAML. Oczekiwany rezultat: Dane zostają zapisane, a publiczna strona jest zaktualizowana.
*   **TC-PAGE-04:** Próba zapisu nieprawidłowego formatu YAML. Oczekiwany rezultat: API zwraca błąd `400 Bad Request` z kodem `invalid_yaml_format`.
*   **TC-PAGE-05:** Użytkownik zmienia motyw swojej strony. Oczekiwany rezultat: Publiczna strona renderuje się z użyciem nowego motywu.
*   **TC-PAGE-06:** Niezalogowany użytkownik próbuje uzyskać dostęp do API zarządzania stroną. Oczekiwany rezultat: API zwraca błąd `401 Unauthorized`.

### 4.3. Zarządzanie Projektami (Projects API & Dashboard)

*   **TC-PROJ-01:** Zalogowany użytkownik dodaje nowy projekt. Oczekiwany rezultat: Projekt pojawia się na liście w panelu i na publicznej stronie.
*   **TC-PROJ-02:** Użytkownik edytuje dane istniejącego projektu. Oczekiwany rezultat: Zmiany są widoczne w panelu i na publicznej stronie projektu.
*   **TC-PROJ-03:** Użytkownik usuwa projekt. Oczekiwany rezultat: Projekt znika z panelu i z publicznej strony.
*   **TC-PROJ-04:** Użytkownik zmienia kolejność projektów metodą "przeciągnij i upuść". Oczekiwany rezultat: Nowa kolejność jest zapisywana i odzwierciedlona na publicznej stronie.
*   **TC-PROJ-05:** Użytkownik A próbuje zmodyfikować projekt należący do użytkownika B (poprzez bezpośrednie wywołanie API). Oczekiwany rezultat: API zwraca błąd `404 Not Found` lub `403 Forbidden` (zgodnie z implementacją RLS w Supabase).

---

## 5. Środowisko Testowe

*   **Środowisko lokalne:** Programiści uruchamiają testy jednostkowe i integracyjne na swoich maszynach przed wypchnięciem zmian do repozytorium. Wymagane jest lokalne uruchomienie aplikacji oraz ewentualnie instancji Supabase w kontenerze Docker.
*   **Środowisko CI/CD (GitHub Actions):** Na każde wypchnięcie do gałęzi `main` lub w Pull Requestach automatycznie uruchamiane będą testy jednostkowe, integracyjne oraz testy E2E. Zapewni to szybką informację zwrotną o ewentualnych regresjach.
*   **Środowisko E2E:** Dedykowane środowisko, będące wierną kopią środowiska produkcyjnego, połączone z osobną instancją Supabase. Na tym środowisku przeprowadzane będą testy manualne i eksploracyjne przed każdym wdrożeniem na produkcję.
*   **Środowisko produkcyjne:** Dostęp do tego środowiska jest ograniczony. Po wdrożeniu przeprowadzane będą jedynie podstawowe testy dymne (Smoke Tests) w celu weryfikacji poprawności wdrożenia.

---

## 6. Narzędzia Testowe

*   **Framework do testów:** Vitest
*   **Testy komponentów React:** React Testing Library
*   **Testy End-to-End:** Playwright
*   **Testy API (manualne):** Postman
*   **CI/CD:** GitHub Actions
*   **Kontrola wersji:** Git / GitHub
*   **Zarządzanie zadaniami i błędami:** GitHub Issues
*   **Testy dostępności:** `axe-core` (zintegrowany z Playwright)
*   **Mockowanie API:** Mock Service Worker (dla testów integracyjnych komponentów)

---

## 7. Harmonogram Testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania (CI/CD).

*   **Testy jednostkowe i integracyjne:** Pisane równolegle z nowymi funkcjonalnościami przez programistów.
*   **Testy End-to-End:** Rozwijane w miarę stabilizacji kluczowych przepływów użytkownika.
*   **Faza testów manualnych i UAT (User Acceptance Testing):** Przeprowadzana na środowisku E2E przed planowanym wdrożeniem nowej wersji aplikacji. Czas trwania: 1-2 dni robocze.
*   **Testy regresji:** Wykonywane automatycznie (jednostkowe, integracyjne, E2E) przy każdej zmianie w kodzie oraz manualnie przed wdrożeniem.

---

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria wejścia (rozpoczęcia testów)

*   Kod źródłowy został pomyślnie zbudowany i wdrożony na danym środowisku testowym.
*   Wszystkie testy jednostkowe i integracyjne przechodzą pomyślnie.
*   Dokumentacja dla testowanych funkcjonalności jest dostępna.

### 8.2. Kryteria wyjścia (zakończenia testów i gotowości do wdrożenia)

*   **100%** krytycznych scenariuszy testowych (E2E) kończy się sukcesem.
*   **Pokrycie kodu testami jednostkowymi i integracyjnymi > 80%** dla nowej i modyfikowanej logiki biznesowej.
*   **Brak otwartych błędów krytycznych (Blocker) i poważnych (Critical).**
*   Wszystkie błędy o niższym priorytecie są udokumentowane i zaplanowane do naprawy w kolejnych iteracjach.