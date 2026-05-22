import { useMemo } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LiveMuscleMap from '../LiveMuscleMap';
import { MUSCLE_GROUPS, INTENSITY_CAPS } from '../../constants/muscleConstants';

// ─── MuscleDistributionModal ──────────────────────────────────────────────────
// Widok inspirowany Hevy: duże sylwetki SVG + czysta tabela serii per partia.
//
// Props:
//   isVisible – boolean
//   heatmap   – { [region]: 0.0–1.0 } z useMuscleHeatmap
//   onClose() – callback zamknięcia
const MuscleDistributionModal = ({ isVisible, heatmap, onClose }) => {
  // Przybliżona liczba zaliczonych serii (odwrotna normalizacja przez INTENSITY_CAPS)
  const setCounts = useMemo(() => {
    const counts = {};
    MUSCLE_GROUPS.forEach(({ key }) => {
      const intensity = heatmap?.[key] ?? 0;
      counts[key] = Math.round(intensity * (INTENSITY_CAPS[key] ?? 5));
    });
    return counts;
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
            <LiveMuscleMap heatmap={heatmap} scale={1.35} />
          </View>

          {/* Nagłówek tabeli */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderLabel}>Mięsień</Text>
            <Text style={styles.tableHeaderLabel}>Zaliczone Serie</Text>
          </View>
          <View style={styles.tableDivider} />

          {/* Wiersze mięśni */}
          {MUSCLE_GROUPS.map(({ key, label }, idx) => {
            const count = setCounts[key] ?? 0;
            const isLast = idx === MUSCLE_GROUPS.length - 1;
            return (
              <View key={key}>
                <View style={styles.muscleRow}>
                  <Text style={styles.muscleName}>{label}</Text>
                  <Text style={[styles.muscleCount, count > 0 && styles.muscleCountActive]}>
                    {count}
                  </Text>
                </View>
                {!isLast && <View style={styles.rowDivider} />}
              </View>
            );
          })}

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
    paddingHorizontal: 20,
  },

  mapContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },

  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableHeaderLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#636366',
    letterSpacing: 0.2,
  },
  tableDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2C2C2E',
    marginBottom: 2,
  },

  muscleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  muscleName: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  muscleCount: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  muscleCountActive: {
    color: '#FFFFFF',
  },

  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#1C1C1E',
    marginHorizontal: 4,
  },

  bottomPad: {
    height: 40,
  },
});

export default MuscleDistributionModal;
