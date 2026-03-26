import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import MealSection from '../components/MealSection';
import MacroCell from '../components/MacroCell';
import FoodSearchModal from '../components/FoodSearchModal';
import ManualEntryModal from '../components/ManualEntryModal';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function NutritionScreen({ navigation }) {
  const { userData, getTodayFoodLog, addFoodEntry, removeFoodEntry, clearTodayFood } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [, forceUpdate] = useState(0);
  useFocusEffect(useCallback(() => { forceUpdate(n => n + 1); }, []));

  const [panel, setPanel]     = useState(null); // null | 'search' | 'manual'
  const [selMeal, setSelMeal] = useState('Breakfast');

  const dayLog     = getTodayFoodLog();
  const allEntries = MEALS.flatMap(m => dayLog[m] || []);
  const totals     = allEntries.reduce((acc, e) => ({
    cal:  acc.cal  + (e.cal  || 0),
    pro:  acc.pro  + (e.pro  || 0),
    carb: acc.carb + (e.carb || 0),
    fat:  acc.fat  + (e.fat  || 0),
    fib:  acc.fib  + (e.fib  || 0),
    sod:  acc.sod  + (e.sod  || 0),
  }), { cal: 0, pro: 0, carb: 0, fat: 0, fib: 0, sod: 0 });

  const target      = userData.targetCalories || 2000;
  const calPct      = Math.min(1, totals.cal / target);
  const calBarColor = calPct >= 1 ? '#f87171' : calPct >= 0.85 ? '#fbbf24' : theme.accent;

  function openPanel(meal, type) { setSelMeal(meal); setPanel(type); }

  function handleClearDay() {
    Alert.alert('Clear Today', 'Remove all food entries for today?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearTodayFood },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgPage }}>
      <ScrollView style={s.page} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={s.label}>TODAY'S CALORIES</Text>
            <TouchableOpacity onPress={handleClearDay}>
              <Ionicons name="trash-outline" size={18} color={theme.textSec} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <Text style={[s.bigNum, { color: calPct >= 1 ? '#f87171' : theme.textPri }]}>{totals.cal}</Text>
            <Text style={s.bodySec}>/ {target} cal</Text>
          </View>
          <View style={s.progTrack}>
            <View style={[s.progFill, { width: `${calPct * 100}%`, backgroundColor: calBarColor }]} />
          </View>
          <View style={s.macroRow}>
            <MacroCell label="Protein" value={totals.pro}  unit="g"  color="#60a5fa"      theme={theme} />
            <MacroCell label="Carbs"   value={totals.carb} unit="g"  color="#fbbf24"      theme={theme} />
            <MacroCell label="Fat"     value={totals.fat}  unit="g"  color="#f87171"      theme={theme} />
            <MacroCell label="Fiber"   value={totals.fib}  unit="g"  color={theme.accent} theme={theme} />
            <MacroCell label="Sodium"  value={totals.sod}  unit="mg" color={theme.textSec} theme={theme} />
          </View>
        </View>

        {MEALS.map(meal => (
          <MealSection
            key={meal}
            meal={meal}
            entries={dayLog[meal] || []}
            onAdd={(type) => openPanel(meal, type)}
            onRemove={(idx) => removeFoodEntry(meal, idx)}
            theme={theme}
          />
        ))}
      </ScrollView>

      <FoodSearchModal
        visible={panel === 'search'}
        meal={selMeal}
        onClose={() => setPanel(null)}
        onAdd={addFoodEntry}
        onSwitchToManual={() => setPanel('manual')}
        theme={theme}
      />

      <ManualEntryModal
        visible={panel === 'manual'}
        meal={selMeal}
        onClose={() => setPanel(null)}
        onAdd={addFoodEntry}
        theme={theme}
      />
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    page:      { flex: 1, backgroundColor: theme.bgPage, padding: 16 },
    card:      { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 12, ...(theme.shadow || {}) },
    label:     { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.textSec, fontWeight: '600' },
    bigNum:    { fontSize: 40, fontWeight: '900', color: theme.textPri },
    bodySec:   { fontSize: 13, color: theme.textSec },
    progTrack: { height: 6, backgroundColor: theme.progTrack, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
    progFill:  { height: 6, borderRadius: 3 },
    macroRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  });
}
