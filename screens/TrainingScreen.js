import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutContext } from '../context/WorkoutContext';

// Wbudowane szablony – ID mapuje się do gotowych zestawów ćwiczeń w ActiveWorkoutScreen
const BUILTIN_TEMPLATES = [
  { id: 'upper', tag: 'Góra ciała', title: 'Upper Power', meta: '5 ćwiczeń · klatka, barki, triceps, biceps' },
  { id: 'lower', tag: 'Dół ciała',  title: 'Lower Strength', meta: '4 ćwiczenia · nogi, pośladki, łydki' },
];

const formatTime = (s) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((v) => String(v).padStart(2, '0')).join(':');

export default function TrainingScreen({ navigation }) {
  const { activeWorkout, customPlans } = useWorkoutContext();

  // Łączymy szablony wbudowane z planami z Kreatora
  const allTemplates = [
    ...BUILTIN_TEMPLATES,
    ...customPlans.map((p) => ({
      id:      p.id,
      tag:     'Mój plan',
      title:   p.name,
      meta:    `${p.exercises?.length ?? 0} ćwiczeń`,
      custom:  true,
      // Przekazujemy DOKŁADNIE te ćwiczenia, które wybrał użytkownik w Kreatorze
      exercises: p.exercises,
    })),
  ];

  const renderTemplate = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, item.custom && styles.cardCustom]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ActiveWorkout', {
        templateId:   item.id,
        templateName: item.title,
        // Dla planów własnych przekazujemy tablicę ćwiczeń; dla wbudowanych null
        customExercises: item.exercises ?? null,
      })}
    >
      <View style={styles.cardContent}>
        <View style={[styles.tagWrapper, item.custom && styles.tagWrapperCustom]}>
          <Text style={[styles.tagText, item.custom && styles.tagTextCustom]}>{item.tag}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.meta}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#3A3A3C" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={allTemplates}
        keyExtractor={(item) => item.id}
        renderItem={renderTemplate}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.greeting}>Dzień dobry 👋</Text>
              <Text style={styles.title}>Trening</Text>
            </View>

            {/* Nowy pusty trening – otwiera ActiveWorkout bez ćwiczeń */}
            <TouchableOpacity
              style={styles.startButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ActiveWorkout', {
                templateId: null,
                templateName: 'Pusty trening',
                customExercises: [],
              })}
            >
              <View style={styles.startIconWrapper}>
                <Ionicons name="add" size={26} color="#000000" />
              </View>
              <View>
                <Text style={styles.startButtonText}>Nowy pusty trening</Text>
                <Text style={styles.startButtonSubText}>Zacznij od zera i dodaj ćwiczenia</Text>
              </View>
            </TouchableOpacity>

            {/* Baza ćwiczeń i Kreator */}
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
              <TouchableOpacity><Text style={styles.sectionLink}>Zarządzaj</Text></TouchableOpacity>
            </View>
          </View>
        }
      />

      {/* Floating Workout Bar – widoczny tylko gdy trening jest zminimalizowany */}
      {activeWorkout && (
        <TouchableOpacity
          style={styles.floatingBar}
          onPress={() => navigation.navigate('ActiveWorkout')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingLeft}>
            <View style={styles.floatingPulse} />
            <View style={{ flex: 1 }}>
              <Text style={styles.floatingTitle} numberOfLines={1}>
                ⚡ Aktywny trening: {activeWorkout.workoutName}
              </Text>
              <Text style={styles.floatingSub}>
                {formatTime(activeWorkout.timerSec ?? 0)} · {activeWorkout.doneSets ?? 0} serii
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-up" size={20} color="#000000" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#000000' },
  contentContainer: { paddingBottom: 16 },
  header:   { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  greeting: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  title:    { fontSize: 32, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  startButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#00E676',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, padding: 18, gap: 16,
  },
  startIconWrapper:   { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  startButtonText:    { fontSize: 16, fontWeight: '600', color: '#000000' },
  startButtonSubText: { fontSize: 12, color: 'rgba(0,0,0,0.55)', marginTop: 3 },

  libraryButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#121212',
    marginHorizontal: 16, marginBottom: 24,
    borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 0.5, borderColor: 'rgba(167,139,250,0.3)',
  },
  libraryIconWrapper: { width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(167,139,250,0.12)', justifyContent: 'center', alignItems: 'center' },
  libraryTextGroup:   { flex: 1 },
  libraryTitle:       { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  librarySub:         { fontSize: 12, color: '#8E8E93', marginTop: 3 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle:  { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  sectionLink:   { fontSize: 14, color: '#00E676' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#121212',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 18, padding: 18,
    borderWidth: 0.5, borderColor: '#2C2C2E',
  },
  cardCustom:       { borderColor: 'rgba(167,139,250,0.4)' },
  cardContent:      { flex: 1 },
  tagWrapper:       { alignSelf: 'flex-start', backgroundColor: 'rgba(0,230,118,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  tagWrapperCustom: { backgroundColor: 'rgba(167,139,250,0.12)' },
  tagText:          { fontSize: 11, fontWeight: '500', color: '#00E676' },
  tagTextCustom:    { color: '#A78BFA' },
  cardTitle:        { fontSize: 17, fontWeight: '600', color: '#FFFFFF', marginBottom: 5 },
  cardMeta:         { fontSize: 13, color: '#8E8E93' },

  floatingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#00E676',
    marginHorizontal: 12, marginBottom: 10,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13,
    shadowColor: '#00E676', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  floatingLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  floatingPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.35)' },
  floatingTitle: { fontSize: 14, fontWeight: '700', color: '#000000' },
  floatingSub:   { fontSize: 11, color: 'rgba(0,0,0,0.55)', marginTop: 2 },
});