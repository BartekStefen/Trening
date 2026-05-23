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
    simple: `Ocena od 1 do 10: na ile sensownie iść dziś na siłownię.

Po co to?
Żeby nie dobijać się, gdy jesteś zmęczony po wczorajszym ciężkim treningu albo śpisz mało — albo odwrotnie: wiedzieć, że możesz dać z siebie więcej.

Im wyżej, tym lepiej się regenerujesz. Odhacz sen i kreatynę w nawykach — aplikacja to uwzględni.`,
    detail: `Ready-to-Lift to heurystyka gotowości, nie diagnoza medyczna. Bazuje na:

• ACWR (obciążenie ostre ÷ chroniczne) — w badaniach sportowych strefa ~0,8–1,3 wiąże się z niższym ryzykiem kontuzji; skok powyżej ~1,5 bywa sygnałem alarmowym (Gabbett, 2016).

• Czas od ostatniej sesji — regeneracja mięśniowa po ciężkim treningu siłowym trwa zwykle 48–72 h na dany region.

• RPE ostatniej sesji — skala Borga (6–10) odzwierciedla submaksymalny wysiłek; RPE ≥9,5 sugeruje dużą zmęczalność.

• Sen i kreatyna (nawyki) — AASM zaleca 7–9 h snu dla dorosłych; ISSN potwierdza skuteczność 3–5 g monohydratu kreatyny dziennie u zdrowych osób trenujących siłowo.

Wynik 1–10 pomaga zdecydować, czy dziś iść na pełnię, czy lekko — nie zastępuje konsultacji z lekarzem przy bólu lub chorobie.`,
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
    simple: `Szacuje, jak „świeży” będziesz za tydzień lub dwa, jeśli będziesz trenował tak jak teraz.

Po co to?
Gdy za szybko dokładasz ciężaru i objętości, ciało nie nadąża — siła spada, ryzyko kontuzji rośnie. Spadający wykres to sygnał: zrób tydzień lżej albo odpocznij.`,
    detail: `Prognoza opiera się na tempie wzrostu tygodniowego tonażu — uproszczony model zmęczenia kumulacyjnego, inspirowany koncepcją ACWR i przetrenowania niefatigue (Meeusen et al., 2013).

Gdy objętość rośnie >10–15% tydzień do tygodnia przez kilka tygodni, organizm może nie nadążać z superkompensacją — spadek „gotowości siłowej” na wykresie to sygnał do deloadu, większego snu lub redukcji objętości, a nie wyrok medyczny.

Jeśli odczuwasz chroniczne zmęczenie, bezsenność lub spadek libido — skonsultuj się z lekarzem.`,
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

  habits: {
    simple: `Codzienna lista: np. kreatyna i sen. Stuknij, żeby odhaczyć.

Po co to?
Regularny sen i suplementacja wspierają trening. Odhaczone nawyki lekko podbijają ocenę gotowości w aplikacji — przypominają, że regeneracja też się liczy.`,
    detail: `Sen: American Academy of Sleep Medicine zaleca ≥7 h dla dorosłych; chroniczny deficyt snu obniża wydolność, regenerację hormonalną i zwiększa ryzyko urazów.

Kreatyna: stanowisko ISSN (2017) — monohydrat 3–5 g/d jest bezpieczny i skuteczny u zdrowych osób; wspiera moc i objętość treningową. Nie zastępuje białka ani snu.

Odhaczenie nawyków lekko podbija ocenę gotowości treningowej w aplikacji.`,
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
