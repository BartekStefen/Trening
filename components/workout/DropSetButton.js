import { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const DropSetButton = ({ onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.82,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
    onPress?.();
  };

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[s.btn, { transform: [{ scale }] }]}>
        <Text style={s.icon}>⚡</Text>
        <Text style={s.label}>Drop</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 9,
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(239,159,39,0.45)',
  },
  icon:  { fontSize: 11 },
  label: { fontSize: 10, fontWeight: '700', color: '#A78BFA', letterSpacing: 0.2 },
});

export default DropSetButton;