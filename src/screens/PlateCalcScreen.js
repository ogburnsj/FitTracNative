import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const BAR_TYPES = [
  { label: 'Olympic',  weight: 45 },
  { label: "Women's", weight: 35 },
  { label: 'EZ Curl', weight: 20 },
];

const PLATES = [
  { weight: 45, color: '#1e3a8a' },
  { weight: 35, color: '#7c3aed' },
  { weight: 25, color: '#166534' },
  { weight: 10, color: '#92400e' },
  { weight:  5, color: '#9ca3af' },
  { weight: 2.5, color: '#6b7280' },
  { weight: 1.25, color: '#d1d5db' },
];

const QUICK = [95, 135, 185, 225, 275, 315, 405];

export default function PlateCalcScreen({ navigation }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [barIdx, setBarIdx]   = useState(0);
  const [target, setTarget]   = useState('');

  const barWeight = BAR_TYPES[barIdx].weight;
  const total     = parseFloat(target) || 0;
  const perSide   = (total - barWeight) / 2;

  // Calculate plates per side
  function calcPlates(remaining) {
    if (remaining <= 0) return [];
    const result = [];
    let left = remaining;
    for (const p of PLATES) {
      const count = Math.floor(left / p.weight);
      if (count > 0) {
        result.push({ ...p, count });
        left -= count * p.weight;
        left  = parseFloat(left.toFixed(3)); // float safety
      }
    }
    return result;
  }

  const platesPerSide = perSide > 0 ? calcPlates(perSide) : [];
  const achievable = platesPerSide.reduce((a, p) => a + p.weight * p.count, 0) * 2 + barWeight;
  const isExact    = Math.abs(achievable - total) < 0.01;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgPage }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={s.page} contentContainerStyle={{ paddingBottom:60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPri} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Plate Calculator</Text>
        <View style={{ width:40 }} />
      </View>

      {/* Bar type selector */}
      <View style={s.card}>
        <Text style={s.label}>BAR TYPE</Text>
        <View style={{ flexDirection:'row', gap:10, marginTop:8 }}>
          {BAR_TYPES.map((b, i) => (
            <TouchableOpacity
              key={b.label}
              style={[s.barBtn, barIdx === i && s.barBtnActive]}
              onPress={() => setBarIdx(i)}
            >
              <Text style={[s.barBtnText, barIdx === i && { color:'#fff' }]}>{b.label}</Text>
              <Text style={[s.barBtnSub,  barIdx === i && { color:'rgba(255,255,255,0.7)' }]}>{b.weight} lb</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Target weight input */}
      <View style={s.card}>
        <Text style={s.label}>TARGET WEIGHT (lbs)</Text>
        <TextInput
          style={[s.bigInput, { marginTop:8 }]}
          value={target}
          onChangeText={setTarget}
          keyboardType="decimal-pad"
          placeholder={`${barWeight}`}
          placeholderTextColor={theme.textSec}
        />
        {/* Quick select */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:10 }}>
          <View style={{ flexDirection:'row', gap:8 }}>
            {QUICK.map(w => (
              <TouchableOpacity key={w} style={s.quickBtn} onPress={() => setTarget(String(w))}>
                <Text style={s.quickBtnText}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Result */}
      {total > 0 && (
        <View style={s.card}>
          <Text style={s.label}>PLATES PER SIDE</Text>
          {perSide <= 0 ? (
            <Text style={[s.bodySec, { marginTop:8 }]}>Target must be greater than bar weight ({barWeight} lbs)</Text>
          ) : (
            <>
              {/* Visual bar diagram */}
              <View style={s.barDiagram}>
                <View style={s.barSleeve} />
                <View style={s.barBar} />
                <View style={[s.barSleeve, { transform:[{ scaleX:-1 }] }]} />

                {/* Plates on left side (reversed for correct order) */}
                {[...platesPerSide].reverse().flatMap((p, gi) =>
                  Array.from({ length: p.count }).map((_, pi) => (
                    <View
                      key={`L-${gi}-${pi}`}
                      style={[s.plate, { backgroundColor: p.color, height: 20 + p.weight * 1.2, left: 10 + gi * 14 + pi * 14 }]}
                    />
                  ))
                )}
                {/* Plates on right side */}
                {platesPerSide.flatMap((p, gi) =>
                  Array.from({ length: p.count }).map((_, pi) => (
                    <View
                      key={`R-${gi}-${pi}`}
                      style={[s.plate, { backgroundColor: p.color, height: 20 + p.weight * 1.2, right: 10 + gi * 14 + pi * 14 }]}
                    />
                  ))
                )}
              </View>

              {platesPerSide.length === 0 ? (
                <Text style={[s.bodySec, { marginTop:8 }]}>Bar only</Text>
              ) : (
                platesPerSide.map((p, i) => (
                  <View key={i} style={s.plateRow}>
                    <View style={[s.plateDot, { backgroundColor: p.color }]} />
                    <Text style={s.plateName}>{p.weight} lb</Text>
                    <Text style={[s.plateCount, { color: theme.accent }]}>× {p.count} per side</Text>
                  </View>
                ))
              )}

              <View style={[s.totalRow, { borderTopColor: theme.border }]}>
                <Text style={s.bodySec}>Achievable weight</Text>
                <Text style={[s.totalWeight, { color: isExact ? theme.accent : '#fbbf24' }]}>
                  {achievable} lbs {!isExact && `(target: ${total})`}
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    page:       { flex:1, backgroundColor: theme.bgPage },
    header:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:8 },
    backBtn:    { width:40 },
    headerTitle:{ fontSize:20, fontWeight:'900', color: theme.textPri },
    card:       { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth:1, borderColor: theme.border, padding:16, margin:16, marginBottom:0, ...(theme.shadow || {}) },
    label:      { fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600' },
    bodySec:    { fontSize:13, color: theme.textSec },

    barBtn:      { flex:1, alignItems:'center', padding:10, borderRadius:10, backgroundColor: theme.bgCard2, borderWidth:1, borderColor: theme.border },
    barBtnActive:{ backgroundColor: theme.accent, borderColor: theme.accent },
    barBtnText:  { fontSize:13, fontWeight:'700', color: theme.textPri },
    barBtnSub:   { fontSize:11, color: theme.textSec, marginTop:2 },

    bigInput:   { fontSize:36, fontWeight:'900', color: theme.textPri, backgroundColor: theme.bgInput, borderRadius:10, paddingHorizontal:16, paddingVertical:12, textAlign:'center', borderWidth:1, borderColor: theme.border },
    quickBtn:   { paddingHorizontal:14, paddingVertical:8, backgroundColor: theme.bgCard2, borderRadius:8, borderWidth:1, borderColor: theme.border },
    quickBtnText:{ fontSize:13, fontWeight:'700', color: theme.textSec },

    barDiagram: { height:80, alignItems:'center', justifyContent:'center', flexDirection:'row', marginVertical:16, position:'relative' },
    barBar:     { height:10, width:200, backgroundColor:'#6b7280', borderRadius:3 },
    barSleeve:  { height:16, width:20, backgroundColor:'#9ca3af', borderRadius:3 },
    plate:      { position:'absolute', width:12, borderRadius:3, top:'50%', marginTop:-20 },

    plateRow:   { flexDirection:'row', alignItems:'center', paddingVertical:8, borderBottomWidth:1, borderBottomColor: theme.border, gap:10 },
    plateDot:   { width:14, height:14, borderRadius:7 },
    plateName:  { flex:1, fontSize:14, fontWeight:'700', color: theme.textPri },
    plateCount: { fontSize:14, fontWeight:'700' },

    totalRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:12, marginTop:4, borderTopWidth:1 },
    totalWeight:{ fontSize:16, fontWeight:'900' },
  });
}
