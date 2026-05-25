# Aplikacja Fitness - Architektura i Lista Zadań

## ❌ DO ZROBIENIA (TODO)

### UI/UX
- [x] **Konfigurowalny Dashboard ("Skórki")**: 5 motywów: Dark Mode, Retro Trójbój, Clean Fitness, Beast Mode, Jasny. ThemeContext + AsyncStorage, selektor kafelkowy w Profilu, StatusBar dynamiczny. Wszystkie ekrany i modale pokryte tokenami.
- [x] **System Osiągnięć (Badges)**: Odblokowywanie graficznych tarcz za kamienie milowe widocznych w profilu.
- [x] **Wizualne "Streaks" (Pierścienie Siły)**: Pierścienie zamykające się za objętość treningową, dopicie wody i makro białka.
- [x] **Płynny Termometr Kaloryczny**: Efekt pulsowania i płynnej zmiany kolorów (60 FPS).
- [ ] **Widżety na Ekran Główny (iOS/Android)**: Systemowy widżet prezentujący dzisiejsze makro, stan nawodnienia oraz postęp dnia.
- [ ] **Kreator Onboardingu (Cold Start)**: Sekwencja startowa zbierająca parametry i automatycznie wyliczająca początkowe TDEE oraz sugerowany plan.

### Moduł Treningowy
- [x] **Interfejs "Płynnego Kafelka" (Fluid Gestures)**: Swipe prawo = zaliczona (zielony ✓ + haptyka), swipe lewo = spalona 🔥 (Alert), przytrzymanie RPE = inline picker 6–10.
- [x] **Tryb Krajobrazowy (Rack View)**: Obrócenie telefonu poziomo zmienia interfejs w ogromne cyfry z timerem i ciężarem.
- [x] **Pamięć Ustawień Maszyn (Seat & Pin)**: MachineSettingsModal z AsyncStorage — fotel, PIN, oparcie, notatki. Dostępny przez ⋯ menu ćwiczenia.
- [x] **Kalistenika Pro & Home Workout**: Doliczanie wagi z profilu do pasa oraz tryb podmiany na gumy oporowe lub hantle.
- [x] **Wizualizator Super-Serii (Glow Effect)**: Pulsująca neonowa poświata na kartach + pionowy konektor między ćwiczeniami. Toggle w ⋯ menu.
- [x] **Kreator Planu (Drag & Drop)**: Wyklikiwanie nowej rutyny z opcją wizualnego łączenia ćwiczeń "klamrami" dla super-serii.
- [x] **Krzywa Zaniku 1RM**: Algorytm obniżający 1RM o 5% co 4 tygodnie przerwy (max -30%), z pulsującym ostrzeżeniem.
- [x] **Pływający Widget 1RM**: Chip z Epley 1RM nad wierszami serii — rozwijany szczegółami (surowe 1RM, zanik, ostatni wynik).
- [x] **Trwałość Danych (AsyncStorage)**: Plany użytkownika i historia treningów zapisywane lokalnie — przeżywają restart aplikacji.
- [x] **PRCelebration (Konfetti PR)**: Animowany modal konfetti z haptyka wyskakujący w chwili pobicia rekordu osobistego podczas serii.
- [x] **Zarządzaj Planami**: Tryb edycji szablonów — przyciski ✏️ Edytuj i 🗑️ Usuń na każdym planie; Kreator Planu obsługuje tryb aktualizacji istniejącego planu.
- [x] **Widżety Live Activities**: Na zablokowanym ekranie: ćwiczenie, ciężar, seria i czas do następnego podejścia.
- [x] **Interaktywne Powiadomienia na Zegarek (Smartwatch Integration)**: Powiadomienia Push w tle na nadgarstek po rozpoczęciu przerwy z informacją o kolejnej serii.

