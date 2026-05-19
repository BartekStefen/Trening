import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Dane szablonów trzymam poza komponentem - to stała lista, która nie zmienia się w czasie,
// więc nie ma sensu deklarować jej wewnątrz komponentu i tworzyć na nowo przy każdym renderze
const TEMPLATES = [
  {
    id: '1',
    tag: 'Góra ciała',
    title: 'Upper',
    meta: '6 ćwiczeń · klatka, barki, triceps',
  },
  {
    id: '2',
    tag: 'Dół ciała',
    title: 'Lower',
    meta: '5 ćwiczeń · nogi, pośladki',
  },
];

export default function TrainingScreen() {
  // Wydzielam renderowanie kafelka do osobnej funkcji dla czytelności FlatList.
  // Dzięki temu właściwość renderItem w FlatList nie jest anonimową funkcją inline,
  // co pomaga React rozpoznać, kiedy nie trzeba ponownie renderować kafelka.
  const renderTemplate = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        <View style={styles.tagWrapper}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.meta}</Text>
      </View>
      {/* Ikona strzałki sygnalizuje użytkownikowi, że kafelek jest klikalny */}
      <Ionicons name="chevron-forward" size={20} color="#3A3A3C" />
    </TouchableOpacity>
  );

  return (
    // FlatList jako kontener główny zamiast ScrollView + map() -
    // wirtualizuje listę, renderując tylko widoczne elementy.
    // Przy krótkich listach różnica jest nieodczuwalna, ale to poprawny nawyk na przyszłość.
    <FlatList
      data={TEMPLATES}
      keyExtractor={(item) => item.id}
      renderItem={renderTemplate}
      // ListHeaderComponent pozwala umieścić nagłówek i przycisk CTA WEWNĄTRZ FlatList,
      // dzięki czemu cała zawartość ekranu przewija się razem jako jedna całość
      ListHeaderComponent={
        <View>
          {/* Nagłówek ekranu */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Dzień dobry 👋</Text>
            <Text style={styles.title}>Trening</Text>
          </View>

          {/* Główny przycisk CTA - kolor #00E676 (neonowa zieleń) wyróżnia go jako
              główną akcję na ekranie, zgodnie z paletą True Dark Mode całej aplikacji */}
          <TouchableOpacity style={styles.startButton} activeOpacity={0.85}>
            <View style={styles.startIconWrapper}>
              <Ionicons name="add" size={26} color="#000000" />
            </View>
            <View>
              <Text style={styles.startButtonText}>Rozpocznij pusty trening</Text>
              <Text style={styles.startButtonSubText}>Zacznij od zera, dodaj ćwiczenia</Text>
            </View>
          </TouchableOpacity>

          {/* Nagłówek sekcji szablonów z linkiem akcji po prawej */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Twoje szablony</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Zarządzaj</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // contentContainerStyle odpowiada za wewnętrzny padding listy,
  // czyli przestrzeń między krawędzią ekranu a zawartością przewijaną
  contentContainer: {
    paddingBottom: 32,
  },

  // --- Nagłówek ---
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // --- Przycisk "Rozpocznij pusty trening" ---
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E676',
    marginHorizontal: 16,
    marginBottom: 28,
    borderRadius: 20,
    padding: 18,
    gap: 16,
  },
  // Ciemne kółko z ikoną "+" odcina się od zielonego tła przycisku
  startIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  startButtonSubText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.55)',
    marginTop: 3,
  },

  // --- Nagłówek sekcji szablonów ---
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionLink: {
    fontSize: 14,
    color: '#00E676',
  },

  // --- Kafelek szablonu ---
  // Kolor #1C1C1E to standardowy "elevated surface" w ekosystemie Apple Dark Mode -
  // wyraźnie odcina się od czystej czerni tła bez bycia przesadnie jasnym
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 18,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  cardContent: {
    flex: 1,
  },
  // Pill z tagiem kategorii - subtelne zielone tło zamiast zwykłego tekstu,
  // żeby kategoria rzucała się w oczy bez przytłaczania
  tagWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#00E676',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  cardMeta: {
    fontSize: 13,
    color: '#8E8E93',
  },
});