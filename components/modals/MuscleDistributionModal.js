import { useMemo } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LiveMuscleMap from '../LiveMuscleMap';

// ─── Konfiguracja partii mięśniowych ─────────────────────────────────────────
// Każda partia ma polską nazwę, emoji i klucz regionu zgodny z LiveMuscleMap.
const MUSCLE_GROUPS = [
  { key: 'chest',      label: 'Klatka piersiowa', emoji: '🦍' },
  { key: 'back_lat',   label: 'Plecy (najszerszy)', emoji: '🦇' },
  { key: 'back_upper', label: 'Plecy górne (trapez)', emoji: '🔼' },
  { key: 'shoulders',  label: 'Barki',              emoji: '🏋️' },
  { key: 'biceps',     label: 'Biceps',             emoji: '💪' },
  { key: 'triceps',    label: 'Triceps',            emoji: '🔱' },
  { key: 'forearms',   label: 'Przedramiona',       emoji: '🤜' },
  { key: 'abs',        label: 'Brzuch',             emoji: '🍫' },
  { key: 'glutes',     label: 'Pośladki',           emoji: '🍑' },
  { key: 'quads',      label: 'Czworogłowy',        emoji: '🦵' },
  { key: 'hamstrings', label: 'Dwugłowy uda',       emoji: '🦿' },
  { key: 'calves',     label: 'Łydki',              emoji: '🦶' },
];

// ─── MuscleDistributionModal ──────────────────────────────────────────────────
// Modal otwierany przez kliknięcie ikonki ludzika w HUDzie.
// Zawiera:
//   • Dużą, szczegółową mapę SVG LiveMuscleMap (przód + tył)
//   • Listę partii z paskami postępu pokazującymi liczbę serii
//
// Props:
//   isVisible – boolean
//   heatmap   – { [region]: liczba_serii } z buildMuscleHeatmap
//   onClose() – callback zamknięcia
const MuscleDistributionModal = ({ isVisible, heatmap, onClose }) => {
  // Filtrujemy tylko partie które mają co najmniej 1 serię – reszta szara
  const activeMuscles = useMemo(
    () => Object.keys(heatmap ?? {}).filter((k) => (heatmap[k] ?? 0) > 0),
    [heatmap],
  );

  // Maksymalna liczba serii w jakiejkolwiek partii – do normalizacji paska
  const maxSets = useMemo(
    () => Math.max(1, ...Object.values(heatmap ?? {})),
    [heatmap],
  );

  const totalSets = useMemo(
    () => Object.values(heatmap ?? {}).reduce((a, b) => a + b, 0),
    [heatmap],
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        {/* ── Uchwyt i nagłówek ── */}
        <View style={styles.handle} />
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>

        <Text style={styles.title}>Mapa mięśni</Text>
        <Text style={styles.subtitle}>
          {activeMuscles.length > 0
            ? `${activeMuscles.length} partii · ${totalSets} serii łącznie`
            : 'Brak zaliczonych serii'}
        </Text>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Duża mapa SVG ── */}
          <View style={styles.mapWrapper}>
            <LiveMuscleMap activeMuscles={heatmap} />
            <View style={styles.mapLegend}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#2C2C2E' }]} />
                <Text style={styles.legendText}>Nieaktywna</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9999' }]} />
                <Text style={styles.legendText}>1 seria</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#FF3333' }]} />
                <Text style={styles.legendText}>3 serie</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#CC0000' }]} />
                <Text style={styles.legendText}>4+</Text>
              </View>
            </View>
          </View>

          {/* ── Separator ── */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Rozkład obciążenia</Text>

          {/* ── Paski postępu dla każdej partii ── */}
          {MUSCLE_GROUPS.map(({ key, label, emoji }) => {
            const sets = heatmap?.[key] ?? 0;
            const pct  = sets / maxSets; // 0–1
            const isActive = sets > 0;

            return (
              <View key={key} style={styles.barRow}>
                {/* Emoji + nazwa */}
                <Text style={styles.barEmoji}>{emoji}</Text>
                <View style={styles.barInfo}>
                  <View style={styles.barLabelRow}>
                    <Text style={[styles.barLabel, isActive && styles.barLabelActive]}>
                      {label}
                    </Text>
                    <Text style={[styles.barCount, isActive && styles.barCountActive]}>
                      {sets > 0 ? `${sets} ${sets === 1 ? 'seria' : sets < 5 ? 'serie' : 'serii'}` : '—'}
                    </Text>
                  </View>
                  {/* Track + fill */}
                  <View style={styles.barTrack}>
                    {sets > 0 && (
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(pct * 100, 4)}%`,
                            backgroundColor: fillColor(sets),
                          },
                        ]}
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {/* Komunikat gdy brak danych */}
          {totalSets === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={36} color="#3A3A3C" />
              <Text style={styles.emptyText}>
                Zalicz pierwszą serię, aby zobaczyć rozkład obciążenia.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Kolor paska zależny od liczby serii – spójny z LiveMuscleMap
const fillColor = (sets) => {
  if (sets === 1) return '#FF9999';
  if (sets === 2) return '#FF6666';
  if (sets === 3) return '#FF3333';
  return '#CC0000';
};

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#0A0A0A' },
  handle:   { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  title:    { fontSize: 22, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#8E8E93', paddingHorizontal: 20, marginBottom: 8 },
  scroll:   { paddingHorizontal: 20, paddingBottom: 48 },

  // Mapa SVG
  mapWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  mapLegend:  { gap: 10 },
  legendRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#8E8E93' },

  divider:      { height: 0.5, backgroundColor: '#2C2C2E', marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#636366', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 },

  // Wiersze pasków
  barRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  barEmoji:  { fontSize: 18, width: 26, textAlign: 'center' },
  barInfo:   { flex: 1, gap: 5 },
  barLabelRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel:      { fontSize: 13, color: '#636366', fontWeight: '500' },
  barLabelActive:{ color: '#FFFFFF' },
  barCount:      { fontSize: 11, color: '#636366', fontWeight: '600' },
  barCountActive:{ color: '#A78BFA' },
  barTrack: { height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 3 },

  // Pusty stan
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyText:  { fontSize: 14, color: '#636366', textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
});

export default MuscleDistributionModal;