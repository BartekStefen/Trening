import { useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MUSCLE_GROUPS = [
  { key: 'chest',      label: 'Klatka',       emoji: '🦍' },
  { key: 'back',       label: 'Plecy',         emoji: '🦇' },
  { key: 'shoulders',  label: 'Barki',         emoji: '🏋️' },
  { key: 'biceps',     label: 'Biceps',        emoji: '💪' },
  { key: 'triceps',    label: 'Triceps',       emoji: '🔱' },
  { key: 'legs',       label: 'Nogi',          emoji: '🦵' },
  { key: 'glutes',     label: 'Pośladki',      emoji: '🍑' },
  { key: 'abs',        label: 'Brzuch',        emoji: '🍫' },
  { key: 'calves',     label: 'Łydki',         emoji: '🦶' },
  { key: 'forearms',   label: 'Przedramiona',  emoji: '🤜' },
  { key: 'cardio',     label: 'Cardio',        emoji: '🏃' },
  { key: 'fullbody',   label: 'Full body',     emoji: '⚡' },
];

const EQUIPMENT = [
  'Sztanga', 'Hantle', 'Maszyna', 'Wyciąg', 'Kabelki',
  'Własna waga', 'Gumy', 'Kettlebell', 'Inne',
];

const DEFAULT_SETS = 3;

// Props:
//   isVisible
//   onAdd(exercise)  – przekazuje gotowy obiekt ćwiczenia do ekranu treningu
//   onClose()
const AddCustomExerciseModal = ({ isVisible, onAdd, onClose }) => {
  const [name, setName]           = useState('');
  const [selectedMuscle, setMuscle] = useState(null);
  const [selectedEquip, setEquip]   = useState(null);
  const [setsCount, setSetsCount]   = useState(DEFAULT_SETS);
  const [notes, setNotes]           = useState('');

  const canAdd = name.trim().length >= 2 && selectedMuscle;

  const handleAdd = () => {
    if (!canAdd) return;
    const muscle = MUSCLE_GROUPS.find((m) => m.key === selectedMuscle);
    const ts     = Date.now();

    const exercise = {
      id:          `custom_user_${ts}`,
      name:        name.trim(),
      muscleGroup: muscle?.label ?? '',
      muscles:     [muscle?.label ?? ''],
      description: notes.trim() || `Ćwiczenie niestandardowe · ${selectedEquip ?? 'Brak sprzętu'}`,
      equipment:   selectedEquip ?? 'Inne',
      alternatives:[],
      restDuration: 90,
      nextTrainingKg: null,
      image:       null,
      sets: Array.from({ length: setsCount }, (_, i) => ({
        id:          `cs_${ts}_${i}`,
        prevLog:     '—',
        kg:          '',
        reps:        '',
        rpe:         '',
        done:        false,
        suggested:   null,
        aiSuggested: false,
      })),
    };

    onAdd(exercise);
    resetAndClose();
  };

  const resetAndClose = () => {
    setName('');
    setMuscle(null);
    setEquip(null);
    setSetsCount(DEFAULT_SETS);
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <View style={s.screen}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={resetAndClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>

        <Text style={s.title}>Własne ćwiczenie</Text>
        <Text style={s.subtitle}>Dodaj do bieżącego treningu</Text>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nazwa */}
          <Text style={s.label}>Nazwa ćwiczenia *</Text>
          <TextInput
            style={s.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="np. Wyciskanie hantli na ławce skośnej"
            placeholderTextColor="#3A3A3C"
            maxLength={60}
            returnKeyType="done"
          />

          {/* Partia mięśniowa */}
          <Text style={s.label}>Partia mięśniowa *</Text>
          <View style={s.chipGrid}>
            {MUSCLE_GROUPS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[s.chip, selectedMuscle === m.key && s.chipActive]}
                onPress={() => setMuscle(m.key)}
                activeOpacity={0.7}
              >
                <Text style={s.chipEmoji}>{m.emoji}</Text>
                <Text style={[s.chipText, selectedMuscle === m.key && s.chipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sprzęt */}
          <Text style={s.label}>Sprzęt</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.equipRow}
          >
            {EQUIPMENT.map((eq) => (
              <TouchableOpacity
                key={eq}
                style={[s.equipChip, selectedEquip === eq && s.equipChipActive]}
                onPress={() => setEquip(eq)}
                activeOpacity={0.7}
              >
                <Text style={[s.equipText, selectedEquip === eq && s.equipTextActive]}>
                  {eq}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Liczba serii */}
          <Text style={s.label}>Liczba serii</Text>
          <View style={s.setsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[s.setChip, setsCount === n && s.setChipActive]}
                onPress={() => setSetsCount(n)}
                activeOpacity={0.7}
              >
                <Text style={[s.setChipText, setsCount === n && s.setChipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notatka */}
          <Text style={s.label}>Opis / technika (opcjonalnie)</Text>
          <TextInput
            style={s.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Krótki opis techniki lub uwagi..."
            placeholderTextColor="#3A3A3C"
            multiline
            numberOfLines={3}
            maxLength={200}
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity style={s.cancelBtn} onPress={resetAndClose} activeOpacity={0.7}>
            <Text style={s.cancelText}>Anuluj</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.addBtn, !canAdd && s.addBtnDisabled]}
            onPress={handleAdd}
            activeOpacity={canAdd ? 0.85 : 1}
          >
            <Ionicons name="add" size={18} color={canAdd ? '#000' : '#636366'} />
            <Text style={[s.addText, !canAdd && s.addTextDisabled]}>
              Dodaj do treningu
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#0A0A0A' },
  handle:   { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  title:    { fontSize: 22, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#8E8E93', paddingHorizontal: 20, marginBottom: 20 },
  scroll:   { paddingHorizontal: 20, paddingBottom: 32 },

  label:     { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 10, marginTop: 16, letterSpacing: 0.3 },
  nameInput: {
    backgroundColor: '#1C1C1E', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#2C2C2E',
    color: '#FFFFFF', fontSize: 16, padding: 14,
  },

  chipGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#1C1C1E', borderWidth: 0.5, borderColor: '#2C2C2E' },
  chipActive:    { backgroundColor: 'rgba(0,230,118,0.12)', borderColor: '#00E676' },
  chipEmoji:     { fontSize: 14 },
  chipText:      { fontSize: 13, color: '#636366', fontWeight: '500' },
  chipTextActive:{ color: '#00E676', fontWeight: '600' },

  equipRow:         { gap: 8, paddingBottom: 4 },
  equipChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1C1C1E', borderWidth: 0.5, borderColor: '#2C2C2E' },
  equipChipActive:  { backgroundColor: 'rgba(167,139,250,0.12)', borderColor: '#A78BFA' },
  equipText:        { fontSize: 13, color: '#636366', fontWeight: '500' },
  equipTextActive:  { color: '#A78BFA', fontWeight: '600' },

  setsRow:          { flexDirection: 'row', gap: 10 },
  setChip:          { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#2C2C2E' },
  setChipActive:    { backgroundColor: 'rgba(0,230,118,0.12)', borderColor: '#00E676' },
  setChipText:      { fontSize: 18, fontWeight: '700', color: '#636366' },
  setChipTextActive:{ color: '#00E676' },

  notesInput: {
    backgroundColor: '#1C1C1E', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#2C2C2E',
    color: '#FFFFFF', fontSize: 14, padding: 14,
    minHeight: 90,
  },

  footer:          { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 36, borderTopWidth: 0.5, borderColor: '#2C2C2E' },
  cancelBtn:       { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 0.5, borderColor: '#2C2C2E' },
  cancelText:      { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  addBtn:          { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#00E676', borderRadius: 16, padding: 16 },
  addBtnDisabled:  { backgroundColor: '#1C1C1E', borderWidth: 0.5, borderColor: '#2C2C2E' },
  addText:         { fontSize: 15, fontWeight: '700', color: '#000000' },
  addTextDisabled: { color: '#636366' },
});

export default AddCustomExerciseModal;