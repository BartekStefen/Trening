# Aplikacja Fitness - Architektura i Lista Zadań

## ❌ DO ZROBIENIA (TODO)

### UI/UX
- [x] **Konfigurowalny Dashboard ("Skórki")**: 5 motywów: Dark Mode, Retro Trójbój, Clean Fitness, Beast Mode, Jasny. ThemeContext + AsyncStorage, selektor kafelkowy w Profilu, StatusBar dynamiczny. Wszystkie ekrany i modale pokryte tokenami.
- [ ] **System Osiągnięć (Badges)**: Odblokowywanie graficznych tarcz za kamienie milowe widocznych w profilu.
- [ ] **Wizualne "Streaks" (Pierścienie Siły)**: Pierścienie zamykające się za objętość treningową, dopicie wody i makro białka.
- [ ] **Płynny Termometr Kaloryczny**: Efekt pulsowania i płynnej zmiany kolorów (60 FPS).
- [ ] **Widżety na Ekran Główny (iOS/Android)**: Systemowy widżet prezentujący dzisiejsze makro, stan nawodnienia oraz postęp dnia.
- [ ] **Kreator Onboardingu (Cold Start)**: Sekwencja startowa zbierająca parametry i automatycznie wyliczająca początkowe TDEE oraz sugerowany plan.

### Moduł Treningowy
- [x] **Interfejs "Płynnego Kafelka" (Fluid Gestures)**: Swipe prawo = zaliczona (zielony ✓ + haptyka), swipe lewo = spalona 🔥 (Alert), przytrzymanie RPE = inline picker 6–10.
- [ ] **Tryb Krajobrazowy (Rack View)**: Obrócenie telefonu poziomo zmienia interfejs w ogromne cyfry z timerem i ciężarem.
- [x] **Pamięć Ustawień Maszyn (Seat & Pin)**: MachineSettingsModal z AsyncStorage — fotel, PIN, oparcie, notatki. Dostępny przez ⋯ menu ćwiczenia.
- [ ] **Kalistenika Pro & Home Workout**: Doliczanie wagi z profilu do pasa oraz tryb podmiany na gumy oporowe lub hantle.
- [x] **Wizualizator Super-Serii (Glow Effect)**: Pulsująca neonowa poświata na kartach + pionowy konektor między ćwiczeniami. Toggle w ⋯ menu.
- [ ] **Kreator Planu (Drag & Drop)**: Wyklikiwanie nowej rutyny z opcją wizualnego łączenia ćwiczeń "klamrami" dla super-serii.
- [x] **Krzywa Zaniku 1RM**: Algorytm obniżający 1RM o 5% co 4 tygodnie przerwy (max -30%), z pulsującym ostrzeżeniem.
- [x] **Pływający Widget 1RM**: Chip z Epley 1RM nad wierszami serii — rozwijany szczegółami (surowe 1RM, zanik, ostatni wynik).
- [ ] **Widżety Live Activities**: Na zablokowanym ekranie: ćwiczenie, ciężar, seria i czas do następnego podejścia.
- [ ] **Interaktywne Powiadomienia na Zegarek (Smartwatch Integration)**: Powiadomienia Push w tle na nadgarstek po rozpoczęciu przerwy z informacją o kolejnej serii.

### Config / Feature Flags (Opcjonalne Moduły)
- [ ] **RPE do RIR Translator**: Globalny przełącznik zmieniający skalę intensywności z klasycznego RPE (1-10) na RIR (powtórzenia w zapasie).
- [ ] **Pogodowy Modyfikator Nawodnienia**: Integracja z API pogodowym, automatycznie podbijająca dobowy cel wody o 750 ml w upalne dni.
- [ ] **Autoregulacja Rozgrzewki (RAMP)**: Automatyczne kalkulowanie i dodawanie serii rozgrzewkowych przed głównymi bojami wielostawowymi.
- [ ] **Audio-Asystent w słuchawkach**: Lektor czytający w tle komunikaty o końcu przerwy oraz motywujący w trakcie serii.
- [ ] **Tryb "Przetrwania" (Exam/Stress Mode)**: Agresywne ucięcie objętości zaplanowanego treningu o 40% w dniach o wysokim poziomie zmęczenia.
- [ ] **Auto-Deload (Wykrywacz Płaskowyżu)**: Algorytm monitorujący progresję, wymuszający okres roztrenowania (-15% obciążenia) przy braku postępów.

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
- [x] PRCelebration (konfetti + haptyka) — komponent gotowy, czeka na podpięcie.
- [x] **ThemeContext + system skórek** (`theme/themes.js`, `context/ThemeContext.js`, AsyncStorage). Pokrycie: TrainingScreen, DietScreen, ToolsScreen, ProfileScreen, ActiveWorkoutScreen, WorkoutHistoryScreen, ExercisesLibraryScreen, WorkoutSummaryModal. Dynamiczny tab bar i StatusBar.

### Moduł Treningowy
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

### Narzędzia i Dieta
- [x] Kalkulator 1RM (5 formuł + tabela %), TDEE (Mifflin-St Jeor) i Makro (5 presetów).
- [x] Plate Calculator z wizualizacją gryfu i inputem kg (też w narzędziach).
- [x] Szkielet DietScreen z makro w widełkach i podstawowe Nawodnienie (butelki 250ml).

### Analityka
- [x] LiveMuscleMap (SVG, przód + tył) i MuscleDistributionModal.
- [x] Historia treningów i Wykresy objętości (VolumeChart — sesje + partie).
- [x] Ekran Podsumowania Treningu (WorkoutSummaryModal z mapą).