import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, FlatList, Dimensions, Platform, Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const { width: SW } = Dimensions.get('window');

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary',        desc: 'Little or no exercise',     mult: 1.2   },
  { key: 'light',     label: 'Lightly Active',   desc: '1–3 days/week',             mult: 1.375 },
  { key: 'moderate',  label: 'Moderately Active',desc: '3–5 days/week',             mult: 1.55  },
  { key: 'active',    label: 'Very Active',       desc: '6–7 days/week',             mult: 1.725 },
];

const GOALS = [
  { key: 'lose',     label: 'Lose Weight',  adj: -500, icon: 'trending-down' },
  { key: 'maintain', label: 'Maintain',     adj: 0,    icon: 'remove'        },
  { key: 'gain',     label: 'Build Muscle', adj: +300, icon: 'trending-up'   },
];

function calcBMR(weight, heightFt, heightIn, age, sex) {
  const kg = weight * 0.453592;
  const cm = (heightFt * 12 + (heightIn || 0)) * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * age;
  return sex === 'female' ? bmr - 161 : bmr + 5;
}

export default function OnboardingScreen() {
  const { setUserData } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const listRef = useRef(null);

  const [step, setStep]         = useState(0);
  const [name, setName]         = useState('');
  const [sex, setSex]           = useState('male');
  const [age, setAge]           = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight]     = useState('');
  const [actKey, setActKey]     = useState('moderate');
  const [goalKey, setGoalKey]   = useState('maintain');

  function goTo(i) {
    setStep(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
  }

  function validateStep(i) {
    if (i === 1 && !name.trim()) {
      Alert.alert('Missing info', 'Please enter your name.');
      return false;
    }
    if (i === 2) {
      const a = parseInt(age), ft = parseInt(heightFt), w = parseFloat(weight);
      if (!a || a < 13 || a > 100) { Alert.alert('Check age', 'Enter a valid age (13–100).'); return false; }
      if (!ft || ft < 3 || ft > 8) { Alert.alert('Check height', 'Enter a valid height.'); return false; }
      if (!w || w < 50 || w > 700) { Alert.alert('Check weight', 'Enter a valid weight in lbs.'); return false; }
    }
    return true;
  }

  function next() {
    if (!validateStep(step)) return;
    if (step < 3) goTo(step + 1);
  }

  function finish() {
    const a   = parseInt(age);
    const ft  = parseInt(heightFt);
    const inn = parseInt(heightIn) || 0;
    const w   = parseFloat(weight);
    const goal = GOALS.find(g => g.key === goalKey);
    const act  = ACTIVITY_LEVELS.find(l => l.key === actKey);
    const bmr  = calcBMR(w, ft, inn, a, sex);
    const tdee = Math.round(bmr * act.mult);
    const target = Math.max(1200, tdee + goal.adj);

    setUserData(prev => ({
      ...prev,
      weight: w,
      targetCalories: target,
      onboardingComplete: true,
      profile: {
        ...prev.profile,
        name: name.trim(),
        age: a,
        heightFt: ft,
        heightIn: inn,
        weight: w,
        sex,
        activityLevel: actKey,
        goal: goalKey,
        tdee,
        goalAdjustment: goal.adj,
        goalSliderIdx: GOALS.findIndex(g => g.key === goalKey),
      },
    }));
  }

  const steps = [
    // ── Step 0: Welcome ───────────────────────────────────
    <View style={s.slide} key="welcome">
      <View style={s.iconWrap}>
        <Ionicons name="barbell" size={56} color={theme.accent} />
      </View>
      <Text style={s.welcomeTitle}>Welcome to FitTrac</Text>
      <Text style={s.welcomeSub}>
        Your personal fitness companion.{'\n'}
        Let's set up your profile — takes about 60 seconds.
      </Text>
      <TouchableOpacity style={s.btn} onPress={next}>
        <Text style={s.btnText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </View>,

    // ── Step 1: Name + Gender ─────────────────────────────
    <KeyboardAvoidingView style={s.slide} key="profile" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={s.stepTitle}>About You</Text>
      <Text style={s.stepSub}>This personalizes your experience</Text>

      <Text style={s.fieldLabel}>Your Name</Text>
      <TextInput
        style={s.input}
        value={name}
        onChangeText={setName}
        placeholder="First name"
        placeholderTextColor={theme.textSec}
        autoCapitalize="words"
        returnKeyType="done"
      />

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>Biological Sex</Text>
      <Text style={{ fontSize: 11, color: theme.textSec, marginBottom: 8 }}>Used for calorie and fitness calculations</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {['male', 'female'].map(g => (
          <TouchableOpacity key={g} style={[s.toggleBtn, sex === g && s.toggleBtnActive]} onPress={() => setSex(g)}>
            <Ionicons name={g === 'male' ? 'man' : 'woman'} size={20} color={sex === g ? '#fff' : theme.textSec} style={{ marginBottom: 4 }} />
            <Text style={[s.toggleText, sex === g && { color: '#fff' }]}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={() => goTo(step - 1)}>
          <Ionicons name="arrow-back" size={20} color={theme.textSec} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={next}>
          <Text style={s.btnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>,

    // ── Step 2: Age / Height / Weight ─────────────────────
    <KeyboardAvoidingView style={s.slide} key="body" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={s.stepTitle}>Body Stats</Text>
      <Text style={s.stepSub}>Used to calculate your calorie needs</Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.fieldLabel}>Age</Text>
          <TextInput style={s.input} value={age} onChangeText={setAge}
            keyboardType="number-pad" placeholder="28" placeholderTextColor={theme.textSec} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.fieldLabel}>Weight (lbs)</Text>
          <TextInput style={s.input} value={weight} onChangeText={setWeight}
            keyboardType="decimal-pad" placeholder="175" placeholderTextColor={theme.textSec} />
        </View>
      </View>

      <Text style={[s.fieldLabel, { marginTop: 16 }]}>Height</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TextInput style={s.input} value={heightFt} onChangeText={setHeightFt}
            keyboardType="number-pad" placeholder="5 ft" placeholderTextColor={theme.textSec} />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput style={s.input} value={heightIn} onChangeText={setHeightIn}
            keyboardType="number-pad" placeholder="10 in" placeholderTextColor={theme.textSec} />
        </View>
      </View>

      <Text style={[s.fieldLabel, { marginTop: 16 }]}>Activity Level</Text>
      {ACTIVITY_LEVELS.map(l => (
        <TouchableOpacity key={l.key} style={[s.optRow, actKey === l.key && s.optRowActive]} onPress={() => setActKey(l.key)}>
          <View style={{ flex: 1 }}>
            <Text style={[s.optLabel, actKey === l.key && { color: theme.accent }]}>{l.label}</Text>
            <Text style={s.optDesc}>{l.desc}</Text>
          </View>
          {actKey === l.key && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
        </TouchableOpacity>
      ))}

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={() => goTo(step - 1)}>
          <Ionicons name="arrow-back" size={20} color={theme.textSec} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={next}>
          <Text style={s.btnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>,

    // ── Step 3: Goal ──────────────────────────────────────
    <View style={s.slide} key="goal">
      <Text style={s.stepTitle}>What's Your Goal?</Text>
      <Text style={s.stepSub}>We'll set your daily calorie target automatically</Text>

      <View style={{ gap: 12, marginTop: 8 }}>
        {GOALS.map(g => (
          <TouchableOpacity key={g.key} style={[s.goalCard, goalKey === g.key && s.goalCardActive]} onPress={() => setGoalKey(g.key)}>
            <Ionicons name={g.icon} size={28} color={goalKey === g.key ? '#fff' : theme.accent} style={{ marginBottom: 6 }} />
            <Text style={[s.goalLabel, goalKey === g.key && { color: '#fff' }]}>{g.label}</Text>
            <Text style={[s.goalAdj, goalKey === g.key && { color: 'rgba(255,255,255,0.7)' }]}>
              {g.adj === 0 ? 'At your TDEE' : `${g.adj > 0 ? '+' : ''}${g.adj} cal/day`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={() => goTo(step - 1)}>
          <Ionicons name="arrow-back" size={20} color={theme.textSec} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={finish}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={s.btnText}>Let's Go</Text>
        </TouchableOpacity>
      </View>
    </View>,
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgPage }}>
      {/* Progress dots */}
      <View style={s.dots}>
        {steps.map((_, i) => (
          <View key={i} style={[s.dot, i === step && s.dotActive]} />
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={steps}
        renderItem={({ item }) => <View style={{ width: SW }}>{item}</View>}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
      />
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    dots:       { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.border },
    dotActive:  { width: 24, backgroundColor: theme.accent },

    slide:      { width: SW, flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },

    iconWrap:   { alignItems: 'center', marginTop: 40, marginBottom: 24 },
    welcomeTitle: { fontSize: 32, fontWeight: '900', color: theme.textPri, textAlign: 'center', marginBottom: 12 },
    welcomeSub:   { fontSize: 15, color: theme.textSec, textAlign: 'center', lineHeight: 22, marginBottom: 48 },

    stepTitle:  { fontSize: 26, fontWeight: '900', color: theme.textPri, marginBottom: 4 },
    stepSub:    { fontSize: 13, color: theme.textSec, marginBottom: 20 },

    fieldLabel: { fontSize: 12, color: theme.textSec, marginBottom: 6, fontWeight: '600' },
    input:      { backgroundColor: theme.bgCard, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: theme.textPri, fontSize: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 4 },

    toggleBtn:      { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.bgCard, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    toggleBtnActive:{ backgroundColor: theme.accent, borderColor: theme.accent },
    toggleText:     { fontSize: 15, fontWeight: '700', color: theme.textSec },

    optRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: theme.border },
    optRowActive:{ borderBottomColor: theme.border },
    optLabel:    { fontSize: 14, fontWeight: '700', color: theme.textPri },
    optDesc:     { fontSize: 11, color: theme.textSec, marginTop: 1 },

    goalCard:       { backgroundColor: theme.bgCard, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 18, alignItems: 'center' },
    goalCardActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    goalLabel:      { fontSize: 16, fontWeight: '800', color: theme.textPri, marginBottom: 2 },
    goalAdj:        { fontSize: 12, color: theme.textSec },

    navRow:     { flexDirection: 'row', gap: 12, marginTop: 32, paddingTop: 0 },
    backBtn:    { width: 48, height: 52, borderRadius: 10, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    btn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent, borderRadius: 10, paddingVertical: 14 },
    btnText:    { color: '#fff', fontWeight: '800', fontSize: 16 },
  });
}
