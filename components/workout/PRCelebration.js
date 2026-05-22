import { useEffect, useRef } from 'react';
import {
  Animated, Easing, Modal, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Pojedynczy konfetti-kwadrat lecący z góry
const ConfettiPiece = ({ color, startX, delay, size }) => {
  const y       = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate  = useRef(new Animated.Value(0)).current;
  const x       = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 60;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y, {
          toValue: 520,
          duration: 1800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: drift,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 6], outputRange: ['0deg', '1080deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: startX,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size * 0.2,
        transform: [{ translateY: y }, { translateX: x }, { rotate: spin }],
        opacity,
      }}
    />
  );
};

const CONFETTI_COLORS = [
  '#00E676', '#EF9F27', '#FF5252', '#378ADD',
  '#A78BFA', '#FAC775', '#FF9800', '#E91E63',
];

const generatePieces = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: 20 + Math.random() * 340,
    delay: Math.random() * 600,
    size: 6 + Math.random() * 8,
  }));

const PIECES = generatePieces(40);

const PRCelebration = ({ visible, exerciseName, newKg, newReps, onClose }) => {
  const scale   = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    return () => {
      scale.setValue(0.4);
      opacity.setValue(0);
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        {/* Konfetti */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {PIECES.map((p) => (
            <ConfettiPiece key={p.id} {...p} />
          ))}
        </View>

        {/* Karta PR */}
        <Animated.View
          style={[s.card, { transform: [{ scale }], opacity }]}
        >
          <Text style={s.trophy}>🏆</Text>
          <Text style={s.label}>NOWY REKORD!</Text>
          <Text style={s.exercise} numberOfLines={2}>{exerciseName}</Text>
          <Text style={s.weight}>
            {newKg} kg × {newReps}
          </Text>
          <TouchableOpacity style={s.btn} onPress={onClose} activeOpacity={0.8}>
            <Text style={s.btnText}>Nieźle! 💪</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(250,199,117,0.4)',
    shadowColor: '#FAC775',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    width: 300,
  },
  trophy:    { fontSize: 56, marginBottom: 12 },
  label:     { fontSize: 13, fontWeight: '800', color: '#FAC775', letterSpacing: 2, marginBottom: 12 },
  exercise:  { fontSize: 17, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', marginBottom: 16, lineHeight: 24 },
  weight:    { fontSize: 36, fontWeight: '800', color: '#00E676', marginBottom: 24 },
  btn:       { backgroundColor: '#00E676', borderRadius: 16, paddingHorizontal: 36, paddingVertical: 14 },
  btnText:   { fontSize: 16, fontWeight: '700', color: '#000000' },
});

export default PRCelebration;