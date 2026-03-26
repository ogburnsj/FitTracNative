import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  USMC_PFT, USMC_CFT, ARMY_AFT, NAVY_PRT, SELECTION_STANDARDS,
} from '../data/militaryStandards';

// ── Helpers ──────────────────────────────────────────────────────────────────

function mmssToSec(str) {
  if (!str) return 0;
  const [m, s] = str.split(':').map(n => parseInt(n) || 0);
  return m * 60 + s;
}

/** More = better (reps, plank seconds) */
function scoreReps(val, min, max, lo, hi) {
  if (val <= 0 || val < min) return 0;
  if (val >= max) return hi;
  return Math.round(lo + ((val - min) / (max - min)) * (hi - lo));
}

/** Faster = better (timed events) */
function scoreTime(actualSec, cutoffSec, perfectSec, lo, hi) {
  if (actualSec <= 0 || actualSec > cutoffSec) return 0;
  if (actualSec <= perfectSec) return hi;
  return Math.round(lo + ((cutoffSec - actualSec) / (cutoffSec - perfectSec)) * (hi - lo));
}

function tierColor(tier, theme) {
  if (!tier) return theme.textSec;
  const t = tier.toLowerCase();
  if (t.includes('1st') || t === 'distinguished' || t === 'outstanding' || t === 'optimum' || t === 'pass') return theme.accent;
  if (t.includes('2nd') || t === 'honor graduate' || t === 'competitive') return '#fbbf24';
  if (t.includes('3rd') || t === 'satisfactory' || t === 'minimum') return '#f97316';
  return '#f87171';
}

// ── Config ────────────────────────────────────────────────────────────────────

const TESTS = [
  { id: 'usmc_pft', label: 'USMC PFT' },
  { id: 'usmc_cft', label: 'USMC CFT' },
  { id: 'army_aft', label: 'Army AFT' },
  { id: 'navy_prt', label: 'Navy PRT' },
  { id: 'buds_pst', label: "BUD/S PST" },
];

const AGE_GROUPS = {
  usmc_pft: ['17\u201320','21\u201325','26\u201330','31\u201335','36\u201340','41\u201345','46\u201350','51+'],
  usmc_cft: ['17\u201320','21\u201325','26\u201330','31\u201335','36\u201340'],
  army_aft: ['17\u201321','22\u201326','27\u201331','32\u201336'],
  navy_prt: ['17\u201319','20\u201324','25\u201329','30\u201334','35\u201339'],
  buds_pst: [],
};

const TEST_EVENTS = {
  usmc_pft: [
    { key: 'pullUps',  label: 'Pull-ups',          type: 'reps', ph: '15'    },
    { key: 'plank',    label: 'Plank (MM:SS)',      type: 'mmss', ph: '2:30'  },
    { key: 'run3Mile', label: '3-Mile Run (MM:SS)', type: 'mmss', ph: '22:00' },
  ],
  usmc_cft: [
    { key: 'mtc',     label: 'Move to Contact (MM:SS)',    type: 'mmss', ph: '3:10' },
    { key: 'ammoCan', label: 'Ammo Can reps (2 min)',      type: 'reps', ph: '85'   },
    { key: 'muof',    label: 'Maneuver Under Fire (MM:SS)',type: 'mmss', ph: '2:30' },
  ],
  army_aft: [
    { key: 'deadlift', label: '3-Rep Deadlift (lbs)',        type: 'reps', ph: '200'  },
    { key: 'hrpu',     label: 'Hand-Release Push-ups',       type: 'reps', ph: '40'   },
    { key: 'sdc',      label: 'Sprint-Drag-Carry (MM:SS)',   type: 'mmss', ph: '2:05' },
    { key: 'plank',    label: 'Plank (MM:SS)',               type: 'mmss', ph: '3:00' },
    { key: 'run2Mile', label: '2-Mile Run (MM:SS)',          type: 'mmss', ph: '16:00'},
  ],
  navy_prt: [
    { key: 'pushUps',    label: 'Push-ups (2 min)',    type: 'reps', ph: '50'    },
    { key: 'plank',      label: 'Plank (MM:SS)',       type: 'mmss', ph: '2:00'  },
    { key: 'run1_5Mile', label: '1.5-Mile Run (MM:SS)',type: 'mmss', ph: '10:30' },
  ],
  buds_pst: [
    { key: 'swim500',    label: '500-yd Swim (MM:SS)',        type: 'mmss', ph: '10:00' },
    { key: 'pushUps',    label: 'Push-ups (2 min)',           type: 'reps', ph: '65'    },
    { key: 'sitUps',     label: 'Sit-ups (2 min)',            type: 'reps', ph: '70'    },
    { key: 'pullUps',    label: 'Pull-ups (dead hang)',       type: 'reps', ph: '15'    },
    { key: 'run1_5Mile', label: '1.5-mi Run w/ boots (MM:SS)',type: 'mmss', ph: '9:30' },
  ],
};

