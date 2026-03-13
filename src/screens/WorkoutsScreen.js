import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { PROGRAMS, TB_IDS, STANDALONE_IDS, KB_IDS, LIFT_LABELS, DEFAULT_1RM } from '../data/programs';
import { EXERCISE_LIBRARY } from '../data/exercises';

// ── Screens inside the modal ──────────────────────────────
const SCREEN = { LIST: 'list', DETAIL: 'detail', ACTIVE: 'active', ONE_RM: 'oneRM', BUILDER: 'builder', PICKER: 'picker', PLATE_CALC: 'plateCalc' };

export default function WorkoutsScreen() {
  const { userData, setUserData, finishWorkout, loadCustomWorkouts, saveCustomWorkouts } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [modalVisible, setModalVisible] = useState(false);
  const [screen, setScreen] = useState(SCREEN.LIST);
  const [activeProgram, setActiveProgram] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [customWorkouts, setCustomWorkouts] = useState([]);

  // Active workout state
  const [completedSets, setCompletedSets] = useState({});
  const [setWeights, setSetWeights] = useState({});
  const [setReps, setSetReps] = useState({});
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const timerRef = useRef(null);

  // Plate calc state
  const [plateCalcWeight, setPlateCalcWeight] = useState('');
  const [plateCalcBarIdx, setPlateCalcBarIdx] = useState(0);
  const [plateCalcFrom,   setPlateCalcFrom]   = useState(SCREEN.DETAIL);

  // Custom builder state
  const [builderName, setBuilderName] = useState('');
  const [builderExercises, setBuilderExercises] = useState([]);
  const [editingCustomIdx, setEditingCustomIdx] = useState(null);
  const [exerciseSearchQ, setExerciseSearchQ] = useState('');
  const [customExName, setCustomExName] = useState('');
  const [customExSets, setCustomExSets] = useState('3');
  const [customExReps, setCustomExReps] = useState('10');
  const [customExWeighted, setCustomExWeighted] = useState(true);

  useEffect(() => {
    loadCustomWorkouts().then(setCustomWorkouts);
  }, []);

  function openModal() {
    loadCustomWorkouts().then(setCustomWorkouts);
    setScreen(SCREEN.LIST);
    setModalVisible(true);
  }

  function goTo(scr) { setScreen(scr); }

  // ── 1RM editor ──────────────────────────────────────────
  const [oneRMValues, setOneRMValues] = useState({});
  function openOneRM() {
    const vals = {};
    Object.keys(LIFT_LABELS).forEach(k => {
      vals[k] = String((userData.oneRM || {})[k] || DEFAULT_1RM[k] || '');
    });
    setOneRMValues(vals);
    goTo(SCREEN.ONE_RM);
  }
  function saveOneRMs() {
    const newOneRM = {};
    Object.keys(LIFT_LABELS).forEach(k => {
      const v = parseFloat(oneRMValues[k]);
      if (!isNaN(v)) newOneRM[k] = v;
    });
    setUserData(prev => ({ ...prev, oneRM: { ...(prev.oneRM || {}), ...newOneRM } }));
    goTo(SCREEN.DETAIL);
  }

  // ── Plate calculator ────────────────────────────────────
  function openPlateCalc(weight) {
    setPlateCalcFrom(screen);
    setPlateCalcWeight(String(weight || ''));
    setPlateCalcBarIdx(0);
    goTo(SCREEN.PLATE_CALC);
  }

  // ── Program detail ──────────────────────────────────────
  function openProgramDetail(programId) {
    const p = PROGRAMS.find(x => x.id === programId);
    if (!p) return;
    const schedule = p.getSchedule(userData.oneRM || {}, userData.weights || {});
    const sessionsLogged = (userData.workoutHistory || []).filter(w => w.program === programId).length;
    const dayIdx = sessionsLogged % schedule.length;
    setActiveProgram({ ...p, schedule });
    setActiveDayIndex(dayIdx);
    goTo(SCREEN.DETAIL);
  }

  function openCustomWorkout(idx) {
    const cw = customWorkouts[idx];
    if (!cw) return;
    const schedule = [{
      day: cw.name,
      exercises: cw.exercises.map(ex => ({
        name: ex.name, sets: ex.sets, reps: ex.reps,
        weight_key: ex.weight_key,
        target_weight: ex.weight_key ? ((userData.weights || {})[ex.weight_key] || null) : null,
      })),
    }];
    setActiveProgram({ id: 'custom_' + idx, name: cw.name, schedule, isCustom: true, customIdx: idx });
    setActiveDayIndex(0);
    goTo(SCREEN.DETAIL);
  }

  // ── Begin workout ───────────────────────────────────────
  function beginWorkout() {
    if (!activeProgram) return;
    const day = activeProgram.schedule[activeDayIndex];
    // Init weights / reps from saved data
    const initW = {}, initR = {};
    day.exercises.forEach((ex, i) => {
      for (let s = 1; s <= ex.sets; s++) {
        initW[`${i}-${s}`] = String(ex.target_weight || (ex.weight_key ? (userData.weights || {})[ex.weight_key] || '' : '') || '');
        initR[`${i}-${s}`] = typeof ex.reps === 'number' ? String(ex.reps) : '';
      }
    });
    setSetWeights(initW);
    setSetReps(initR);
    setCompletedSets({});
    setWorkoutSeconds(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setWorkoutSeconds(prev => prev + 1), 1000);
    goTo(SCREEN.ACTIVE);
  }

  function toggleSet(exIdx, setNum, totalSets) {
    const key = `${exIdx}-${setNum}`;
    setCompletedSets(prev => {
      const next = { ...prev };
      if (!next[exIdx]) next[exIdx] = new Set();
      else next[exIdx] = new Set(next[exIdx]);
      if (next[exIdx].has(setNum)) next[exIdx].delete(setNum);
      else next[exIdx].add(setNum);

      // Persist weight for this exercise
      const w = setWeights[key];
      if (w && activeProgram) {
        const ex = activeProgram.schedule[activeDayIndex].exercises[exIdx];
        if (ex.weight_key) {
          setUserData(p => ({ ...p, weights: { ...(p.weights || {}), [ex.weight_key]: parseFloat(w) || 0 } }));
        }
      }
      return next;
    });
  }

  function confirmFinish() {
    clearInterval(timerRef.current);
    const mins = Math.round(workoutSeconds / 60);
    Alert.alert(
      'Finish Workout?',
      `Time: ${mins} min`,
      [
        { text: 'Cancel', onPress: () => { timerRef.current = setInterval(() => setWorkoutSeconds(prev => prev + 1), 1000); } },
        { text: 'Finish 💪', style: 'destructive', onPress: () => {
          finishWorkout(activeProgram.id, activeProgram.schedule[activeDayIndex].day, mins);
          setModalVisible(false);
        }},
      ]
    );
  }

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  // ── Custom builder ──────────────────────────────────────
  function openBuilder(editIdx = null) {
    setEditingCustomIdx(editIdx);
    if (editIdx !== null && customWorkouts[editIdx]) {
      setBuilderName(customWorkouts[editIdx].name);
      setBuilderExercises([...customWorkouts[editIdx].exercises]);
    } else {
      setBuilderName('');
      setBuilderExercises([]);
    }
    goTo(SCREEN.BUILDER);
  }

  async function saveCustomWorkout() {
    if (!builderName.trim()) { Alert.alert('Name required', 'Give your workout a name'); return; }
    if (!builderExercises.length) { Alert.alert('No exercises', 'Add at least one exercise'); return; }
    const workouts = await loadCustomWorkouts();
    const workout = { name: builderName.trim(), exercises: builderExercises };
    if (editingCustomIdx !== null) workouts[editingCustomIdx] = workout;
    else workouts.push(workout);
    await saveCustomWorkouts(workouts);
    const updated = await loadCustomWorkouts();
    setCustomWorkouts(updated);
    goTo(SCREEN.LIST);
  }

  async function deleteCustom(idx) {
    Alert.alert('Delete workout?', customWorkouts[idx]?.name, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const w = await loadCustomWorkouts();
        w.splice(idx, 1);
        await saveCustomWorkouts(w);
        setCustomWorkouts([...w]);
      }},
    ]);
  }

  function quickAddExercise(ex) {
    const sets = parseInt(customExSets) || 3;
    const reps = parseInt(customExReps) || 10;
    setBuilderExercises(prev => [...prev, {
      name: ex.name, sets, reps, weighted: ex.weighted,
      weight_key: ex.weighted ? 'cust_' + ex.name.toLowerCase().replace(/\s+/g, '_') : null,
    }]);
    goTo(SCREEN.BUILDER);
  }

  function addFromForm() {
    const name = customExName.trim();
    if (!name) { Alert.alert('Name required'); return; }
    const sets = parseInt(customExSets) || 3;
    const reps = parseInt(customExReps) || 10;
    setBuilderExercises(prev => [...prev, {
      name, sets, reps, weighted: customExWeighted,
      weight_key: customExWeighted ? 'cust_' + name.toLowerCase().replace(/\s+/g, '_') : null,
    }]);
    goTo(SCREEN.BUILDER);
  }

  function moveEx(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= builderExercises.length) return;
    const arr = [...builderExercises];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setBuilderExercises(arr);
  }

  // ── Render helpers ──────────────────────────────────────
  function renderProgramList() {
    const tbPrograms = TB_IDS.map(id => PROGRAMS.find(p => p.id === id)).filter(Boolean);
    const standalone  = STANDALONE_IDS.map(id => PROGRAMS.find(p => p.id === id)).filter(Boolean);
    const kb          = KB_IDS.map(id => PROGRAMS.find(p => p.id === id)).filter(Boolean);

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Tactical Barbell group */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={[s.progIcon, { backgroundColor: '#14532d' }]}>
              <Ionicons name="shield" size={18} color="#4ade80" />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={[s.bold, { color: theme.textPri }]}>Tactical Barbell</Text>
              <Text style={{ color: theme.textSec, fontSize: 12 }}>6 protocols · 2–4 days/week</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {tbPrograms.map(p => (
              <TouchableOpacity key={p.id} onPress={() => openProgramDetail(p.id)}
                style={[s.tbChip, { backgroundColor: p.color[0] }]}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{p.name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{p.freq}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={s.sectionLabel}>Other Programs</Text>
        {standalone.map(p => <ProgramCard key={p.id} program={p} onPress={() => openProgramDetail(p.id)} theme={theme} s={s} />)}

        <Text style={s.sectionLabel}>Kettlebell Programs</Text>
        {kb.map(p => <ProgramCard key={p.id} program={p} onPress={() => openProgramDetail(p.id)} theme={theme} s={s} />)}

        {customWorkouts.length > 0 && <>
          <Text style={s.sectionLabel}>My Custom Workouts</Text>
          {customWorkouts.map((cw, idx) => (
            <View key={idx} style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.bold, { color: theme.textPri }]}>{cw.name}</Text>
                <Text style={{ color: theme.textSec, fontSize: 12 }}>{cw.exercises.length} exercises</Text>
              </View>
              <TouchableOpacity onPress={() => openCustomWorkout(idx)} style={[s.btnAccent, { paddingVertical: 6, paddingHorizontal: 12 }]}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openBuilder(idx)} style={{ marginLeft: 8 }}>
                <Ionicons name="create-outline" size={18} color={theme.textSec} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteCustom(idx)} style={{ marginLeft: 8 }}>
                <Ionicons name="trash-outline" size={18} color="#f87171" />
              </TouchableOpacity>
            </View>
          ))}
        </>}

        <TouchableOpacity style={s.dashedBtn} onPress={() => openBuilder()}>
          <Ionicons name="add" size={18} color={theme.textSec} />
          <Text style={{ color: theme.textSec, fontWeight: '600', marginLeft: 6 }}>Create Custom Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderDetail() {
    if (!activeProgram) return null;
    const isTB = TB_IDS.includes(activeProgram.id);
    const oneRM = userData.oneRM || {};

    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={[s.bodySec, { marginBottom: 16, lineHeight: 20 }]}>{activeProgram.desc}</Text>

        {/* 1RM summary for TB programs */}
        {isTB && (
          <View style={[s.card2, { marginBottom: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '600' }}>Your 1RMs (used for calculations)</Text>
              <TouchableOpacity onPress={openOneRM}><Text style={{ color: theme.accent, fontSize: 12 }}>Edit</Text></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(LIFT_LABELS).map(([k, label]) => (
                <View key={k} style={{ alignItems: 'center', minWidth: 50 }}>
                  <Text style={{ color: theme.textPri, fontWeight: '700', fontSize: 14 }}>{(oneRM[k] || DEFAULT_1RM[k])}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10 }}>{k}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Schedule */}
        {activeProgram.schedule.slice(0, 12).map((day, i) => {
          const isNext = i === activeDayIndex;
          const topWeights = day.exercises.filter(e => e.target_weight).map(e => `${e.name} ${e.target_weight}lbs`).join(' · ');
          const noWeights  = day.exercises.filter(e => !e.target_weight).map(e => e.name).join(' · ');
          return (
            <View key={i} style={[s.card2, { marginBottom: 8, opacity: isNext ? 1 : 0.5, borderColor: isNext ? theme.accent : theme.border, borderWidth: isNext ? 1.5 : 1 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: theme.textPri, fontWeight: '600', fontSize: 13, flex: 1, marginRight: 8 }}>{day.day}</Text>
                {isNext && <View style={{ backgroundColor: '#7c3aed', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Next Up</Text></View>}
              </View>
              {isNext ? (
                <View style={{ gap: 6, marginTop: 4 }}>
                  {day.exercises.map((ex, exI) => (
                    <View key={exI} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ flex: 1, fontSize: 12, color: ex.target_weight ? '#fbbf24' : theme.textMuted }}>
                        {ex.name}{ex.target_weight ? `  ·  ${ex.target_weight} lbs` : ''}
                      </Text>
                      {ex.target_weight ? (
                        <TouchableOpacity
                          onPress={() => openPlateCalc(ex.target_weight)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="barbell-outline" size={15} color={theme.accent} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <>
                  {topWeights ? <Text style={{ color: '#fbbf24', fontSize: 12 }}>{topWeights}</Text> : null}
                  {noWeights  ? <Text style={{ color: theme.textMuted, fontSize: 12 }}>{noWeights}</Text>  : null}
                </>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={[s.btnAccent, { marginTop: 8 }]} onPress={beginWorkout}>
          <Ionicons name="play" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Today's Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderActiveWorkout() {
    if (!activeProgram) return null;
    const day = activeProgram.schedule[activeDayIndex];
    const totalEx = day.exercises.length;
    const doneEx = day.exercises.filter((_, i) => {
      const total = day.exercises[i].sets;
      return completedSets[i] && completedSets[i].size === total;
    }).length;
    const pct = totalEx > 0 ? doneEx / totalEx : 0;

    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Progress bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: theme.textSec, fontSize: 12 }}>{doneEx} of {totalEx} exercises done</Text>
          <Text style={{ color: theme.textSec, fontSize: 12 }}>{formatTime(workoutSeconds)}</Text>
        </View>
        <View style={[s.progTrack, { marginBottom: 16 }]}>
          <View style={[s.progFill, { width: `${pct * 100}%`, backgroundColor: '#7c3aed' }]} />
        </View>

        {day.exercises.map((ex, exIdx) => {
          const doneSets = completedSets[exIdx]?.size || 0;
          const allDone = doneSets === ex.sets;
          return (
            <View key={exIdx} style={[s.card, { marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: theme.textPri, fontWeight: '700', fontSize: 15, flex: 1 }}>{ex.name}</Text>
                    {ex.weight_key !== null && (
                      <TouchableOpacity
                        onPress={() => openPlateCalc(setWeights[`${exIdx}-1`] || ex.target_weight || '')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="barbell-outline" size={18} color={theme.accent} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={{ color: theme.textSec, fontSize: 12 }}>
                    {ex.sets} sets × {ex.reps} reps
                    {ex.target_weight ? ` · ${ex.target_weight} lbs target` : ''}
                  </Text>
                  {ex.note ? <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{ex.note}</Text> : null}
                </View>
                <View style={[s.exBadge, allDone && s.exBadgeDone]}>
                  {allDone
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Text style={{ color: theme.textMuted, fontSize: 11 }}>{doneSets}/{ex.sets}</Text>
                  }
                </View>
              </View>

              {Array.from({ length: ex.sets }, (_, si) => {
                const sNum = si + 1;
                const key = `${exIdx}-${sNum}`;
                const done = completedSets[exIdx]?.has(sNum);
                return (
                  <View key={sNum} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                    <Text style={{ color: theme.textSec, fontSize: 12, width: 40 }}>Set {sNum}</Text>
                    {ex.weight_key !== null ? (
                      <>
                        <TextInput
                          style={[s.setInput, { width: 70 }]}
                          placeholder="lbs"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="decimal-pad"
                          value={setWeights[key] || ''}
                          onChangeText={v => setSetWeights(p => ({ ...p, [key]: v }))}
                        />
                        <TextInput
                          style={[s.setInput, { width: 56 }]}
                          placeholder="reps"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="number-pad"
                          value={setReps[key] || ''}
                          onChangeText={v => setSetReps(p => ({ ...p, [key]: v }))}
                        />
                      </>
                    ) : (
                      <Text style={{ color: theme.textSec, fontSize: 12, flex: 1 }}>{ex.reps}</Text>
                    )}
                    <TouchableOpacity
                      style={[s.setCheckBtn, done && s.setCheckBtnDone]}
                      onPress={() => toggleSet(exIdx, sNum, ex.sets)}
                    >
                      <Ionicons name="checkmark" size={14} color={done ? '#fff' : theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  function renderOneRM() {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={[s.bodySec, { marginBottom: 16, lineHeight: 20 }]}>
          Update these after every retest (every 6–12 weeks). All TB weights calculate automatically.
        </Text>
        {Object.entries(LIFT_LABELS).map(([key, label]) => (
          <View key={key} style={[s.card2, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, marginBottom: 8 }]}>
            <Text style={{ color: theme.textPri, fontWeight: '600', fontSize: 14 }}>{label}</Text>
            <TextInput
              style={[s.setInput, { width: 90, textAlign: 'center' }]}
              keyboardType="decimal-pad"
              value={oneRMValues[key] || ''}
              onChangeText={v => setOneRMValues(p => ({ ...p, [key]: v }))}
              placeholder="lbs"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        ))}
        <TouchableOpacity style={[s.btnAccent, { marginTop: 8, backgroundColor: '#d97706' }]} onPress={saveOneRMs}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Save 1RMs</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderPlateCalc() {
    const BAR_TYPES = [
      { label: 'Olympic',  weight: 45 },
      { label: "Women's", weight: 35 },
      { label: 'EZ Curl', weight: 20 },
    ];
    const PLATES = [
      { weight: 45, color: '#1e3a8a' }, { weight: 35, color: '#7c3aed' },
      { weight: 25, color: '#166534' }, { weight: 10, color: '#92400e' },
      { weight: 5,  color: '#9ca3af' }, { weight: 2.5, color: '#6b7280' },
      { weight: 1.25, color: '#d1d5db' },
    ];
    const QUICK = [95, 135, 185, 225, 275, 315, 405];
    const barWeight = BAR_TYPES[plateCalcBarIdx].weight;
    const total     = parseFloat(plateCalcWeight) || 0;
    const perSide   = (total - barWeight) / 2;
    function calcPlates(remaining) {
      const result = []; let left = remaining;
      for (const p of PLATES) {
        const count = Math.floor(left / p.weight);
        if (count > 0) { result.push({ ...p, count }); left -= count * p.weight; left = parseFloat(left.toFixed(3)); }
      }
      return result;
    }
    const platesPerSide = perSide > 0 ? calcPlates(perSide) : [];
    const achievable = platesPerSide.reduce((a, p) => a + p.weight * p.count, 0) * 2 + barWeight;
    const isExact    = total > 0 && Math.abs(achievable - total) < 0.01;

    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Bar type */}
        <View style={s.card2}>
          <Text style={s.sectionLabel}>BAR TYPE</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {BAR_TYPES.map((b, i) => (
              <TouchableOpacity key={b.label} style={[s.card2, { flex: 1, alignItems: 'center', padding: 10, borderColor: plateCalcBarIdx === i ? theme.accent : theme.border, borderWidth: plateCalcBarIdx === i ? 2 : 1 }]} onPress={() => setPlateCalcBarIdx(i)}>
                <Text style={{ color: plateCalcBarIdx === i ? theme.accent : theme.textPri, fontWeight: '700', fontSize: 13 }}>{b.label}</Text>
                <Text style={{ color: theme.textSec, fontSize: 11 }}>{b.weight} lb</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target weight */}
        <View style={[s.card2, { marginTop: 12 }]}>
          <Text style={s.sectionLabel}>TARGET WEIGHT (lbs)</Text>
          <TextInput
            style={{ fontSize: 36, fontWeight: '900', color: theme.textPri, backgroundColor: theme.bgInput, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, textAlign: 'center', borderWidth: 1, borderColor: theme.border, marginTop: 8 }}
            value={plateCalcWeight}
            onChangeText={setPlateCalcWeight}
            keyboardType="decimal-pad"
            placeholder={String(barWeight)}
            placeholderTextColor={theme.textSec}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {QUICK.map(w => (
                <TouchableOpacity key={w} style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.bgCard, borderRadius: 8, borderWidth: 1, borderColor: theme.border }} onPress={() => setPlateCalcWeight(String(w))}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSec }}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Result */}
        {total > 0 && (
          <View style={[s.card2, { marginTop: 12 }]}>
            <Text style={s.sectionLabel}>PLATES PER SIDE</Text>
            {perSide <= 0 ? (
              <Text style={{ color: theme.textSec, fontSize: 13, marginTop: 8 }}>Target must be greater than bar weight ({barWeight} lbs)</Text>
            ) : (
              <>
                {platesPerSide.length === 0
                  ? <Text style={{ color: theme.textSec, fontSize: 13, marginTop: 8 }}>Bar only</Text>
                  : platesPerSide.map((p, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 10 }}>
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.color }} />
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: theme.textPri }}>{p.weight} lb</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.accent }}>× {p.count} per side</Text>
                    </View>
                  ))
                }
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: theme.border }}>
                  <Text style={{ color: theme.textSec, fontSize: 13 }}>Achievable weight</Text>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: isExact ? theme.accent : '#fbbf24' }}>
                    {achievable} lbs{!isExact ? ` (target: ${total})` : ''}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  function renderBuilder() {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={s.inputLabel}>Workout Name</Text>
        <TextInput style={s.textInput} value={builderName} onChangeText={setBuilderName}
          placeholder="e.g. Push Day, Leg Day..." placeholderTextColor={theme.textMuted} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={s.inputLabel}>Exercises</Text>
          <TouchableOpacity onPress={() => { setExerciseSearchQ(''); setCustomExName(''); setCustomExSets('3'); setCustomExReps('10'); goTo(SCREEN.PICKER); }}>
            <Text style={{ color: '#a78bfa', fontWeight: '600', fontSize: 13 }}>+ Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {builderExercises.length === 0
          ? <Text style={{ color: theme.textMuted, textAlign: 'center', paddingVertical: 16, fontSize: 13 }}>No exercises yet — tap Add Exercise</Text>
          : builderExercises.map((ex, i) => (
            <View key={i} style={[s.card2, { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textPri, fontWeight: '600', fontSize: 13 }}>{ex.name}</Text>
                <Text style={{ color: theme.textSec, fontSize: 12 }}>{ex.sets} sets × {ex.reps} reps{ex.weighted ? ' · weighted' : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => moveEx(i, -1)} style={{ padding: 4 }}><Ionicons name="chevron-up" size={16} color={theme.textSec} /></TouchableOpacity>
              <TouchableOpacity onPress={() => moveEx(i, 1)} style={{ padding: 4 }}><Ionicons name="chevron-down" size={16} color={theme.textSec} /></TouchableOpacity>
              <TouchableOpacity onPress={() => setBuilderExercises(prev => prev.filter((_, j) => j !== i))} style={{ padding: 4 }}><Ionicons name="close-circle" size={16} color="#f87171" /></TouchableOpacity>
            </View>
          ))
        }

        <TouchableOpacity style={[s.btnAccent, { marginTop: 16, backgroundColor: '#7c3aed' }]} onPress={saveCustomWorkout}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Save Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderPicker() {
    const filtered = exerciseSearchQ.trim()
      ? EXERCISE_LIBRARY.filter(e => e.name.toLowerCase().includes(exerciseSearchQ.toLowerCase()) || e.cat.toLowerCase().includes(exerciseSearchQ.toLowerCase()))
      : EXERCISE_LIBRARY;

    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TextInput
          style={[s.textInput, { marginBottom: 12 }]}
          value={exerciseSearchQ}
          onChangeText={setExerciseSearchQ}
          placeholder="Search or type your own..."
          placeholderTextColor={theme.textMuted}
          autoFocus
        />
        {filtered.slice(0, 20).map((ex, i) => (
          <TouchableOpacity key={i} style={[s.card2, { flexDirection: 'row', justifyContent: 'space-between', padding: 12, marginBottom: 6 }]} onPress={() => quickAddExercise(ex)}>
            <Text style={{ color: theme.textPri, fontWeight: '600', fontSize: 13 }}>{ex.name}</Text>
            <Text style={{ color: theme.textSec, fontSize: 12 }}>{ex.cat}</Text>
          </TouchableOpacity>
        ))}

        <View style={[s.card2, { padding: 12, marginTop: 8 }]}>
          <Text style={{ color: theme.textSec, fontSize: 12, marginBottom: 8 }}>Not in the list? Configure custom:</Text>
          <TextInput style={[s.textInput, { marginBottom: 8 }]} value={customExName} onChangeText={setCustomExName} placeholder="Exercise name" placeholderTextColor={theme.textMuted} />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TextInput style={[s.textInput, { flex: 1, textAlign: 'center' }]} value={customExSets} onChangeText={setCustomExSets} placeholder="Sets" keyboardType="number-pad" placeholderTextColor={theme.textMuted} />
            <TextInput style={[s.textInput, { flex: 1, textAlign: 'center' }]} value={customExReps} onChangeText={setCustomExReps} placeholder="Reps" keyboardType="number-pad" placeholderTextColor={theme.textMuted} />
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => setCustomExWeighted(!customExWeighted)}>
            <View style={[{ width: 18, height: 18, borderWidth: 2, borderColor: theme.accent, borderRadius: 3, marginRight: 8, alignItems: 'center', justifyContent: 'center' }]}>
              {customExWeighted && <Ionicons name="checkmark" size={12} color={theme.accent} />}
            </View>
            <Text style={{ color: theme.textSec, fontSize: 13 }}>Uses weight (barbell/dumbbell)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnAccent, { backgroundColor: '#7c3aed' }]} onPress={addFromForm}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Add to Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Header config per screen
  const screenTitle = {
    [SCREEN.LIST]:       'Choose Program',
    [SCREEN.DETAIL]:     activeProgram?.name || 'Program',
    [SCREEN.ACTIVE]:     activeProgram?.schedule?.[activeDayIndex]?.day || 'Workout',
    [SCREEN.ONE_RM]:     'Your 1 Rep Maxes',
    [SCREEN.BUILDER]:    'Build Custom Workout',
    [SCREEN.PICKER]:     'Add Exercise',
    [SCREEN.PLATE_CALC]: 'Plate Calculator',
  };
  const backScreen = {
    [SCREEN.DETAIL]:     SCREEN.LIST,
    [SCREEN.ACTIVE]:     SCREEN.DETAIL,
    [SCREEN.ONE_RM]:     SCREEN.DETAIL,
    [SCREEN.BUILDER]:    SCREEN.LIST,
    [SCREEN.PICKER]:     SCREEN.BUILDER,
    [SCREEN.PLATE_CALC]: plateCalcFrom,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgPage }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={[makeStyles(theme).card, { alignItems: 'center', paddingVertical: 32 }]}>
          <Ionicons name="barbell" size={36} color={theme.accent} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 20, fontWeight: '900', color: theme.textPri, marginBottom: 8 }}>Workouts</Text>
          <Text style={{ color: theme.textSec, fontSize: 13, marginBottom: 20 }}>Track your training sessions and programs</Text>
          <TouchableOpacity style={makeStyles(theme).btnAccent} onPress={openModal}>
            <Ionicons name="play" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: theme.bgCard }}>
          {/* Modal header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            {screen !== SCREEN.LIST
              ? <TouchableOpacity onPress={() => goTo(backScreen[screen])} style={{ marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={22} color={theme.textPri} />
                </TouchableOpacity>
              : null
            }
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: theme.textPri }}>{screenTitle[screen]}</Text>
            {screen === SCREEN.ACTIVE
              ? <TouchableOpacity style={[makeStyles(theme).btnAccent, { paddingVertical: 6, paddingHorizontal: 14 }]} onPress={confirmFinish}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Finish</Text>
                </TouchableOpacity>
              : <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textSec} />
                </TouchableOpacity>
            }
          </View>

          {screen === SCREEN.LIST       && renderProgramList()}
          {screen === SCREEN.DETAIL     && renderDetail()}
          {screen === SCREEN.ACTIVE     && renderActiveWorkout()}
          {screen === SCREEN.ONE_RM     && renderOneRM()}
          {screen === SCREEN.PLATE_CALC && renderPlateCalc()}
          {screen === SCREEN.BUILDER    && renderBuilder()}
          {screen === SCREEN.PICKER     && renderPicker()}
        </View>
      </Modal>
    </View>
  );
}

function ProgramCard({ program: p, onPress, theme, s }) {
  return (
    <View style={[s.card, { marginBottom: 10 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={[s.progIcon, { backgroundColor: p.color[0] }]}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>GO</Text>
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={[s.bold, { color: theme.textPri }]}>{p.name}</Text>
          <Text style={{ color: theme.textSec, fontSize: 12 }}>{p.goal} · {p.freq}</Text>
        </View>
      </View>
      <Text style={{ color: theme.textSec, fontSize: 12, marginBottom: 10, lineHeight: 18 }} numberOfLines={2}>{p.desc}</Text>
      <TouchableOpacity style={[s.btnAccent, { backgroundColor: p.color[0] }]} onPress={onPress}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>View Program</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(theme) {
  const s = StyleSheet.create({
    card:         { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 12 },
    card2:        { backgroundColor: theme.bgCard2, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: theme.border, padding: 12 },
    bold:         { fontWeight: '700', fontSize: 14 },
    bodySec:      { color: theme.textSec, fontSize: 13 },
    sectionLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.textMuted, fontWeight: '600', marginBottom: 8, marginTop: 4 },
    inputLabel:   { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.textSec, fontWeight: '600', marginBottom: 6 },
    textInput:    { backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, borderRadius: 10, color: theme.textPri, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
    setInput:     { backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, borderRadius: 8, color: theme.textPri, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13 },
    btnAccent:    { backgroundColor: theme.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    dashedBtn:    { borderWidth: 2, borderStyle: 'dashed', borderColor: theme.border, borderRadius: theme.cardRadius, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginVertical: 8 },
    progIcon:     { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    tbChip:       { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: '44%' },
    progTrack:    { height: 6, backgroundColor: theme.progTrack, borderRadius: 3, overflow: 'hidden' },
    progFill:     { height: 6, borderRadius: 3 },
    exBadge:      { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    exBadgeDone:  { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    setCheckBtn:  { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    setCheckBtnDone: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  });
  return s;
}