### Config / Feature Flags (Opcjonalne Moduły)
- [x] **RPE do RIR Translator**: Globalny przełącznik w Profilu → Ustawienia zmieniający skalę intensywności z RPE (6–10) na RIR (powtórzenia w zapasie). Zapamiętany w AsyncStorage.
- [x] **Pogodowy Modyfikator Nawodnienia**: Skalowany cel wody wg temperatury (od 12°C) i wilgotności — np. 20°C ≈ +500 ml, 25°C ≈ +750 ml. Open-Meteo + DietContext.
- [x] **Autoregulacja Rozgrzewki (RAMP)**: Inteligentny protokół dla każdego ćwiczenia (wielostaw/izolacja/kalistenika/guma) — podgląd w menu ⋯ + ręczne dodanie serii.
- [x] **Audio-Asystent w słuchawkach**: 3 tryby (OFF / Głos+tyk / Tylko tyk). Odliczanie 5→2 s; na końcu fanfara (3× tyk) + opcjonalnie głos.
- [x] **Tryb "Przetrwania" (Exam/Stress Mode)**: Agresywne ucięcie objętości zaplanowanego treningu o 40% w dniach o wysokim poziomie zmęczenia.
- [x] **Auto-Deload (Wykrywacz Płaskowyżu)**: Algorytm monitorujący progresję, wymuszający okres roztrenowania (-15% obciążenia) przy braku postępów.
- [x] **Moduł w Narzędziach - Kreator Prób Maksymalnych (1RM Wizard):** Implementacja samodzielnego kreatora w zakładce Narzędzia. System ma umożliwiać wybór ćwiczenia z bazy, pobranie i wyraźne wyświetlenie w interfejsie aktualnego rekordu (1RM) użytkownika, zdefiniowanie nowego celu i automatyczne wygenerowanie dedykowanego protokołu podejść (rozgrzewka + próba główna) wraz z bezpośrednią aktualizacją rekordu w profilu po zatwierdzeniu sukcesu.
### Dieta i Nawodnienie
- [ ] **Kreator Przepisów**: Możliwość tworzenia, wyliczania makro i trwałego zapisywania własnych, unikalnych posiłków.
- [ ] **Szybkie Kopiowanie**: Przenoszenie całych posiłków lub pełnych dni z przeszłości do bieżącego widoku jednym kliknięciem.
- [ ] **Ulubione Produkty**: Algorytm segregujący i dający szybki dostęp do najczęściej spożywanych elementów.
- [ ] **Skaner Kodów "Multi-Scan"**: Błyskawiczna baza pozwalająca skanować kilka produktów pod rząd.
- [ ] **Śledzenie Mikroskładników**: Zaawansowana analiza spożycia błonnika, witamin, minerałów i cukrów prostych.
- [ ] **Moduł Nawodnienia Premium**: Śledzenie ilości wypitej wody z konfigurowalnymi przypomnieniami w tle (Push) oraz animowaną taflą.
- [ ] **Analiza Aminokwasowa**: Wykres słupkowy pokazujący, czy osiągnięto próg leucyny do budowy mięśni.
- [ ] **Płynna Korekta Błędu ("Kaloryczny Bufor")**: Opcja automatycznego ucinania małych puli kalorii w kolejne dni po jednorazowym przekroczeniu makro.
- [ ] **Automatyczny Plan Suplementacyjny**: Oś czasu z przypomnieniami (np. "Kreatyna rano").
- [ ] **Analiza Wpływu Alkoholu i Kofeiny**: Oznaczenie kolejnego dnia po spożyciu jako "Ryzyko kontuzji" z sugestią deloadu. Wykres kofeiny i alerty o skoku greliny po źle przespanej nocy.

### Profil i Analityka
- [ ] **Statystyki Asymetrii**: Wykres radarowy pokazujący stosunek siły (np. Push vs Pull).
- [ ] **Wizualna Prognoza Zmęczenia**: Wykres szacujący siły za 2 tygodnie przy obecnym tempie dokładania obciążeń.
- [ ] **Wykres Gotowości Treningowej (Ready-to-Lift Score)**: Algorytm oceniający gotowość przed salą (1-10).
- [ ] **Estymacja Celów**: Algorytm matematyczny pokazujący przewidywany termin osiągnięcia wagi docelowej na podstawie historycznego i obecnego deficytu kalorycznego.
- [ ] **Grywalizacja "Tonażowy System Poziomów"**: Punkty XP za kilogramy i automatyczna korelacja Wilks/Dots.
- [ ] **Ekran Podsumowania pod Social Media**: Generowanie infografiki jednym kliknięciem.
- [ ] **Prywatne "Shadow Rooms"**: Zamknięte pokoje znajomych do rywalizacji.

### Architektura, Baza i Backend
- [ ] **Zarządzanie Posiłkami & Firebase (lub Supabase)**: Trwały zapis planów i ukryte administracyjne filtry.
- [ ] **Autoryzacja (Auth)**: Ekran powitalny wdrażany na finiszu prac frontendowych.
- [ ] **Integracja z HealthConnect / Apple Health**: Dwukierunkowa synchronizacja parametrów życiowych.
- [ ] **Eksport Danych i RODO**: Bezpieczny moduł wyeksportowania kompletnej historii do pliku JSON/CSV.
- [ ] **Buforowanie Offline (Zero-Ping Sync)**: Bezpieczne buforowanie lokalne bez utraty danych podczas braku sieci.
- [ ] **Logowanie Błędów (Sentry/Crashlytics)**: Zdalne monitorowanie stabilności kodu.

---

## ✅ ZROBIONE (DONE)

