import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TEMPLATES = [
  { id: '1', tag: 'Góra ciała', title: 'Upper', meta: '6 ćwiczeń · klatka, barki, triceps' },
  { id: '2', tag: 'Dół ciała',  title: 'Lower', meta: '5 ćwiczeń · nogi, pośladki' },
];

export default function TrainingScreen({ navigation }) {

  const renderTemplate = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ActiveWorkout')}
    >
      <View style={styles.cardContent}>
        <View style={styles.tagWrapper}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.meta}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#3A3A3C" />
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={TEMPLATES}
      keyExtractor={(item) => item.id}
      renderItem={renderTemplate}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <Text style={styles.greeting}>Dzień dobry 👋</Text>
            <Text style={styles.title}>Trening</Text>
          </View>

          {/* Główne CTA – start pustej sesji treningowej */}
          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ActiveWorkout')}
          >
            <View style={styles.startIconWrapper}>
              <Ionicons name="add" size={26} color="#000000" />
            </View>
            <View>
              <Text style={styles.startButtonText}>Rozpocznij pusty trening</Text>
              <Text style={styles.startButtonSubText}>Zacznij od zera, dodaj ćwiczenia</Text>
            </View>
          </TouchableOpacity>

          {/* Nawigacja do biblioteki ćwiczeń i kreatora planów.
              Fioletowy akcent (#A78BFA) odróżnia tę akcję od zielonego CTA –
              każdy moduł aplikacji operuje na własnym kolorze w palecie akcentów */}
          <TouchableOpacity
            style={styles.libraryButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('ExercisesLibrary')}
          >
            <View style={styles.libraryIconWrapper}>
              <Ionicons name="search" size={22} color="#A78BFA" />
            </View>
            <View style={styles.libraryTextGroup}>
              <Text style={styles.libraryTitle}>Baza ćwiczeń i Kreator Planu</Text>
              <Text style={styles.librarySub}>Przeglądaj ćwiczenia i układaj nowe rutyny</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#3A3A3C" />
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Twoje szablony</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Zarządzaj</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#000000' },
  contentContainer: { paddingBottom: 32 },

  header:   { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  greeting: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  title:    { fontSize: 32, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E676',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 18,
    gap: 16,
  },
  startIconWrapper: {
    width: 44, height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText:    { fontSize: 16, fontWeight: '600', color: '#000000' },
  startButtonSubText: { fontSize: 12, color: 'rgba(0,0,0,0.55)', marginTop: 3 },

  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  libraryIconWrapper: {
    width: 44, height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(167,139,250,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryTextGroup: { flex: 1 },
  libraryTitle:     { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  librarySub:       { fontSize: 12, color: '#8E8E93', marginTop: 3 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  sectionLink:  { fontSize: 14, color: '#00E676' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 18,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  cardContent: { flex: 1 },
  tagWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,230,118,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  tagText:   { fontSize: 11, fontWeight: '500', color: '#00E676' },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', marginBottom: 5 },
  cardMeta:  { fontSize: 13, color: '#8E8E93' },
});