// ── Age group helper ──────────────────────────────────────────────────────────

function pickAgeGroup(testId, age) {
  const groups = AGE_GROUPS[testId] || [];
  if (!groups.length || !age) return groups[0] || '';
  for (const g of groups) {
    if (g.endsWith('+')) {
      if (age >= parseInt(g)) return g;
    } else {
      const [lo, hi] = g.split('\u2013').map(Number);
      if (age >= lo && age <= hi) return g;
    }
  }
  return groups[groups.length - 1];
}

// ── Score calculators ─────────────────────────────────────────────────────────

function calcUsmcPft(inputs, gender, ageGroup) {
  const pullRow = (USMC_PFT.pullUps[gender] || []).find(r => r.ageGroup === ageGroup);
  const runRow  = (USMC_PFT.run3Mile[gender] || []).find(r => r.ageGroup === ageGroup);
  const pMin = mmssToSec(USMC_PFT.plank.allAges.min);
  const pMax = mmssToSec(USMC_PFT.plank.allAges.max);

  const pullScore  = pullRow ? scoreReps(parseInt(inputs.pullUps) || 0, pullRow.min, pullRow.max, 40, 100) : 0;
  const plankScore = scoreReps(mmssToSec(inputs.plank), pMin, pMax, 40, 100);
  const runScore   = runRow
    ? scoreTime(mmssToSec(inputs.run3Mile), mmssToSec(runRow.cutoff), mmssToSec(runRow.perfect), 40, 100) : 0;

  const total = pullScore + plankScore + runScore;
  const tier  = total >= 235 ? '1st Class' : total >= 200 ? '2nd Class' : total >= 150 ? '3rd Class' : 'Fail';
  return {
    total, max: 300, tier,
    pass: total >= 150 && pullScore >= 40 && plankScore >= 40 && runScore >= 40,
    events: [
      { name: 'Pull-ups',   score: pullScore,  max: 100 },
      { name: 'Plank',      score: plankScore, max: 100 },
      { name: '3-Mile Run', score: runScore,   max: 100 },
    ],
  };
}

function calcUsmcCft(inputs, gender, ageGroup) {
  const mtcRow  = (USMC_CFT.movementToContact[gender] || []).find(r => r.ageGroup === ageGroup);
  const acRow   = (USMC_CFT.ammoCan[gender]           || []).find(r => r.ageGroup === ageGroup);
  const muofRow = (USMC_CFT.maneuverUnderFire[gender] || []).find(r => r.ageGroup === ageGroup);

  const mtcScore  = mtcRow
    ? scoreTime(mmssToSec(inputs.mtc),     mmssToSec(mtcRow.cutoff),  mmssToSec(mtcRow.perfect),  45, 100) : 0;
  const acScore   = acRow
    ? scoreReps(parseInt(inputs.ammoCan) || 0, acRow.cutoff, acRow.perfect, 45, 100) : 0;
  const muofScore = muofRow
    ? scoreTime(mmssToSec(inputs.muof),    mmssToSec(muofRow.cutoff), mmssToSec(muofRow.perfect), 45, 100) : 0;

  const total = mtcScore + acScore + muofScore;
  const tier  = total >= 285 ? '1st Class' : total >= 235 ? '2nd Class' : total >= 150 ? '3rd Class' : 'Fail';
  return {
    total, max: 300, tier, pass: total >= 150,
    events: [
      { name: 'Move to Contact', score: mtcScore,  max: 100 },
      { name: 'Ammo Can',        score: acScore,   max: 100 },
      { name: 'Maneuver UF',     score: muofScore, max: 100 },
    ],
  };
}

