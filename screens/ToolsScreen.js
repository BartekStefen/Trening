import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import OneRepMaxCalculator from '../components/tools/OneRepMaxCalculator';
import TDEECalculator      from '../components/tools/TDEECalculator';
import MacroCalculator     from '../components/tools/MacroCalculator';

// Kolory ikon kalkulatorów są semantyczne (każdy kalkulator ma swój kolor)
// i nie zmieniają się z motywem — jedynie chrome ekranu (tło, karty, teksty).
const TOOLS = [
  {
    id: 'orm',
    title: 'Kalkulator 1RM',
    desc: '5 formuł + tabela obciążeń procentowych',
    icon: 'barbell-outline',
    color: '#00E676',
    bg: 'rgba(0,230,118,0.1)',
    available: true,
  },
  {
    id: 'tdee',
    title: 'Kalkulator TDEE',
    desc: 'Całkowite dzienne zapotrzebowanie kaloryczne',
    icon: 'flame-outline',
    color: '#EF9F27',
    bg: 'rgba(239,159,39,0.1)',
    available: true,
  },
  {
    id: 'macro',
    title: 'Kalkulator makro',
    desc: 'Białko, tłuszcze i węgle pod Twój cel',
    icon: 'nutrition-outline',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.1)',
    available: true,
  },
  {
    id: 'plate',
    title: 'Kalkulator talerzy',
    desc: 'Wizualny rozkład krążków na gryfie',
    icon: 'disc-outline',
    color: '#378ADD',
    bg: 'rgba(55,138,221,0.1)',
    available: false,
  },
  {
    id: 'wilks',
    title: 'Punkty Wilks / Dots',
    desc: 'Porównaj siłę niezależnie od wagi ciała',
    icon: 'trophy-outline',
    color: '#FAC775',
    bg: 'rgba(250,199,117,0.1)',
    available: false,
  },
  {
    id: 'bmi',
    title: 'BMI & FFMI',
    desc: 'Wskaźnik masy ciała i beztłuszczowej masy',
    icon: 'body-outline',
    color: '#FF5252',
    bg: 'rgba(255,82,82,0.1)',
    available: false,
  },
];

export default function ToolsScreen() {
  const [ormVisible,   setOrmVisible]   = useState(false);
  const [tdeeVisible,  setTdeeVisible]  = useState(false);
  const [macroVisible, setMacroVisible] = useState(false);
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const handlePress = (id) => {
    if (id === 'orm')   setOrmVisible(true);
    if (id === 'tdee')  setTdeeVisible(true);
    if (id === 'macro') setMacroVisible(true);
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Narzędzia</Text>
        <Text style={s.subtitle}>Kalkulatory i asystenci treningowi</Text>

        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[s.card, !tool.available && s.cardDimmed]}
            onPress={() => tool.available && handlePress(tool.id)}
            activeOpacity={tool.available ? 0.7 : 1}
          >
            <View style={[s.iconBox, { backgroundColor: tool.bg }]}>
              <Ionicons name={tool.icon} size={24} color={tool.color} />
            </View>
            <View style={s.cardText}>
              <View style={s.cardTitleRow}>
                <Text style={[s.cardTitle, !tool.available && s.cardTitleDimmed]}>
                  {tool.title}
                </Text>
                {!tool.available && (
                  <View style={s.soonBadge}>
                    <Text style={s.soonText}>Wkrótce</Text>
                  </View>
                )}
              </View>
              <Text style={s.cardDesc}>{tool.desc}</Text>
            </View>
            {tool.available && (
              <Ionicons name="chevron-forward" size={18} color={colors.borderMuted} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <OneRepMaxCalculator isVisible={ormVisible}   onClose={() => setOrmVisible(false)} />
      <TDEECalculator      isVisible={tdeeVisible}  onClose={() => setTdeeVisible(false)} />
      <MacroCalculator     isVisible={macroVisible} onClose={() => setMacroVisible(false)} />
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  screen:   { flex: 1, backgroundColor: c.background },
  scroll:   { paddingBottom: 40 },
  title:    { fontSize: 32, fontWeight: '700', color: c.textPrimary, paddingHorizontal: 20, paddingTop: 60, marginBottom: 4, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: c.textSecondary, paddingHorizontal: 20, marginBottom: 28 },

  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: c.backgroundSecondary, marginHorizontal: 16, marginBottom: 10, borderRadius: 18, padding: 16, gap: 14, borderWidth: 0.5, borderColor: c.border },
  cardDimmed:     { opacity: 0.45 },
  iconBox:        { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardText:       { flex: 1 },
  cardTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle:      { fontSize: 16, fontWeight: '600', color: c.textPrimary },
  cardTitleDimmed:{ color: c.textSecondary },
  cardDesc:       { fontSize: 12, color: c.textTertiary },
  soonBadge:      { backgroundColor: c.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  soonText:       { fontSize: 10, color: c.textTertiary, fontWeight: '500' },
});
