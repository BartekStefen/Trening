import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ExerciseActionsModal = ({
  isVisible,
  exerciseName,
  onClose,
  onPlateCalc,
  onDropSet,
  onSwap,
  onDelete,
  onToggleSuperset,
  onMachineSettings,
  dropSetLimitReached,
  isInSuperset,
}) => (
  <Modal
    visible={isVisible}
    animationType="slide"
    transparent
    onRequestClose={onClose}
  >
    <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
      <View style={s.sheet}>
        <View style={s.handle} />
        <Text style={s.title} numberOfLines={1}>{exerciseName}</Text>

        <TouchableOpacity style={s.row} onPress={onPlateCalc} activeOpacity={0.7}>
          <View style={[s.iconBox, { backgroundColor: 'rgba(55,138,221,0.12)' }]}>
            <Ionicons name="barbell-outline" size={20} color="#378ADD" />
          </View>
          <Text style={s.rowLabel}>Wizualizacja sztangi</Text>
          <Ionicons name="chevron-forward" size={16} color="#3A3A3C" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.row, dropSetLimitReached && s.rowDisabled]}
          onPress={dropSetLimitReached ? undefined : onDropSet}
          activeOpacity={dropSetLimitReached ? 1 : 0.7}
        >
          <View style={[s.iconBox, { backgroundColor: 'rgba(167,139,250,0.12)' }]}>
            <Text style={s.dropIcon}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowLabel, dropSetLimitReached && s.rowLabelDisabled]}>
              Błyskawiczny Drop-Set
            </Text>
            {dropSetLimitReached && (
              <Text style={s.limitText}>Limit 3 drop-setów osiągnięty</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color="#3A3A3C" />
        </TouchableOpacity>

        <TouchableOpacity style={s.row} onPress={onSwap} activeOpacity={0.7}>
          <View style={[s.iconBox, { backgroundColor: 'rgba(142,142,147,0.12)' }]}>
            <Ionicons name="swap-horizontal" size={20} color="#8E8E93" />
          </View>
          <Text style={s.rowLabel}>Zmień ćwiczenie</Text>
          <Ionicons name="chevron-forward" size={16} color="#3A3A3C" />
        </TouchableOpacity>

        <TouchableOpacity style={s.row} onPress={onToggleSuperset} activeOpacity={0.7}>
          <View style={[s.iconBox, { backgroundColor: isInSuperset ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.08)' }]}>
            <Text style={s.superIcon}>{isInSuperset ? '🔗' : '⛓️'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowLabel, isInSuperset && { color: '#A78BFA' }]}>
              {isInSuperset ? 'Rozłącz Super-Serię' : 'Połącz Super-Serię'}
            </Text>
            <Text style={s.limitText}>
              {isInSuperset ? 'Usuwa połączenie z następnym ćwiczeniem' : 'Łączy z kolejnym ćwiczeniem neonową poświatą'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#3A3A3C" />
        </TouchableOpacity>

        {onMachineSettings && (
          <TouchableOpacity style={s.row} onPress={onMachineSettings} activeOpacity={0.7}>
            <View style={[s.iconBox, { backgroundColor: 'rgba(239,159,39,0.12)' }]}>
              <Ionicons name="settings-outline" size={20} color="#EF9F27" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Ustawienia maszyny</Text>
              <Text style={s.limitText}>Fotel i pozycja uchwytu (PIN)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#3A3A3C" />
          </TouchableOpacity>
        )}

        <View style={s.divider} />

        <TouchableOpacity style={s.row} onPress={onDelete} activeOpacity={0.7}>
          <View style={[s.iconBox, { backgroundColor: 'rgba(255,82,82,0.12)' }]}>
            <Ionicons name="trash-outline" size={20} color="#FF5252" />
          </View>
          <Text style={[s.rowLabel, { color: '#FF5252' }]}>Usuń ćwiczenie</Text>
          <Ionicons name="chevron-forward" size={16} color="#3A3A3C" />
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={s.cancelText}>Anuluj</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636366',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 14,
  },
  rowDisabled: { opacity: 0.4 },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropIcon:     { fontSize: 18 },
  superIcon:    { fontSize: 18 },
  rowLabel:     { flex: 1, fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  rowLabelDisabled: { color: '#636366' },
  limitText:    { fontSize: 11, color: '#636366', marginTop: 2 },
  divider:      { height: 0.5, backgroundColor: '#2C2C2E', marginVertical: 4 },
  cancelBtn:    { marginTop: 8, backgroundColor: '#2C2C2E', borderRadius: 16, padding: 16, alignItems: 'center' },
  cancelText:   { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

export default ExerciseActionsModal;