function calcArmyAft(inputs, gender, ageGroup) {
  const dl   = ARMY_AFT.deadlift[gender]?.find(r => r.ageGroup === ageGroup);
  const hrpu = ARMY_AFT.handReleasePushUps[gender]?.find(r => r.ageGroup === ageGroup);
  const sdc  = ARMY_AFT.sprintDragCarry[gender]?.find(r => r.ageGroup === ageGroup);
  const plk  = ARMY_AFT.plank.allAges;
  const run  = ARMY_AFT.run2Mile[gender]?.find(r => r.ageGroup === ageGroup);

  const dlScore    = dl   ? scoreReps(parseInt(inputs.deadlift) || 0, dl.min60,   dl.max100,   60, 100) : 0;
  const hrpuScore  = hrpu ? scoreReps(parseInt(inputs.hrpu)     || 0, hrpu.min60, hrpu.max100, 60, 100) : 0;
  const sdcScore   = sdc  ? scoreTime(mmssToSec(inputs.sdc),  mmssToSec(sdc.min60),  mmssToSec(sdc.max100),  60, 100) : 0;
  const plankScore = scoreReps(mmssToSec(inputs.plank), mmssToSec(plk.min60), mmssToSec(plk.max100), 60, 100);
  const runScore   = run  ? scoreTime(mmssToSec(inputs.run2Mile), mmssToSec(run.min60), mmssToSec(run.max100), 60, 100) : 0;

  const scores = [dlScore, hrpuScore, sdcScore, plankScore, runScore];
  const total  = scores.reduce((a, b) => a + b, 0);
  const anyEventFail = scores.some(s => s > 0 && s < 60);
  const pass = !anyEventFail && total >= 300;
  const tier = total >= 490 ? 'Distinguished' : total >= 470 ? 'Honor Graduate' : pass ? 'Pass' : 'Fail';
  return {
    total, max: 500, tier, pass,
    events: [
      { name: 'Deadlift',    score: dlScore,    max: 100 },
      { name: 'HRPU',        score: hrpuScore,  max: 100 },
      { name: 'Sprint-Drag', score: sdcScore,   max: 100 },
      { name: 'Plank',       score: plankScore, max: 100 },
      { name: '2-Mile Run',  score: runScore,   max: 100 },
    ],
  };
}

function calcNavyPrt(inputs, gender, ageGroup) {
  const puRow = (NAVY_PRT.pushUps[gender]    || []).find(r => r.ageGroup === ageGroup);
  const plRow = (NAVY_PRT.plank[gender]      || []).find(r => r.ageGroup === ageGroup);
  const rnRow = (NAVY_PRT.run1_5Mile[gender] || []).find(r => r.ageGroup === ageGroup);

  function puBand(row) {
    if (!row) return null;
    const v = parseInt(inputs.pushUps) || 0;
    return v >= row.outstanding ? 'Outstanding' : v >= row.min ? 'Satisfactory' : 'Fail';
  }
  function plBand(row) {
    if (!row) return null;
    const sec = mmssToSec(inputs.plank);
    if (!sec) return null;
    return sec >= mmssToSec(row.outstanding) ? 'Outstanding' : sec >= mmssToSec(row.min) ? 'Satisfactory' : 'Fail';
  }
  function rnBand(row) {
    if (!row) return null;
    const sec = mmssToSec(inputs.run1_5Mile);
    if (!sec) return null;
    return sec <= mmssToSec(row.outstanding) ? 'Outstanding' : sec <= mmssToSec(row.cutoff) ? 'Satisfactory' : 'Fail';
  }

  const bands = [puBand(puRow), plBand(plRow), rnBand(rnRow)];
  const filled = bands.filter(Boolean);
  const overall = filled.includes('Fail') ? 'Fail' : filled.includes('Satisfactory') ? 'Satisfactory' : 'Outstanding';
  return {
    total: null, max: null, tier: overall, pass: overall !== 'Fail',
    events: [
      { name: 'Push-ups',     band: bands[0] },
      { name: 'Plank',        band: bands[1] },
      { name: '1.5-Mile Run', band: bands[2] },
    ],
  };
}

