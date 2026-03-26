import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVITY_LEVELS = [
  { key:'sedentary',  label:'Sedentary',       desc:'Little or no exercise',           mult:1.2   },
  { key:'light',      label:'Lightly Active',  desc:'1–3 days/week',                  mult:1.375 },
  { key:'moderate',   label:'Moderately Active',desc:'3–5 days/week',                 mult:1.55  },
  { key:'active',     label:'Very Active',     desc:'6–7 days/week',                  mult:1.725 },
  { key:'extreme',    label:'Extremely Active',desc:'Hard training or physical job',  mult:1.9   },
];

const GOAL_ADJUSTMENTS = [
  { label:'Lose Fast',    adj:-750, sub:'-750 cal/day (~1.5 lb/wk)' },
  { label:'Lose',         adj:-500, sub:'-500 cal/day (~1 lb/wk)'   },
  { label:'Maintain',     adj:0,    sub:'At your TDEE'               },
  { label:'Gain',         adj:+300, sub:'+300 cal/day (lean bulk)'   },
  { label:'Gain Fast',    adj:+500, sub:'+500 cal/day (bulk)'        },
];

// Mifflin-St Jeor BMR
function calcBMR(weight, heightFt, heightIn, age, sex) {
  const kg  = weight  * 0.453592;
  const cm  = (heightFt * 12 + heightIn) * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * age;
  return sex === 'female' ? bmr - 161 : bmr + 5;
}

