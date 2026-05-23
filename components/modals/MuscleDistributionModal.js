import { useMemo } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LiveMuscleMap from '../LiveMuscleMap';
import { INTENSITY_CAPS } from '../../constants/muscleConstants';

// ─── Grupy sekcji ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    title: 'Górna część ciała',
    muscles: [
      { key: 'chest_upper',     label: 'Klatka – góra' },
      { key: 'chest_lower',     label: 'Klatka – dół' },
      { key: 'back_lat',        label: 'Plecy (najszerszy)' },
      { key: 'back_upper',      label: 'Plecy górne (trapez)' },
    ],
  },
  {
    title: 'Ramiona & barki',
    muscles: [
      { key: 'shoulders_front', label: 'Bark – przód' },
      { key: 'shoulders_side',  label: 'Bark – bok' },
      { key: 'shoulders_rear',  label: 'Bark – tył' },
      { key: 'biceps',          label: 'Biceps' },
      { key: 'triceps',         label: 'Triceps' },
      { key: 'forearms',        label: 'Przedramiona' },
    ],
  },
  {
    title: 'Rdzeń',
    muscles: [
      { key: 'abs',             label: 'Brzuch' },
    ],
  },
  {
    title: 'Dolna część ciała',
    muscles: [
      { key: 'glutes',          label: 'Pośladki' },
      { key: 'quads',           label: 'Czworogłowy' },
      { key: 'hamstrings',      label: 'Dwugłowy uda' },
      { key: 'calves',          label: 'Łydki' },
    ],
  },
];

// Kolor odpowiadający intensywności SVG (5 stopni)
const intensityToColor = (v) => {
  if (v <= 0)    return null;          // nieaktywna
  if (v < 0.25)  return '#7B1B1B';    // niska
  if (v < 0.55)  return '#D32F2F';    // średnia
  if (v < 0.85)  return '#FF3D00';    // wysoka
  return           '#FF6E40';          // szczyt
};

// ─── MuscleDistributionModal ──────────────────────────────────────────────────
const MuscleDistributionModal = ({ isVisible, heatmap, onClose }) => {
  const { setCounts, totalSets, activeCount } = useMemo(() => {
    const counts = {};
    let total = 0;
    let active = 0;

    SECTIONS.forEach(({ muscles }) => {
      muscles.forEach(({ key }) => {
        const intensity = heatmap?.[key] ?? 0;
        const n = Math.round(intensity * (INTENSITY_CAPS[key] ?? 5));
        counts[key] = n;
        total += n;
        if (n > 0) active++;
      });
    });

    return { setCounts: counts, totalSets: total, activeCount: active };
  }, [heatmap]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        {/* Uchwyt */}
        <View style={styles.handle} />

        {/* Nagłówek */}
        <View style={styles.header}>
          <Text style={styles.title}>Rozkład Mięśni</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Sylwetki SVG */}
          <View style={styles.mapContainer}>
            <LiveMuscleMap heatmap={heatmap} scale={0.9} />
          </View>

          {/* Pasek statystyk */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{activeCount}</Text>
              <Text style={styles.statLabel}>aktywnych</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statLabel}>serii łącznie</Text>
            </View>
          </View>

          {/* Sekcje */}
          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>

              <View style={styles.card}>
                {section.muscles.map(({ key, label }, idx) => {
                  const count     = setCounts[key] ?? 0;
                  const intensity = heatmap?.[key] ?? 0;
                  const color     = intensityToColor(intensity);
                  const isLast    = idx === section.muscles.length - 1;

                  return (
                    <View key={key}>
                      <View style={[styles.muscleRow, color && styles.muscleRowActive]}>
                        {/* Wskaźnik intensywności */}
                        <View
                          style={[
                            styles.indicator,
                            { backgroundColor: color ?? '#2C2C2E' },
                          ]}
                        />

                        <Text style={[styles.muscleName, color && styles.muscleNameActive]}>
                          {label}
                        </Text>

                        <Text style={[styles.muscleCount, color && { color }]}>
                          {count}
                        </Text>
                      </View>

                      {!isLast && <View style={styles.rowDivider} />}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={styles.bottomPad} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },

  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    position: 'relative',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: {
    paddingHorizontal: 16,
  },

  mapContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 4,
  },

  // ── Statystyki ──────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2C2C2E',
  },
  statChip: {
    alignItems: 'center',
    gap: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#636366',
    fontWeight: '400',
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3C',
  },

  // ── Sekcje ──────────────────────────────────────────────────────────────────
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#48484A',
    letterSpacing: 1.0,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
  },

  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingRight: 16,
    gap: 12,
  },
  muscleRowActive: {
    backgroundColor: 'rgba(255,62,0,0.04)',
  },

  indicator: {
    width: 3,
    height: 28,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },

  muscleName: {
    flex: 1,
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  muscleNameActive: {
    color: '#FFFFFF',
  },

  muscleCount: {
    fontSize: 15,
    color: '#3A3A3C',
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'right',
  },

  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#1C1C1E',
    marginLeft: 19,
  },

  bottomPad: {
    height: 48,
  },
});

export default MuscleDistributionModal;