function calcBudsPst(inputs) {
  const evs  = SELECTION_STANDARDS.buds_pst.events;
  const keys = ['swim500', 'pushUps', 'sitUps', 'pullUps', 'run1_5Mile'];

  function band(ev, val) {
    if (!val || !String(val).trim()) return null;
    const isTime = ev.unit === 'mm:ss';
    if (isTime) {
      const sec     = mmssToSec(val);
      const optSec  = mmssToSec(String(ev.optimum).replace('sub ', ''));
      const compSec = mmssToSec(ev.competitive);
      const minSec  = mmssToSec(ev.minimum);
      if (sec <= optSec)  return 'Optimum';
      if (sec <= compSec) return 'Competitive';
      if (sec <= minSec)  return 'Minimum';
      return 'Below Min';
    } else {
      const v   = parseInt(val) || 0;
      const opt = parseInt(String(ev.optimum)) || 0;
      if (v >= opt)           return 'Optimum';
      if (v >= ev.competitive) return 'Competitive';
      if (v >= ev.minimum)     return 'Minimum';
      return 'Below Min';
    }
  }

  const bands   = evs.map((ev, i) => band(ev, inputs[keys[i]]));
  const filled  = bands.filter(Boolean);
  const overall = filled.includes('Below Min') ? 'Below Min'
    : filled.includes('Minimum') ? 'Minimum'
    : filled.includes('Competitive') ? 'Competitive'
    : filled.length ? 'Optimum' : null;

  return {
    total: null, max: null, tier: overall, pass: overall && overall !== 'Below Min',
    events: evs.map((ev, i) => ({ name: ev.name.split(' (')[0], band: bands[i] })),
  };
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MilScoreScreen({ navigation }) {
  const { userData, setUserData } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const profile     = userData.profile || {};
  const profileAge  = parseInt(profile.age) || null;

  const [testId,   setTestId]   = useState('usmc_pft');
  const [gender,   setGender]   = useState(profile.sex || 'male');
  const [ageGroup, setAgeGroup] = useState(() => pickAgeGroup('usmc_pft', profileAge));
  const [inputs,   setInputs]   = useState({});
  const [result,   setResult]   = useState(null);

  useEffect(() => {
    setInputs({});
    setResult(null);
    setAgeGroup(pickAgeGroup(testId, profileAge));
  }, [testId]);

  const set = key => val => setInputs(p => ({ ...p, [key]: val }));

  function calculate() {
    const events = TEST_EVENTS[testId];
    if (testId !== 'buds_pst') {
      const allFilled = events.every(ev => String(inputs[ev.key] ?? '').trim() !== '');
      if (!allFilled) {
        Alert.alert('Missing data', 'Fill in all events before calculating.');
        return;
      }
    }
    let r;
    if      (testId === 'usmc_pft') r = calcUsmcPft(inputs, gender, ageGroup);
    else if (testId === 'usmc_cft') r = calcUsmcCft(inputs, gender, ageGroup);
    else if (testId === 'army_aft') r = calcArmyAft(inputs, gender, ageGroup);
    else if (testId === 'navy_prt') r = calcNavyPrt(inputs, gender, ageGroup);
    else                            r = calcBudsPst(inputs);
    setResult(r);
  }

  function saveResult() {
    if (!result) return;
    const entry = {
      date:   new Date().toISOString().split('T')[0],
      test:   testId,
      gender, ageGroup, inputs,
      result: { tier: result.tier, total: result.total, max: result.max, pass: result.pass },
    };
    setUserData(prev => ({
      ...prev,
      milScores: [entry, ...(prev.milScores || [])].slice(0, 50),
    }));
    Alert.alert('Saved', 'Result added to your military fitness history.');
  }

  const ageGroups = AGE_GROUPS[testId] || [];
  const history   = (userData.milScores || []).filter(e => e.test === testId).slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgPage }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.page} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.textPri} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Mil Fitness Score</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Test tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {TESTS.map(t => (
              <TouchableOpacity key={t.id} style={[s.chip, testId === t.id && s.chipActive]} onPress={() => setTestId(t.id)}>
                <Text style={[s.chipText, testId === t.id && { color: '#fff' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Demographics */}
        {testId !== 'buds_pst' && (
          <View style={s.card}>
            <Text style={s.label}>DEMOGRAPHICS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {['male', 'female'].map(g => (
                <TouchableOpacity key={g} style={[s.toggleBtn, gender === g && s.toggleBtnActive]} onPress={() => setGender(g)}>
                  <Text style={[s.toggleText, gender === g && { color: '#fff' }]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {ageGroups.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[s.label, { marginBottom: 8 }]}>AGE GROUP</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {ageGroups.map(ag => (
                      <TouchableOpacity key={ag} style={[s.chip, ageGroup === ag && s.chipActive]} onPress={() => setAgeGroup(ag)}>
                        <Text style={[s.chipText, ageGroup === ag && { color: '#fff' }]}>{ag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Event inputs */}
        <View style={s.card}>
          <Text style={s.label}>YOUR SCORES</Text>
          {TEST_EVENTS[testId].map(ev => (
            <View key={ev.key} style={{ marginTop: 12 }}>
              <Text style={s.fieldLabel}>{ev.label}</Text>
              <TextInput
                style={s.input}
                value={inputs[ev.key] || ''}
                onChangeText={set(ev.key)}
                keyboardType={ev.type === 'mmss' ? 'numbers-and-punctuation' : 'number-pad'}
                placeholder={ev.ph}
                placeholderTextColor={theme.textSec}
              />
            </View>
          ))}
          <TouchableOpacity style={[s.btn, { marginTop: 16 }]} onPress={calculate}>
            <Text style={s.btnText}>Calculate Score</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {result && (
          <View style={s.card}>
            <Text style={s.label}>RESULTS</Text>
            <View style={[s.tierBadge, { backgroundColor: tierColor(result.tier, theme) + '22', borderColor: tierColor(result.tier, theme) }]}>
              <Text style={[s.tierText, { color: tierColor(result.tier, theme) }]}>{result.tier || '—'}</Text>
              {result.total !== null && (
                <Text style={{ fontSize: 12, color: theme.textSec, marginTop: 4 }}>{result.total} / {result.max} pts</Text>
              )}
            </View>

            <View style={{ marginTop: 14 }}>
              {result.events.map((ev, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={s.fieldLabel}>{ev.name}</Text>
                    {ev.score !== undefined ? (
                      <Text style={[s.fieldLabel, { fontWeight: '700', color: ev.score >= ev.max * 0.7 ? theme.accent : ev.score >= ev.max * 0.6 ? '#fbbf24' : '#f87171' }]}>
                        {ev.score} / {ev.max}
                      </Text>
                    ) : ev.band ? (
                      <Text style={[s.fieldLabel, { fontWeight: '700', color: tierColor(ev.band, theme) }]}>{ev.band}</Text>
                    ) : (
                      <Text style={[s.fieldLabel, { color: theme.textSec }]}>—</Text>
                    )}
                  </View>
                  {ev.score !== undefined && (
                    <View style={s.progTrack}>
                      <View style={[s.progFill, {
                        width: `${Math.min(100, (ev.score / ev.max) * 100)}%`,
                        backgroundColor: ev.score >= ev.max * 0.7 ? theme.accent : ev.score >= ev.max * 0.6 ? '#fbbf24' : '#f87171',
                      }]} />
                    </View>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: theme.bgCard2, borderWidth: 1, borderColor: theme.border }]}
              onPress={saveResult}
            >
              <Ionicons name="save-outline" size={16} color={theme.accent} style={{ marginRight: 6 }} />
              <Text style={[s.btnText, { color: theme.accent }]}>Save Result</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History */}
        {history.length > 0 && (
          <View style={s.card}>
            <Text style={[s.label, { marginBottom: 10 }]}>PREVIOUS SCORES</Text>
            {history.map((h, i) => (
              <View key={i} style={[s.histRow, i < history.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <Text style={{ fontSize: 12, color: theme.textSec }}>{h.date}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: tierColor(h.result.tier, theme) }}>
                  {h.result.total !== null ? `${h.result.total}/${h.result.max} — ` : ''}{h.result.tier}
                </Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(theme) {
  return StyleSheet.create({
    page:           { flex: 1, backgroundColor: theme.bgPage },
    header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    backBtn:        { width: 40 },
    headerTitle:    { fontSize: 20, fontWeight: '900', color: theme.textPri },
    card:           { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: theme.border, padding: 16, marginHorizontal: 16, marginBottom: 12, ...(theme.shadow || {}) },
    label:          { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.textSec, fontWeight: '600' },
    fieldLabel:     { fontSize: 12, color: theme.textSec, marginBottom: 2 },
    input:          { backgroundColor: theme.bgInput, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: theme.textPri, fontSize: 14, borderWidth: 1, borderColor: theme.border },
    toggleBtn:      { flex: 1, padding: 10, borderRadius: 10, backgroundColor: theme.bgCard2, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    toggleBtnActive:{ backgroundColor: theme.accent, borderColor: theme.accent },
    toggleText:     { fontSize: 14, fontWeight: '700', color: theme.textSec },
    chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.bgCard2, borderWidth: 1, borderColor: theme.border },
    chipActive:     { backgroundColor: theme.accent, borderColor: theme.accent },
    chipText:       { fontSize: 13, fontWeight: '700', color: theme.textSec },
    btn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent, borderRadius: 10, padding: 14 },
    btnText:        { color: '#fff', fontWeight: '800', fontSize: 15 },
    tierBadge:      { borderRadius: 10, borderWidth: 1.5, padding: 14, alignItems: 'center', marginTop: 10 },
    tierText:       { fontSize: 24, fontWeight: '900' },
    progTrack:      { height: 6, backgroundColor: theme.progTrack, borderRadius: 3, overflow: 'hidden' },
    progFill:       { height: 6, borderRadius: 3 },
    histRow:        { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  });
}
