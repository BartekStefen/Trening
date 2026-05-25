import { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAchievements } from '../../context/AchievementsContext';
import BadgeShield from './BadgeShield';
import {
  ACHIEVEMENT_TIERS,
  TIER_ORDER,
  filterAchievements,
  formatUnlockDate,
  groupBadgesByTier,
} from '../../utils/achievements';

const STATUS_FILTERS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'unlocked', label: 'Odblokowane' },
  { id: 'locked', label: 'Zablokowane' },
];

export default function AchievementCatalogModal({ visible, onClose, onSelectBadge }) {
  const { colors } = useTheme();
  const { badges, unlockedCount, totalCount } = useAchievements();
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(
    () => filterAchievements(badges, { query, tier: tierFilter, status: statusFilter }),
    [badges, query, tierFilter, statusFilter],
  );

  const sections = useMemo(() => groupBadgesByTier(filtered), [filtered]);

  const resetFilters = () => {
    setQuery('');
    setTierFilter('all');
    setStatusFilter('all');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Katalog osiągnięć</Text>
            <Text style={[s.headerSub, { color: colors.textSecondary }]}>
              {unlockedCount}/{totalCount} odblokowanych
            </Text>
          </View>
          <View style={{ width: 26 }} />
        </View>

        <View style={s.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[s.searchInput, { color: colors.textPrimary }]}
            placeholder="Szukaj po nazwie, opisie, randze…"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {(query || tierFilter !== 'all' || statusFilter !== 'all') ? (
            <TouchableOpacity onPress={resetFilters}>
              <Text style={[s.clearBtn, { color: colors.accent }]}>Wyczyść</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.chipScroll}
          contentContainerStyle={s.chipRow}
        >
          <TouchableOpacity
            style={[
              s.chip,
              s.chipSpacing,
              tierFilter === 'all'
                ? { backgroundColor: colors.accent, borderColor: colors.accent }
                : { backgroundColor: colors.borderMuted, borderColor: 'transparent' },
            ]}
            onPress={() => setTierFilter('all')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                s.chipText,
                { color: tierFilter === 'all' ? colors.accentText : colors.textSecondary },
              ]}
            >
              Wszystkie
            </Text>
          </TouchableOpacity>
          {TIER_ORDER.map((tierId) => {
            const tier = ACHIEVEMENT_TIERS[tierId];
            const active = tierFilter === tierId;
            return (
              <TouchableOpacity
                key={tierId}
                style={[
                  s.chip,
                  s.chipSpacing,
                  active
                    ? { backgroundColor: tier.color, borderColor: tier.color }
                    : { backgroundColor: `${tier.color}22`, borderColor: tier.color },
                ]}
                onPress={() => setTierFilter(tierId)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    s.chipText,
                    { color: active ? '#141414' : colors.textPrimary },
                  ]}
                >
                  {tier.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={s.statusRow}>
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[s.statusChip, { borderColor: colors.border }, active && { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
                onPress={() => setStatusFilter(f.id)}
              >
                <Text style={[s.statusText, { color: active ? colors.accent : colors.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
          {sections.length === 0 ? (
            <Text style={[s.empty, { color: colors.textSecondary }]}>
              Brak wyników — zmień wyszukiwanie lub filtr rangi.
            </Text>
          ) : (
            sections.map((section) => (
              <View key={section.tierId} style={s.section}>
                <View style={s.sectionHead}>
                  <View style={[s.tierDot, { backgroundColor: section.color }]} />
                  <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                    {section.label}
                  </Text>
                  <Text style={[s.sectionCount, { color: colors.textSecondary }]}>
                    {section.badges.filter((b) => b.isUnlocked).length}/{section.badges.length}
                  </Text>
                </View>

                <View style={s.grid}>
                  {section.badges.map((badge) => (
                    <TouchableOpacity
                      key={badge.id}
                      activeOpacity={0.85}
                      onPress={() => onSelectBadge?.(badge)}
                      style={[
                        s.rowCard,
                        { backgroundColor: colors.card, borderColor: badge.isUnlocked ? section.color : colors.border },
                      ]}
                    >
                      <BadgeShield badge={badge} colors={colors} size="sm" showTitle={false} showProgress={false} />
                      <View style={s.rowInfo}>
                        <Text style={[s.rowTitle, { color: colors.textPrimary }]}>{badge.title}</Text>
                        <Text style={[s.rowDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                          {badge.description}
                        </Text>
                        {badge.isUnlocked ? (
                          <Text style={[s.rowMeta, { color: section.color }]}>
                            Odblokowano · {formatUnlockDate(badge.unlockedAt)}
                          </Text>
                        ) : badge.progress != null ? (
                          <View style={[s.rowTrack, { backgroundColor: colors.border }]}>
                            <View style={[s.rowFill, { width: `${Math.round(badge.progress * 100)}%`, backgroundColor: section.color }]} />
                          </View>
                        ) : (
                          <Text style={[s.rowMeta, { color: colors.textTertiary }]}>Zablokowane</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: 52 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  clearBtn: { fontSize: 13, fontWeight: '600' },
  chipScroll: {
    minHeight: 40,
    maxHeight: 40,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSpacing: {
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statusChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  sectionCount: { fontSize: 12 },
  grid: { gap: 8 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  rowInfo: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowDesc: { fontSize: 11, lineHeight: 15 },
  rowMeta: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  rowTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  rowFill: { height: '100%', borderRadius: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14, lineHeight: 20 },
});