export default function TDEEScreen({ navigation }) {
  const { userData, setUserData } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const p = userData.profile || {};
  const [age,          setAge]          = useState(String(p.age      || ''));
  const [heightFt,     setHeightFt]     = useState(String(p.heightFt || ''));
  const [heightIn,     setHeightIn]     = useState(String(p.heightIn || ''));
  const [heightInError,setHeightInError]= useState('');
  const [weight,       setWeight]       = useState(String(userData.weight || p.weight || ''));
  const [sex,          setSex]          = useState(p.sex || 'male');
  const [actKey,       setActKey]       = useState(p.activityLevel || 'moderate');
  const [goalIdx,      setGoalIdx]      = useState(p.goalSliderIdx ?? 1);
  const [customAdj,    setCustomAdj]    = useState(p.goalAdjustment ?? -500);
  const [result,       setResult]       = useState(null);

  function onHeightInChange(text) {
    setHeightIn(text);
    const val = parseInt(text);
    if (text !== '' && (isNaN(val) || val < 0 || val > 11)) {
      setHeightInError('Must be 0–11');
    } else {
      setHeightInError('');
    }
  }

  function selectGoal(i) {
    setGoalIdx(i);
    setCustomAdj(GOAL_ADJUSTMENTS[i].adj);
  }

  function onSliderChange(val) {
    const rounded = Math.round(val / 50) * 50;
    setCustomAdj(rounded);
    const idx = GOAL_ADJUSTMENTS.findIndex(g => g.adj === rounded);
    setGoalIdx(idx);
  }

  function calculate() {
    const a  = parseInt(age);
    const ft = parseInt(heightFt);
    const i  = parseInt(heightIn) || 0;
    const w  = parseFloat(weight);
    if (!a || !ft || !w || a < 10 || a > 120 || ft < 3 || ft > 8 || w < 50) {
      Alert.alert('Check inputs', 'Please enter valid age, height, and weight.');
      return;
    }
    if (heightInError) {
      Alert.alert('Check inputs', 'Height (inches) must be 0–11.');
      return;
    }
    const actMult = ACTIVITY_LEVELS.find(l => l.key === actKey)?.mult || 1.55;
    const bmr  = calcBMR(w, ft, i, a, sex);
    const tdee = Math.round(bmr * actMult);
    setResult({ bmr: Math.round(bmr), tdee });
  }

  function applyToTarget() {
    if (!result) return;
    const target = Math.max(1200, result.tdee + customAdj);
    setUserData(prev => ({
      ...prev,
      targetCalories: target,
      profile: {
        ...prev.profile,
        age: parseInt(age),
        heightFt: parseInt(heightFt),
        heightIn: parseInt(heightIn) || 0,
        weight: parseFloat(weight),
        sex,
        activityLevel: actKey,
        tdee: result.tdee,
        goal: goalIdx >= 0 ? GOAL_ADJUSTMENTS[goalIdx].label.toLowerCase().replace(' ','_') : 'custom',
        goalSliderIdx: goalIdx,
        goalAdjustment: customAdj,
      },
    }));
    Alert.alert('Applied!', `Calorie target set to ${target} cal/day.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  // Macro splits based on goal
  function getMacros(calories, adj) {
    // Higher protein when cutting
    const proRatio  = adj <= -300 ? 0.35 : 0.30;
    const carbRatio = adj >= 300  ? 0.45 : 0.40;
    const fatRatio  = 1 - proRatio - carbRatio;
    return {
      pro:  Math.round((calories * proRatio)  / 4),
      carb: Math.round((calories * carbRatio) / 4),
      fat:  Math.round((calories * fatRatio)  / 9),
    };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgPage }}>
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <ScrollView style={s.page} contentContainerStyle={{ paddingBottom:60 }} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPri} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>TDEE Calculator</Text>
        <View style={{ width:40 }} />
      </View>

      {/* Basic info */}
      <View style={s.card}>
        <Text style={s.label}>BASIC INFO</Text>

        {/* Sex */}
        <View style={{ flexDirection:'row', gap:10, marginTop:10 }}>
          {['male','female'].map(sx => (
            <TouchableOpacity key={sx} style={[s.toggleBtn, sex === sx && s.toggleBtnActive]} onPress={() => setSex(sx)}>
              <Text style={[s.toggleBtnText, sex === sx && { color:'#fff' }]}>{sx.charAt(0).toUpperCase() + sx.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Age / Weight */}
        <View style={{ flexDirection:'row', gap:12, marginTop:12 }}>
          <View style={{ flex:1 }}>
            <Text style={s.fieldLabel}>Age</Text>
            <TextInput style={s.input} value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="30" placeholderTextColor={theme.textSec} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.fieldLabel}>Weight (lbs)</Text>
            <TextInput style={s.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="180" placeholderTextColor={theme.textSec} />
          </View>
        </View>

        {/* Height */}
        <View style={{ flexDirection:'row', gap:12, marginTop:12 }}>
          <View style={{ flex:1 }}>
            <Text style={s.fieldLabel}>Height (ft)</Text>
            <TextInput style={s.input} value={heightFt} onChangeText={setHeightFt} keyboardType="number-pad" placeholder="5" placeholderTextColor={theme.textSec} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.fieldLabel}>Height (in)</Text>
            <TextInput
              style={[s.input, heightInError ? { borderColor:'#f87171' } : null]}
              value={heightIn}
              onChangeText={onHeightInChange}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={theme.textSec}
            />
            {heightInError ? <Text style={{ color:'#f87171', fontSize:11, marginTop:3 }}>{heightInError}</Text> : null}
          </View>
        </View>
      </View>

      {/* Activity level */}
      <View style={s.card}>
        <Text style={s.label}>ACTIVITY LEVEL</Text>
        {ACTIVITY_LEVELS.map(l => (
          <TouchableOpacity key={l.key} style={[s.optRow, actKey === l.key && s.optRowActive]} onPress={() => setActKey(l.key)}>
            <View style={{ flex:1 }}>
              <Text style={[s.optLabel, actKey === l.key && { color: theme.accent }]}>{l.label}</Text>
              <Text style={s.optDesc}>{l.desc} (×{l.mult})</Text>
            </View>
            {actKey === l.key && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Goal */}
      <View style={s.card}>
        <Text style={s.label}>GOAL</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:10 }}>
          <View style={{ flexDirection:'row', gap:8 }}>
            {GOAL_ADJUSTMENTS.map((g, i) => (
              <TouchableOpacity key={i} style={[s.goalChip, goalIdx === i && s.goalChipActive]} onPress={() => selectGoal(i)}>
                <Text style={[s.goalChipLabel, goalIdx === i && { color:'#fff' }]}>{g.label}</Text>
                <Text style={[s.goalChipSub, goalIdx === i && { color:'rgba(255,255,255,0.7)' }]}>{g.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Fine-tune slider */}
        <View style={{ marginTop:16 }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <Text style={s.fieldLabel}>Fine-tune adjustment</Text>
            <Text style={[s.fieldLabel, { color: customAdj < 0 ? '#60a5fa' : customAdj > 0 ? '#f87171' : theme.textSec, fontWeight:'800', fontSize:14 }]}>
              {customAdj >= 0 ? '+' : ''}{customAdj} cal/day
            </Text>
          </View>
          <Slider
            minimumValue={-750}
            maximumValue={500}
            step={50}
            value={customAdj}
            onValueChange={onSliderChange}
            minimumTrackTintColor={theme.accent}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.accent}
          />
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ fontSize:10, color: theme.textMuted }}>-750</Text>
            <Text style={{ fontSize:10, color: theme.textMuted }}>0</Text>
            <Text style={{ fontSize:10, color: theme.textMuted }}>+500</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={[s.btn, { margin:16 }]} onPress={calculate}>
        <Text style={s.btnText}>Calculate</Text>
      </TouchableOpacity>

      {/* Result */}
      {result && (() => {
        const target = Math.max(1200, result.tdee + customAdj);
        const adjLabel = `${customAdj >= 0 ? '+' : ''}${customAdj} cal/day`;
        const m = getMacros(target, customAdj);
        return (
          <View style={[s.card, { marginTop:0 }]}>
            <Text style={[s.label, { marginBottom:12 }]}>YOUR RESULTS</Text>
            <View style={s.resultGrid}>
              <ResultCell label="BMR"    value={result.bmr.toLocaleString()}  sub="base metabolic rate"     theme={theme} />
              <ResultCell label="TDEE"   value={result.tdee.toLocaleString()} sub="total daily expenditure" theme={theme} />
              <ResultCell label="Target" value={target.toLocaleString()}      sub={adjLabel}                theme={theme} color={theme.accent} />
            </View>

            {/* Macro split */}
            <View style={{ marginTop:16 }}>
              <Text style={[s.label, { marginBottom:8 }]}>SUGGESTED MACROS</Text>
              <View style={s.macroRow}>
                <MacroBar label="Protein" value={m.pro}  color="#60a5fa" theme={theme} />
                <MacroBar label="Carbs"   value={m.carb} color="#fbbf24" theme={theme} />
                <MacroBar label="Fat"     value={m.fat}  color="#f87171" theme={theme} />
              </View>
            </View>

            <TouchableOpacity style={[s.btn, { marginTop:16 }]} onPress={applyToTarget}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight:6 }} />
              <Text style={s.btnText}>Apply {target} cal Target</Text>
            </TouchableOpacity>
          </View>
        );
      })()}
    </ScrollView>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResultCell({ label, value, sub, theme, color }) {
  return (
    <View style={{ alignItems:'center', flex:1 }}>
      <Text style={{ fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600' }}>{label}</Text>
      <Text style={{ fontSize:22, fontWeight:'900', color: color || theme.textPri, marginVertical:4 }}>{value}</Text>
      <Text style={{ fontSize:10, color: theme.textSec, textAlign:'center' }}>{sub}</Text>
    </View>
  );
}

function MacroBar({ label, value, color, theme }) {
  return (
    <View style={{ alignItems:'center', flex:1 }}>
      <Text style={{ fontSize:18, fontWeight:'900', color }}>{value}g</Text>
      <Text style={{ fontSize:11, color: theme.textSec }}>{label}</Text>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    page:        { flex:1, backgroundColor: theme.bgPage },
    header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:8 },
    backBtn:     { width:40 },
    headerTitle: { fontSize:20, fontWeight:'900', color: theme.textPri },
    card:        { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth:1, borderColor: theme.border, padding:16, marginHorizontal:16, marginBottom:12, ...(theme.shadow || {}) },
    label:       { fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600' },

    toggleBtn:      { flex:1, padding:10, borderRadius:10, backgroundColor: theme.bgCard2, alignItems:'center', borderWidth:1, borderColor: theme.border },
    toggleBtnActive:{ backgroundColor: theme.accent, borderColor: theme.accent },
    toggleBtnText:  { fontSize:14, fontWeight:'700', color: theme.textSec },

    fieldLabel:  { fontSize:12, color: theme.textSec, marginBottom:4 },
    input:       { backgroundColor: theme.bgInput, borderRadius:8, paddingHorizontal:12, paddingVertical:10, color: theme.textPri, fontSize:14, borderWidth:1, borderColor: theme.border },

    optRow:      { flexDirection:'row', alignItems:'center', paddingVertical:12, paddingHorizontal:4, borderBottomWidth:1, borderBottomColor: theme.border },
    optRowActive:{ borderBottomColor: theme.border },
    optLabel:    { fontSize:14, fontWeight:'700', color: theme.textPri },
    optDesc:     { fontSize:11, color: theme.textSec, marginTop:2 },

    goalChip:      { alignItems:'center', paddingHorizontal:14, paddingVertical:8, borderRadius:10, backgroundColor: theme.bgCard2, borderWidth:1, borderColor: theme.border, minWidth:90 },
    goalChipActive:{ backgroundColor: theme.accent, borderColor: theme.accent },
    goalChipLabel: { fontSize:13, fontWeight:'700', color: theme.textSec },
    goalChipSub:   { fontSize:9, color: theme.textMuted, marginTop:2, textAlign:'center' },

    btn:         { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor: theme.accent, borderRadius:10, padding:14 },
    btnText:     { color:'#fff', fontWeight:'800', fontSize:15 },

    resultGrid:  { flexDirection:'row', justifyContent:'space-around' },
    macroRow:    { flexDirection:'row', justifyContent:'space-around' },
  });
}