### UI/UX & Architektura
- [x] True Dark Mode i Global Design System.
- [x] Zabezpieczenia UX (Alert przy usuwaniu) i segmentowy pasek postępu (Stories style).
- [x] WorkoutContext (stan globalny), InteractionManager (eliminacja lagów).
- [x] PRCelebration (konfetti + haptyka) — podpięte do ActiveWorkoutScreen, wykrywa PR przy zaliczeniu serii.
- [x] **ThemeContext + system skórek** (`theme/themes.js`, `context/ThemeContext.js`, AsyncStorage). Pokrycie: TrainingScreen, DietScreen, ToolsScreen, ProfileScreen, ActiveWorkoutScreen, WorkoutHistoryScreen, ExercisesLibraryScreen, WorkoutSummaryModal. Dynamiczny tab bar i StatusBar.
- [x] **System Osiągnięć (Badges)**: 37 tarcz w 7 rangach, 3 podglądy w Profilu, katalog z wyszukiwarką i filtrami, baner odblokowania na ekranie głównym, zapis AsyncStorage (`AchievementsContext`).
- [x] **Pierścienie Siły**: 3 pierścienie SVG (`MultiArcRing`), panel w Profilu, edycja łuków, sekcja w Ustawieniach, `StrengthRingsContext` + AsyncStorage.
- [x] **Termometr kaloryczny (Dieta)**: Kompaktowy łuk z gradientem SVG, animacja postępu, cel z `ProfileGoalsContext` — `CalorieThermometer.js`.

### Moduł Treningowy
- [x] **Tryb Krajobrazowy (Rack View)**: Overlay fullscreen z ogromnym timerem, ciężarem i seriami — aktywuje się automatycznie przy obróceniu ekranu.
- [x] **Kalistenika Pro & Home Workout**: Tryb obciążenia (Sztanga / Waga ciała / Gumy oporowe / Hantle) per ćwiczenie — dostępny przez ⋯ menu; baner z instrukcją i wybieracz poziomu gumy.
- [x] **Kreator Planu (Drag & Drop)**: PlanCreatorScreen — przeciąganie ćwiczeń za uchwyt ≡, klamry super-serii między ćwiczeniami, zapis jako własny plan. Kreator zapisuje kolejność i grupy SS do WorkoutContext. Własne plany usuwalne przez przytrzymanie kafelka lub tryb Zarządzaj. Obsługa edycji istniejących planów.
- [x] Dashboard i Atlas (szablony, szybki start).
- [x] Odizolowany Timer HUD (WorkoutTimerHUD) oraz RestTimerBanner.
- [x] Parser NLP + slang ("zapas 2", normalizacja Unicode).
- [x] One-Click Swap z przeliczeniem ciężaru.
- [x] Drop-Set Creator (max 4 serie na ćwiczenie, −20%).
- [x] Menu kontekstowe Three Dots (ExerciseActionsModal).
- [x] Historia ćwiczenia w locie (ExerciseHistoryModal) i niestandardowe ćwiczenia.
- [x] Notatka do sesji treningowej i Shake-to-Confirm (akcelerometr).
- [x] **Fluid Gestures** (SwipeableSetRow): swipe prawo = done + haptyka, lewo = 🔥 spalona, RPE inline picker.
- [x] **1RM Widget + Decay Curve**: Epley chip z zankiem -5%/4 tyg., pulsująca animacja ostrzeżenia.
- [x] **Super-Seria Glow**: pulsujący border + konektor, toggle przez ⋯ menu, 5 kolorów grup.
- [x] **Machine Settings Memory**: MachineSettingsModal (fotel, PIN, oparcie, notatki) — AsyncStorage.
- [x] **Tryb Przetrwania + Auto-Deload**: `trainingIntelligence.js` — gotowość ≤4 → alert −40% objętości; płaskowyż → −15% obciążenia. Toggle w Profilu, banner w ActiveWorkout.
- [x] **Kreator prób 1RM (Wizard)**: Narzędzia → wybór ćwiczenia, aktualny rekord, protokół rozgrzewki + próby, zapis do profilu.

### Narzędzia i Dieta
- [x] Kalkulator 1RM (5 formuł + tabela %), TDEE (Mifflin-St Jeor) i Makro (5 presetów).
- [x] Plate Calculator z wizualizacją gryfu i inputem kg (też w narzędziach).
- [x] Szkielet DietScreen z makro w widełkach i podstawowe Nawodnienie (butelki 250ml).

### Analityka
- [x] LiveMuscleMap (SVG, przód + tył) i MuscleDistributionModal.
- [x] Historia treningów i Wykresy objętości (VolumeChart — sesje + partie).
- [x] Ekran Podsumowania Treningu (WorkoutSummaryModal z mapą).