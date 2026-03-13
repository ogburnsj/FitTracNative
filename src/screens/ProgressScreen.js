import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const W = Dimensions.get('window').width - 32; // full width minus page padding

const WEIGHT_RANGES = [
  { label: '2W', days: 14 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
];

export default function ProgressScreen() {
  const { userData, calcStreak, calc7DayCalAvg, calcWeightDelta } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [weightRange, setWeightRange] = useState(1); // index into WEIGHT_RANGES

  const [, forceUpdate] = useState(0);
  useFocusEffect(useCallback(() => { forceUpdate(n => n + 1); }, []));

  const streak = calcStreak();
  const avg    = calc7DayCalAvg();
  const delta  = calcWeightDelta();

  // ── Weight chart data ────────────────────────────────────────────
  const wh = [...(userData.weightHistory || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  const days = WEIGHT_RANGES[weightRange].days;
  const cutoff = new Date(Date.now() - days * 86400000);
  const filteredWH = wh.filter(e => new Date(e.date) >= cutoff);

  let weightChartData = null;
  if (filteredWH.length >= 2) {
    const labels = filteredWH.map(e => {
      const d = new Date(e.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    // Show at most 6 labels to avoid crowding
    const step = Math.ceil(labels.length / 6);
    const sparseLabels = labels.map((l, i) => (i % step === 0 ? l : ''));
    weightChartData = {
      labels: sparseLabels,
      datasets: [{ data: filteredWH.map(e => e.weight), strokeWidth: 2 }],
    };
  }

  // ── 7-day calorie bar chart ──────────────────────────────────────
  const foodLog = userData.foodLog || {};
  const barLabels = [];
  const barData   = [];
  const barColors = [];
  const target = userData.targetCalories || 2000;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const entries = Object.values(foodLog[key] || {}).flat();
    const cal = entries.reduce((a, e) => a + (e.cal || 0), 0);
    const label = ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()];
    barLabels.push(label);
    barData.push(cal || 0);
    barColors.push(cal > target ? '#f87171' : theme.accent);
  }
  const calBarChartData = {
    labels: barLabels,
    datasets: [{ data: barData }],
  };

  // ── Recent workouts ──────────────────────────────────────────────
  const recentWorkouts = [...(userData.workoutHistory || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  const chartConfig = {
    backgroundGradientFrom: theme.bgCard,
    backgroundGradientTo:   theme.bgCard,
    color: (opacity = 1) => `rgba(45,106,79,${opacity})`,
    labelColor: () => theme.textSec,
    strokeWidth: 2,
    propsForDots: { r: '3', strokeWidth: '1', stroke: theme.accent },
    propsForBackgroundLines: { stroke: theme.border, strokeDasharray: '' },
    decimalPlaces: 1,
  };

  const barChartConfig = {
    ...chartConfig,
    color: (opacity, index) => {
      if (index !== undefined && barData[index] > target) return `rgba(248,113,113,${opacity})`;
      return `rgba(45,106,79,${opacity})`;
    },
    fillShadowGradient: theme.accent,
    fillShadowGradientOpacity: 1,
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={{ paddingBottom:100 }} showsVerticalScrollIndicator={false}>

      {/* Stats summary */}
      <View style={s.statsRow}>
        <StatCard
          icon="flame" label="Streak" value={`${streak}d`}
          sub={streak === 1 ? '1 day' : `${streak} days`}
          color={theme.accent} theme={theme} s={s}
        />
        <StatCard
          icon="restaurant" label="Cal Avg" value={avg !== null ? avg.toLocaleString() : '—'}
          sub="7-day avg"
          color={avg && avg > target ? '#f87171' : theme.accent} theme={theme} s={s}
        />
        <StatCard
          icon="scale" label="Weight Δ" value={delta !== null ? `${delta > 0 ? '+' : ''}${delta}` : '—'}
          sub="lbs total"
          color={delta !== null && delta < 0 ? theme.accent : delta !== null && delta > 0 ? '#f87171' : theme.textSec}
          theme={theme} s={s}
        />
      </View>

      {/* Weight chart */}
      <View style={s.card}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <Text style={s.label}>WEIGHT HISTORY</Text>
          <View style={{ flexDirection:'row', gap:6 }}>
            {WEIGHT_RANGES.map((r, i) => (
              <TouchableOpacity
                key={r.label}
                style={[s.rangeBtn, weightRange === i && s.rangeBtnActive]}
                onPress={() => setWeightRange(i)}
              >
                <Text style={[s.rangeBtnText, weightRange === i && { color:'#fff' }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {weightChartData ? (
          <LineChart
            data={weightChartData}
            width={W - 32}
            height={180}
            chartConfig={chartConfig}
            bezier
            withInnerLines={false}
            style={{ borderRadius:8, marginLeft:-8 }}
          />
        ) : (
          <View style={s.emptyChart}>
            <Ionicons name="scale-outline" size={32} color={theme.textMuted} />
            <Text style={[s.bodySec, { marginTop:8 }]}>
              {wh.length < 2 ? 'Log at least 2 weights to see chart' : 'No data in this range'}
            </Text>
          </View>
        )}
      </View>

      {/* Calorie bar chart */}
      <View style={s.card}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <Text style={s.label}>CALORIES — LAST 7 DAYS</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
            <View style={{ width:10, height:2, backgroundColor:'#f87171', borderRadius:1 }} />
            <Text style={[s.bodySec, { fontSize:10 }]}>over target</Text>
          </View>
        </View>

        {barData.some(v => v > 0) ? (
          <BarChart
            data={calBarChartData}
            width={W - 32}
            height={180}
            chartConfig={barChartConfig}
            withInnerLines={false}
            showValuesOnTopOfBars={false}
            style={{ borderRadius:8, marginLeft:-8 }}
            fromZero
          />
        ) : (
          <View style={s.emptyChart}>
            <Ionicons name="restaurant-outline" size={32} color={theme.textMuted} />
            <Text style={[s.bodySec, { marginTop:8 }]}>No food logged yet</Text>
          </View>
        )}

        {/* Target line label */}
        <Text style={[s.bodySec, { fontSize:11, marginTop:4 }]}>Target: {target.toLocaleString()} cal/day</Text>
      </View>

      {/* Recent workouts */}
      <View style={s.card}>
        <Text style={[s.label, { marginBottom:12 }]}>RECENT WORKOUTS</Text>
        {recentWorkouts.length === 0 ? (
          <View style={s.emptyChart}>
            <Ionicons name="barbell-outline" size={32} color={theme.textMuted} />
            <Text style={[s.bodySec, { marginTop:8 }]}>No workouts logged yet</Text>
          </View>
        ) : (
          recentWorkouts.map((w, i) => {
            const d = new Date(w.date);
            const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
            return (
              <View key={i} style={[s.workoutRow, i === recentWorkouts.length - 1 && { borderBottomWidth:0 }]}>
                <View style={[s.workoutDot, { backgroundColor: theme.accent }]} />
                <View style={{ flex:1 }}>
                  <Text style={s.workoutName}>{w.day || w.program}</Text>
                  <Text style={s.workoutSub}>{w.program} • {dateStr}{w.duration ? ` • ${w.duration} min` : ''}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

    </ScrollView>
  );
}

function StatCard({ icon, label, value, sub, color, theme, s }) {
  return (
    <View style={[s.card, s.statCell]}>
      <Ionicons name={icon} size={18} color={color} style={{ marginBottom:4 }} />
      <Text style={s.label}>{label}</Text>
      <Text style={[s.statNum, { color }]}>{value}</Text>
      <Text style={s.statSub}>{sub}</Text>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    page:       { flex:1, backgroundColor: theme.bgPage, padding:16 },
    card:       { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth:1, borderColor: theme.border, padding:16, marginBottom:12, ...(theme.shadow || {}) },
    label:      { fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600' },
    bodySec:    { fontSize:13, color: theme.textSec },

    statsRow:   { flexDirection:'row', gap:10, marginBottom:2 },
    statCell:   { flex:1, alignItems:'center', paddingVertical:14, marginBottom:12 },
    statNum:    { fontSize:22, fontWeight:'900', marginVertical:2 },
    statSub:    { fontSize:10, color: theme.textSec },

    rangeBtn:      { paddingHorizontal:8, paddingVertical:4, borderRadius:6, backgroundColor: theme.bgCard2, borderWidth:1, borderColor: theme.border },
    rangeBtnActive:{ backgroundColor: theme.accent, borderColor: theme.accent },
    rangeBtnText:  { fontSize:11, fontWeight:'700', color: theme.textSec },

    emptyChart:  { height:120, alignItems:'center', justifyContent:'center' },

    workoutRow:  { flexDirection:'row', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor: theme.border, gap:12 },
    workoutDot:  { width:8, height:8, borderRadius:4 },
    workoutName: { fontSize:14, fontWeight:'700', color: theme.textPri },
    workoutSub:  { fontSize:11, color: theme.textSec, marginTop:1 },
  });
}
