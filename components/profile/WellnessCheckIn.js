import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { WELLNESS_ITEMS } from '../../constants/wellnessDefaults';

export default function WellnessCheckIn({ wellness, onChange }) {
  const { colors } = useTheme();

  return (
    <View style={s.wrap}>
      <Text style={[s.title, { color: colors.textSecondary }]}>
        Wellness dzienny (Hooper) · skala 1–5
      </Text>
      {WELLNESS_ITEMS.map((item) => (
        <View key={item.key} style={s.row}>
          <View style={s.labelCol}>
            <Text style={[s.label, { color: colors.textPrimary }]}>{item.label}</Text>
            <Text style={[s.hint, { color: colors.textSecondary }]}>{item.hint}</Text>
          </View>
          <View style={s.dots}>
            {[1, 2, 3, 4, 5].map((val) => {
              const active = wellness[item.key] === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    s.dot,
                    {
                      backgroundColor: active ? colors.accent : colors.backgroundSecondary,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => onChange(item.key, val)}
                  activeOpacity={0.7}
                  accessibilityLabel={`${item.label} ${val} z 5`}
                >
                  <Text style={[s.dotText, { color: active ? colors.accentText : colors.textSecondary }]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 14, gap: 10 },
  title: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  row: { gap: 6 },
  labelCol: { gap: 1 },
  label: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 10 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 13, fontWeight: '700' },
});
