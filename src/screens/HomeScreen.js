import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PROGRAMS } from '../data/programs';

export default function HomeScreen({ navigation }) {
  const { userData, setUserData, getTodayFoodLog, calcStreak, calc7DayCalAvg, calcWeightDelta } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);

  // Re-render when tab is focused so stats stay fresh
  useFocusEffect(useCallback(() => {}, []));

  const target  = userData.targetCalories || 2000;
  const eaten   = userData.calories || 0;
  const calLeft = target - eaten;
  const calPct  = Math.min(1, eaten / target);

  const streak = calcStreak();
  const avg    = calc7DayCalAvg();
  const delta  = calcWeightDelta();

  // Next workout from current program
  let nextWorkoutName = 'None set';
  let nextWorkoutSub  = 'tap Workouts to choose';
  const prog = PROGRAMS.find(p => p.id === userData.currentProgram);
  if (prog) {
    const sched = prog.getSchedule(userData.oneRM || {}, userData.weights || {});
    const sessionsLogged = (userData.workoutHistory || []).filter(w => w.program === prog.id).length;
    const idx = sessionsLogged % sched.length;
    const day = sched[idx];
    if (day) { nextWorkoutName = day.day; nextWorkoutSub = 'next up'; }
    else { nextWorkoutName = prog.name; nextWorkoutSub = 'active program'; }
  }

  const calBarColor = calPct >= 1 ? '#f87171' : calPct >= 0.85 ? '#fbbf24' : theme.accent;

  return (
    <ScrollView style={s.page} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={[s.card, s.hero]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={[s.h2, { marginBottom: 4 }]}>Welcome back!</Text>
            <Text style={[s.bodySec, { marginBottom: 12 }]}>Ready to crush your fitness goals today?</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 4 }}>
            <Ionicons name="settings-outline" size={22} color={theme.textSec} />
          </TouchableOpacity>
        </View>
        <View style={s.heroGrid}>
          <View style={[s.card2, s.heroCell]}>
            <Text style={s.label}>Calories Left</Text>
            <Text style={[s.heroNum, { color: calLeft >= 0 ? theme.accent : '#f87171' }]}>
              {Math.abs(calLeft)} cal
            </Text>
            <Text style={s.heroSub}>{calLeft >= 0 ? 'left for today' : 'over target'}</Text>
          </View>
          <View style={[s.card2, s.heroCell]}>
            <Text style={s.label}>Next Workout</Text>
            <Text style={[s.heroNum, { color: theme.accent, fontSize: 13 }]} numberOfLines={2}>{nextWorkoutName}</Text>
            <Text style={s.heroSub}>{nextWorkoutSub}</Text>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={s.row2}>
        {/* Calories card */}
        <View style={[s.card, s.statCard]}>
          <View style={s.statHeader}>
            <Ionicons name="flame" size={16} color={theme.accent} />
            <Text style={s.label}>Calories</Text>
          </View>
          <Text style={s.statNum}>{eaten}</Text>
          <Text style={s.statSub}>of {target} goal</Text>
          <View style={[s.progTrack, { marginTop: 6 }]}>
            <View style={[s.progFill, { width: `${calPct * 100}%`, backgroundColor: calBarColor }]} />
          </View>
        </View>
        {/* Workouts card */}
        <View style={[s.card, s.statCard]}>
          <View style={s.statHeader}>
            <Ionicons name="barbell" size={16} color={theme.accent} />
            <Text style={s.label}>Workouts</Text>
          </View>
          <Text style={s.statNum}>{userData.workoutsCompleted || 0}</Text>
          <Text style={s.statSub}>completed today</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={[s.label, { marginBottom: 8 }]}>QUICK ACTIONS</Text>
      <View style={s.actionGrid}>
        {ACTIONS.map(a => (
          <TouchableOpacity
            key={a.id}
            style={[s.actionBtn, a.wide && s.actionWide]}
            onPress={() => handleAction(a.id, navigation)}
            activeOpacity={0.7}
          >
            <Ionicons name={a.icon} size={24} color={theme.accent} style={{ marginBottom: 4 }} />
            <Text style={[s.actionLabel, { color: theme.textPri }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Progress */}
      <View style={[s.card, { marginTop: 4 }]}>
        <Text style={[s.label, { marginBottom: 12 }]}>RECENT PROGRESS</Text>
        <ProgressRow label="Weight Trend"   value={delta !== null ? `${delta > 0 ? '+' : ''}${delta} lbs` : '—'} color={delta !== null && delta < 0 ? theme.accent : delta !== null && delta > 0 ? '#f87171' : theme.textSec} theme={theme} />
        <ProgressRow label="Workout Streak" value={`${streak} day${streak !== 1 ? 's' : ''}`} color={theme.accent} theme={theme} />
        <ProgressRow label="Calorie Average" value={avg !== null ? avg.toLocaleString() : '—'} color={avg && userData.targetCalories && avg > userData.targetCalories ? '#f87171' : theme.accent} theme={theme} />
      </View>
    </ScrollView>
  );
}

function ProgressRow({ label, value, color, theme }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <Text style={{ color: theme.textSec, fontSize: 14 }}>{label}</Text>
      <Text style={{ color, fontWeight: '700', fontSize: 14 }}>{value}</Text>
    </View>
  );
}

function handleAction(id, navigation) {
  switch (id) {
    case 'food':      navigation.navigate('Nutrition', { openLog: true }); break;
    case 'weight':    navigation.navigate('LogWeight'); break;
    case 'workout':   navigation.navigate('Workouts'); break;
    case 'coach':     navigation.navigate('Coach'); break;
    case 'plate':     navigation.navigate('PlateCalc'); break;
    case 'hr':        navigation.navigate('HRMonitor'); break;
    case 'barcode':   navigation.navigate('Barcode'); break;
    default: break;
  }
}

const ACTIONS = [
  { id: 'food',    label: 'Log Food',   icon: 'restaurant' },
  { id: 'weight',  label: 'Log Weight', icon: 'scale' },
  { id: 'workout', label: 'Start Workout', icon: 'play-circle' },
  { id: 'coach',   label: 'Ask Coach',  icon: 'hardware-chip' },
  { id: 'plate',   label: 'Plate Calc', icon: 'grid' },
  { id: 'hr',      label: 'HR Monitor', icon: 'heart' },
  { id: 'barcode', label: 'Scan Food Barcode', icon: 'barcode', wide: true },
];

function makeStyles(theme) {
  return StyleSheet.create({
    page:       { flex: 1, backgroundColor: theme.bgPage, padding: 16 },
    card:       { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 12, ...(theme.shadow || {}) },
    card2:      { backgroundColor: theme.bgCard2, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: theme.border },
    hero:       { marginBottom: 12 },
    heroGrid:   { flexDirection: 'row', gap: 10 },
    heroCell:   { flex: 1, padding: 12 },
    heroNum:    { fontSize: 18, fontWeight: '900', marginVertical: 2 },
    heroSub:    { fontSize: 11, color: '#888' },
    h2:         { fontSize: 22, fontWeight: '900', color: theme.textPri },
    bodySec:    { fontSize: 13, color: theme.textSec },
    label:      { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.textSec, fontWeight: '600' },
    row2:       { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statCard:   { flex: 1, paddingVertical: 12 },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    statNum:    { fontSize: 28, fontWeight: '900', color: theme.textPri },
    statSub:    { fontSize: 11, color: theme.textSec },
    progTrack:  { height: 6, backgroundColor: theme.progTrack, borderRadius: 3, overflow: 'hidden' },
    progFill:   { height: 6, borderRadius: 3 },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    actionBtn:  { width: '47%', backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: theme.border, padding: 16, alignItems: 'center' },
    actionWide: { width: '100%' },
    actionLabel:{ fontSize: 13, fontWeight: '600', marginTop: 2 },
  });
}
