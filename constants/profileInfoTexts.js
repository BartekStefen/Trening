// Teksty pomocy (ⓘ) — { simple, detail }
// simple = krótko, dla początkujących | detail = podstawy naukowe
// null = brak ikony

export const PROFILE_INFO = {
  stats: null,
  history: null,
  settings: null,
  analytics: null,
  social: null,
  shadowRooms: null,

  volume: {
    simple: `Tonaż to ile „pracy” zrobiły Twoje mięśnie — mnożysz ciężar razy powtórzenia.

Po co to?
Żeby zobaczyć, czy z treningu na trening robisz więcej, czy stoisz w miejscu, i które partie (klatka, plecy, nogi…) dostają najwięcej roboty.`,
    detail: `Objętość treningowa (tonaż) to suma kg × powtórzenia ze zaliczonych serii. Meta-analizy wskazują, że tygodniowa objętość na partię (10–20 serii hard sets) koreluje z hipertrofią — ale zbyt szybki skok obciążenia zwiększa ryzyko kontuzji i stagnacji.

Wykres pokazuje ostatnie 12 sesji i rozkład na partie, żebyś widział trendy, a nie pojedynczy trening.`,
  },

  readiness: {
    simple: `Ocena 1–10 przed treningiem: wellness + obciążenie (ACWR/sRPE) + regeneracja.

Po co to?
W sporcie wyczynowym monitoruje się sen, zmęczenie, ból i stres (kwestionariusz Hooper) oraz obciążenie treningowe (sRPE × czas). Aplikacja łączy te sygnały w jeden wynik gotowości.`,
    detail: `Ready-to-Lift to model decyzyjny aplikacji — nie diagnoza medyczna.

Składniki (wagi):
• 45% — wellness dzienny (sen, zmęczenie, DOMS, stres) — skala 1–5, wzorowana na monitoringu Hooper / RESTQ u sportowców.
• 35% — obciążenie treningowe: ACWR liczone z session-RPE (Foster: RPE × czas w min) lub proxy z historii, gdy brak RPE. Strefa docelowa ACWR ~0,8–1,3 (Gabbett 2016); >1,5 = podwyższone ryzyko kumulacji.
• 20% — regeneracja per split z heatmapy: zaliczone serie × RPE na partiach góry/dół z ostatnich ~7 dni. Pusta sesja „Lower” bez pracy na nogach nie obniża gotowości.

Wynik główny to średnia Upper + Lower. Przy starcie planu oceniany jest split z realnego obciążenia mięśni.`,
  },

  levels: {
    simple: `Zbierasz punkty XP za każdy kilogram, który podnosisz w treningach — im więcej trenujesz, tym wyższy poziom.

Po co to?
Motywacja i zabawa. Wilks i Dots to liczby, którymi powerlifterzy porównują siłę niezależnie od wagi ciała — im wyżej, tym lepiej w swojej kategorii.`,
    detail: `XP rośnie z łącznym tonażem (≈100 kg = 1 XP) — to gamifikacja, nie miara zdrowia.

Wilks i Dots to współczynniki używane w trójboju siłowym do porównywania wyników między kategoriami wagowymi (formuły IPF/USAPL). Liczone są z estymacji totalu SBD (przysiad + wycisk + martwy) metodą Epley — to przybliżenie, nie oficjalny wynik zawodów.

Przełącznik płci zmienia współczynnik w formule — mężczyźni i kobiety mają odrębne krzywe normalizacji.`,
  },

  asymmetry: {
    simple: `Pokazuje, ile trenujesz wypychania (klatka, barki), przyciągania (plecy) i nóg.

Po co to?
Wielu na siłowni robi dużo wyciskania, a mało pleców — barki wtedy bolą, postawa się psuje. Ten wykres pomaga to zauważyć i wyrównać plan.`,
    detail: `Wykres pokazuje rozkład objętości Push / Pull / Nogi / Core. W literaturze klinicznej i sportowej długotrwała dominacja ruchów wypychających (wyciskania) przy słabszych plecach wiąże się z większym ryzykiem dysfunkcji barku i postawy (rotacja wewnętrzna ramion).

Orientacyjny stosunek Push:Pull blisko 1:1 u wielu programów prewencyjnych uznawany jest za zdrowy punkt wyjścia. To szacunek z historii treningów — nie zastępuje oceny fizjoterapeuty.`,
  },

  fatigue: {
    simple: `Szacuje indeks regeneracji za tydzień lub dwa — na podstawie trendu obciążenia sRPE i ACWR.

Po co to?
Gdy obciążenie rośnie za szybko, organizm nie nadąża z adaptacją. Spadający wykres to sygnał: deload, więcej snu lub mniejsza objętość.`,
    detail: `Prognoza opiera się na tygodniowym obciążeniu session-RPE (Foster) i współczynniku ACWR (Gabbett 2016), z projekcją trendu na +1 i +2 tygodnie.

Indeks regeneracji (%) maleje przy rosnącym ACWR — zgodnie z modelem kumulacji zmęczenia (Meeusen et al., 2013). To narzędzie planistyczne, nie prognoza siły 1RM.

Przy chronicznym zmęczeniu, bezsenności lub spadku libido — konsultacja lekarska.`,
  },

  goal: {
    simple: `Pokazuje, kiedy mniej więcej osiągniesz wagę, o którą Ci chodzi — na redukcji albo masie.

Po co to?
Żeby mieć realny termin w głowie zamiast zgadywać. Ustawiasz to w „Skonfiguruj cel”: waga, wzrost, aktywność i czy chcesz schudnąć, przytyć czy utrzymać formę. Aplikacja liczy kalorie i datę.

Pamiętaj: waga skacze co dzień (woda, jedzenie) — to szacunek, nie obietnica co do grama.`,
    detail: `TDEE liczone jest wzorem Mifflina–St Jeora (1990) — uznawanym za dokładniejszy niż Harris-Benedict u większości dorosłych. Mnożnik aktywności pochodzi z praktyki dietetycznej (PAL).

Deficyt/nadwyżka kaloryczna:
• Redukcja: ok. 7700 kcal ≈ 1 kg masy ciała to uproszczenie (Hall et al.) — realny spadek zależy od składu ciała, NEAT i hormonów.
• Masa: ISSN sugeruje nadwyżkę ~350–500 kcal/d dla większości kulturystycznych celów, by ograniczyć nieproporcjonalny przyrost tkanki tłuszczowej.

Datę celu traktuj jako orientacyjną — waga waha się dniennie o 0,5–2 kg (woda, glycogen). Konfiguracja w „Skonfiguruj cel” / „Zmień cel”.`,
  },

  heatmap: {
    simple: `Sylwetka, na której świecą się mięśnie — im jaśniej, tym częściej je trenujesz.

Po co to?
Jednym rzutem oka widać, czy np. plecy są zaniedbane w porównaniu z klatą. Pomaga ułożyć plan tak, żeby nic nie „zostawało w tyle”.`,
    detail: `Mapa agreguje serie ze wszystkich treningów. Intensywność rośnie z liczbą hard sets i RPE w danym regionie — podobnie jak w planowaniu objętości per mięsień (Schoenfeld: frequency + volume per muscle group).

Pomaga zobaczyć, czy np. plecy są realnie trenowane tak często, jak klatka.`,
  },

  strengthRings: {
    simple: `Trzy pierścienie: Dzień, Makro i Rytm. Edycja na profilu (stuknij pierścień) albo w Ustawieniach → Pierścienie.

Dostępne m.in.: tonaż, woda, białko, wellness, serie treningów, rekordy 1RM, XP.`,
    detail: `Każdy pierścień ma własną listę metryk (bez powielania kcal w pierścieniu Dzień). Pierścień 2 skupia kalorie i makra. Konfiguracja zapisywana lokalnie — wspólna dla profilu i ustawień.`,
  },

  badges: {
    simple: `Na profilu widzisz 3 podglądy tarcz. Stuknij sekcję, aby otworzyć pełny katalog z rangami (miedź → legenda), wyszukiwarką i filtrami.

Po odblokowaniu nowej tarczy na górze ekranu pojawi się powiadomienie „Odblokowano osiągnięcie!”.`,
    detail: `Katalog grupuje odznaki według rang: Miedź, Brąz, Srebro, Złoto, Platyna, Elita, Legenda.

Dane z historii treningów, rekordów 1RM, planów, onboardingu i nawyków. XP ≈ 100 kg tonażu = 1 punkt. Zapis trwały w AsyncStorage.`,
  },

  habits: {
    simple: `Codzienna lista suplementacji i nawyków (np. kreatyna, sen). Stuknij, żeby odhaczyć.

Po co to?
Śledzenie regularności snu i suplementacji wspiera długoterminową regenerację — osobno od kwestionariusza wellness w gotowości treningowej.`,
    detail: `Sen: American Academy of Sleep Medicine zaleca ≥7 h dla dorosłych; chroniczny deficyt snu obniża wydolność, regenerację hormonalną i zwiększa ryzyko urazów.

Kreatyna: stanowisko ISSN (2017) — monohydrat 3–5 g/d jest bezpieczny i skuteczny u zdrowych osób; wspiera moc i objętość treningową długoterminowo. Nie zastępuje białka ani snu.

Nawyki nie wpływają bezpośrednio na wynik gotowości — ocena opiera się na kwestionariuszu wellness (sen, zmęczenie, DOMS, stres).`,
  },
};

/** Normalizuje string (stary format) lub obiekt { simple, detail } */
export const normalizeInfo = (info) => {
  if (!info) return null;
  if (typeof info === 'string') return { simple: info, detail: null };
  return info;
};

export const hasInfo = (info) => {
  const n = normalizeInfo(info);
  return !!(n?.simple || n?.detail);
};
