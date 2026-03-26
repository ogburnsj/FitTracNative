import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MealSection({ meal, entries, onAdd, onRemove, theme }) {
  const s = makeStyles(theme);
  const mealCal = entries.reduce((a, e) => a + (e.cal || 0), 0);

  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={s.mealTitle}>{meal}</Text>
          {mealCal > 0 && <Text style={s.mealCal}>{mealCal} cal</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => onAdd('search')}>
            <Ionicons name="search" size={20} color={theme.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onAdd('manual')}>
            <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {entries.length === 0 ? (
        <Text style={s.empty}>Nothing logged yet</Text>
      ) : (
        entries.map((e, i) => (
          <View key={i} style={s.entryRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.entryName} numberOfLines={1}>{e.n}</Text>
              <Text style={s.entrySub}>
                {e.servings && e.servings !== 1 ? `×${e.servings} • ` : ''}{e.srv} • {e.pro}g pro • {e.carb}g carb • {e.fat}g fat
              </Text>
            </View>
            <Text style={[s.entryCalText, { marginRight: 10 }]}>{e.cal} cal</Text>
            <TouchableOpacity onPress={() => onRemove(i)}>
              <Ionicons name="trash-outline" size={16} color="#f87171" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card:         { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 10, ...(theme.shadow || {}) },
    mealTitle:    { fontSize: 15, fontWeight: '800', color: theme.textPri },
    mealCal:      { fontSize: 12, color: theme.textSec },
    empty:        { fontSize: 12, color: theme.textSec, fontStyle: 'italic' },
    entryRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
    entryName:    { fontSize: 13, fontWeight: '600', color: theme.textPri, marginBottom: 2 },
    entrySub:     { fontSize: 11, color: theme.textSec },
    entryCalText: { fontSize: 13, fontWeight: '700', color: theme.textPri },
  });
}
