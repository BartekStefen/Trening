import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';

const STORAGE_KEY = '@shadow_rooms';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function ShadowRooms() {
  const { colors } = useTheme();
  const { workoutHistory } = useWorkoutContext();
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [expanded, setExpanded] = useState(false);

  const myTonnage = workoutHistory.reduce((a, w) => a + (w.tonnage ?? 0), 0);
  const mySessions = workoutHistory.length;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setRooms(JSON.parse(raw)); } catch {}
      }
    }).catch(() => {});
  }, []);

  const persist = useCallback((next) => {
    setRooms(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const createRoom = () => {
    const name = roomName.trim();
    if (!name) return;
    const code = uid().slice(-6).toUpperCase();
    persist([
      {
        id: uid(),
        name,
        code,
        members: [
          { id: 'me', name: 'Ty', tonnage: myTonnage, sessions: mySessions, isMe: true },
          { id: 'bot1', name: 'Alex', tonnage: Math.round(myTonnage * 0.85), sessions: Math.max(mySessions - 2, 0) },
          { id: 'bot2', name: 'Marta', tonnage: Math.round(myTonnage * 1.1), sessions: mySessions + 1 },
        ],
        createdAt: new Date().toISOString(),
      },
      ...rooms,
    ]);
    setRoomName('');
    Alert.alert('Pokój utworzony', `Kod zaproszenia: ${code}\n(Prywatny — tylko z kodem)`);
  };

  const joinRoom = () => {
    const code = roomName.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert('Błąd', 'Wpisz kod pokoju (min. 4 znaki).');
      return;
    }
    persist([
      {
        id: uid(),
        name: `Pokój #${code}`,
        code,
        members: [
          { id: 'me', name: 'Ty', tonnage: myTonnage, sessions: mySessions, isMe: true },
          { id: 'host', name: 'Host', tonnage: Math.round(myTonnage * 1.2), sessions: mySessions + 3 },
        ],
        createdAt: new Date().toISOString(),
      },
      ...rooms,
    ]);
    setRoomName('');
  };

  const deleteRoom = (id) => {
    Alert.alert('Usuń pokój', 'Na pewno usunąć ten Shadow Room?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => persist(rooms.filter((r) => r.id !== id)) },
    ]);
  };

  const sortedMembers = (members) =>
    [...members].sort((a, b) => b.tonnage - a.tonnage);

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.headerLeft} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
          <Ionicons name="people-outline" size={20} color={colors.accent} />
          <Text style={[s.title, { color: colors.textPrimary }]}>Shadow Rooms</Text>
        </TouchableOpacity>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => setExpanded((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.borderMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {expanded && (
        <>
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            Prywatne pokoje znajomych — rywalizacja tonażem (lokalnie)
          </Text>

          <View style={s.inputRow}>
            <TextInput
              style={[s.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              placeholder="Nazwa pokoju lub kod..."
              placeholderTextColor={colors.textTertiary}
              value={roomName}
              onChangeText={setRoomName}
            />
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.accent }]} onPress={createRoom}>
              <Ionicons name="add" size={20} color={colors.accentText ?? '#000'} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.border }]} onPress={joinRoom}>
              <Ionicons name="enter-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {rooms.length === 0 ? (
            <Text style={[s.empty, { color: colors.textSecondary }]}>
              Brak pokoi — utwórz lub dołącz kodem
            </Text>
          ) : (
            rooms.map((room) => (
              <View key={room.id} style={[s.room, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={s.roomHeader}>
                  <View>
                    <Text style={[s.roomName, { color: colors.textPrimary }]}>{room.name}</Text>
                    <Text style={[s.roomCode, { color: colors.textSecondary }]}>Kod: {room.code}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteRoom(room.id)}>
                    <Ionicons name="trash-outline" size={18} color="#FF5252" />
                  </TouchableOpacity>
                </View>
                {sortedMembers(room.members).map((m, idx) => (
                  <View key={m.id} style={s.memberRow}>
                    <Text style={[s.rank, { color: idx === 0 ? '#FAC775' : colors.textSecondary }]}>
                      #{idx + 1}
                    </Text>
                    <Text style={[s.memberName, { color: m.isMe ? colors.accent : colors.textPrimary }]}>
                      {m.name}{m.isMe ? ' (Ty)' : ''}
                    </Text>
                    <Text style={[s.memberTon, { color: colors.textSecondary }]}>
                      {m.tonnage >= 1000 ? `${(m.tonnage / 1000).toFixed(1)}t` : `${m.tonnage} kg`}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginHorizontal: 16, borderRadius: 20, padding: 16, borderWidth: 0.5, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 8, marginBottom: 12, lineHeight: 17 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  iconBtn: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 12, textAlign: 'center', paddingVertical: 12 },
  room: { borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 0.5 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  roomName: { fontSize: 14, fontWeight: '600' },
  roomCode: { fontSize: 10, marginTop: 2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  rank: { fontSize: 12, fontWeight: '700', width: 24 },
  memberName: { flex: 1, fontSize: 13 },
  memberTon: { fontSize: 12, fontWeight: '600' },
});
