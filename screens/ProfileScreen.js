import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

// Nawyki trzymam jako stan lokalny - docelowo będą synchronizowane z Firebase
// i resetowane każdego dnia przez Cloud Function
const INITIAL_HABITS = [
  { id: '1', name: 'Kreatyna 5g',  icon: 'fitness-outline',    done: true  },
  { id: '2', name: 'Sen 8h',       icon: 'moon-outline',       done: false },
];

export default function ProfileScreen() {
  // useState zamiast zwykłej zmiennej - React nie wie o zmianie stanu, jeśli
  // mutujemy tablicę bezpośrednio. useState wymusza ponowny render po odhaczeniu nawyku
  const [habits, setHabits] = useState(INITIAL_HABITS);

  const toggleHabit = (id) => {
    // Tworzymy nową tablicę zamiast mutować istniejącą - zasada niemutowalności stanu w React
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h))
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      {/* Placeholder heatmapy sylwetki - docelowo zastąpiony SVG/Canvas z kolorowanymi
          partiami mięśniowymi na podstawie historii treningów z Firebase */}
      <View style={styles.heatmapPlaceholder}>
        <Ionicons name="body-outline" size={52} color="#3A3A3C" />
        <Text style={styles.heatmapTitle}>Heatmapa sylwetki</Text>
        <Text style={styles.heatmapSub}>
          Po pierwszych treningach zaświeci się tu mapa{'\n'}najczęściej trenowanych partii ciała
        </Text>
      </View>

      {/* ---- Sekcja: Codzienne nawyki ---- */}
      <Text style={styles.sectionTitle}>Codzienne nawyki</Text>

      {habits.map((habit) => (
        // Cały kafelek jest przyciskiem odhaczającym nawyk, nie tylko checkbox
        <TouchableOpacity
          key={habit.id}
          style={styles.habitCard}
          onPress={() => toggleHabit(habit.id)}
          activeOpacity={0.7}
        >
          {/* Checkbox - zmienia wygląd w zależności od stanu `done` */}
          <View style={[styles.checkbox, habit.done && styles.checkboxDone]}>
            {habit.done && (
              <Ionicons name="checkmark" size={16} color="#000000" />
            )}
          </View>

          <View style={styles.habitTextWrapper}>
            <Text style={[styles.habitName, habit.done && styles.habitNameDone]}>
              {habit.name}
            </Text>
            <Text style={styles.habitSub}>
              {habit.done ? 'Dzisiaj: odhaczone ✓' : 'Dzisiaj: jeszcze nie'}
            </Text>
          </View>

          <Ionicons
            name={habit.icon}
            size={22}
            // Ikona blednie po odhaczeniu - subtelnie sygnalizuje "już zrobione"
            color={habit.done ? '#3A3A3C' : '#8E8E93'}
          />
        </TouchableOpacity>
      ))}

      {/* ---- Sekcja: Ustawienia ---- */}
      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Ustawienia</Text>

      {/* Kafelek motywu - placeholder pod przyszły przełącznik Jasny/Ciemny/Systemowy.
          Chevron po prawej sygnalizuje, że kliknięcie otworzy nowy widok z opcjami */}
      <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIconWrapper}>
            <Ionicons name="contrast-outline" size={20} color="#8E8E93" />
          </View>
          <Text style={styles.settingName}>Motyw aplikacji</Text>
        </View>
        <View style={styles.settingRight}>
          <Text style={styles.settingValue}>Ciemny</Text>
          <Ionicons name="chevron-forward" size={18} color="#3A3A3C" />
        </View>
      </TouchableOpacity>

      {/* Miejsce na kolejne opcje ustawień w przyszłych sprintach */}
      <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIconWrapper}>
            <Ionicons name="notifications-outline" size={20} color="#8E8E93" />
          </View>
          <Text style={styles.settingName}>Powiadomienia</Text>
        </View>
        <View style={styles.settingRight}>
          <Text style={styles.settingValue}>Włączone</Text>
          <Ionicons name="chevron-forward" size={18} color="#3A3A3C" />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    paddingBottom: 40,
  },

  // --- Nagłówek ---
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // --- Placeholder heatmapy ---
  // Przerywana ramka (dashed border) sygnalizuje użytkownikowi, że to miejsce
  // na przyszłą funkcję - konwencja znana z narzędzi projektowych (Figma, Sketch)
  heatmapPlaceholder: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 28,
    borderRadius: 20,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderStyle: 'dashed',
    gap: 10,
    paddingHorizontal: 24,
  },
  heatmapTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3A3A3C',
  },
  heatmapSub: {
    fontSize: 13,
    color: '#3A3A3C',
    textAlign: 'center',
    lineHeight: 19,
  },

  // --- Wspólny nagłówek sekcji ---
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleSpaced: {
    marginTop: 24,
  },

  // --- Kafelek nawyku ---
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
    gap: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stan odhaczony - wypełnienie zielenią zamiast pustej ramki
  checkboxDone: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  habitTextWrapper: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Odhaczony nawyk szarzeje - wzorzec znany z systemowych aplikacji zadań (Reminders)
  habitNameDone: {
    color: '#8E8E93',
  },
  habitSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 3,
  },

  // --- Kafelek ustawienia ---
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  // Kwadratowa ikona z lekko jaśniejszym tłem - wzorzec z iOS Settings
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingName: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
});