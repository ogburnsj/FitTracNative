import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fittrac_user_data';
const CUSTOM_KEY  = 'fittrac_custom_workouts';

const DEFAULT_DATA = {
  calories: 0,
  targetCalories: 2000,
  workoutsCompleted: 0,
  weight: 0,
  weightHistory: [],
  workoutHistory: [],
  currentProgram: null,
  lastWorkout: null,
  chatHistory: [],
  isPremium: false,
  foodLog: {},          // { 'YYYY-MM-DD': { Breakfast:[], Lunch:[], Dinner:[], Snacks:[] } }
  oneRM: {},            // { squat, bench, deadlift, ohp, row, pullups }
  weights: {},          // per-exercise working weights
  apiKey: '',           // Claude API key (entered by user in Settings)
  profile: {
    age: null, heightFt: null, heightIn: null,
    weight: null, sex: 'male', activityLevel: 'moderate',
    goal: 'maintain', tdee: null, goalAdjustment: 0, goalSliderIdx: 1,
  },
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [userData, setUserDataRaw] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const saveTimeout = useRef(null);

  // Load on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          setUserDataRaw(prev => deepMerge(prev, saved));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  // Debounced save — write 400ms after last update
  function setUserData(updater) {
    setUserDataRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }, 400);
      return next;
    });
  }

  // Immediate save (for critical writes like program finish)
  async function saveNow(data) {
    clearTimeout(saveTimeout.current);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ── Food helpers ─────────────────────────────────────
  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getTodayFoodLog() {
    const today = getTodayKey();
    const log = userData.foodLog?.[today];
    return log || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  }

  function addFoodEntry(meal, entry) {
    setUserData(prev => {
      const today = getTodayKey();
      const log = { ...(prev.foodLog || {}) };
      const dayLog = log[today]
        ? { ...log[today] }
        : { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
      dayLog[meal] = [...(dayLog[meal] || []), entry];
      log[today] = dayLog;
      const allEntries = Object.values(dayLog).flat();
      const calories = allEntries.reduce((a, b) => a + (b.cal || 0), 0);
      return { ...prev, foodLog: log, calories };
    });
  }

  function removeFoodEntry(meal, idx) {
    setUserData(prev => {
      const today = getTodayKey();
      const log = { ...(prev.foodLog || {}) };
      const dayLog = { ...(log[today] || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] }) };
      dayLog[meal] = dayLog[meal].filter((_, i) => i !== idx);
      log[today] = dayLog;
      const allEntries = Object.values(dayLog).flat();
      const calories = allEntries.reduce((a, b) => a + (b.cal || 0), 0);
      return { ...prev, foodLog: log, calories };
    });
  }

  function clearTodayFood() {
    setUserData(prev => {
      const today = getTodayKey();
      const log = { ...(prev.foodLog || {}) };
      log[today] = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
      return { ...prev, foodLog: log, calories: 0 };
    });
  }

  // ── Weight helpers ────────────────────────────────────
  function logWeight(weight) {
    setUserData(prev => ({
      ...prev,
      weight,
      weightHistory: [...(prev.weightHistory || []), { date: new Date().toISOString(), weight }],
    }));
  }

  // ── Workout helpers ───────────────────────────────────
  function finishWorkout(programId, dayName, durationMins) {
    setUserData(prev => {
      const history = [...(prev.workoutHistory || []), {
        date: new Date().toISOString(),
        program: programId,
        day: dayName,
        duration: durationMins,
        completed: true,
      }];
      return {
        ...prev,
        currentProgram: programId,
        workoutsCompleted: (prev.workoutsCompleted || 0) + 1,
        lastWorkout: new Date().toISOString(),
        workoutHistory: history,
      };
    });
  }

  // ── Custom workout helpers ────────────────────────────
  async function loadCustomWorkouts() {
    try {
      const raw = await AsyncStorage.getItem(CUSTOM_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  async function saveCustomWorkouts(workouts) {
    await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(workouts));
  }

  // ── Stats calculators ─────────────────────────────────
  function calcStreak() {
    const history = userData.workoutHistory || [];
    if (!history.length) return 0;
    const dates = [...new Set(history.map(w => w.date.slice(0, 10)))].sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let cursor = dates[0] === today ? today : dates[0] === yesterday ? yesterday : null;
    if (!cursor) return 0;
    let streak = 0;
    for (const d of dates) {
      if (d === cursor) {
        streak++;
        cursor = new Date(new Date(cursor) - 86400000).toISOString().slice(0, 10);
      } else break;
    }
    return streak;
  }

  function calc7DayCalAvg() {
    const log = userData.foodLog || {};
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const entries = Object.values(log[d] || {}).flat();
      const cal = entries.reduce((a, b) => a + (b.cal || 0), 0);
      if (cal > 0) days.push(cal);
    }
    if (!days.length) return null;
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  }

  function calcWeightDelta() {
    const wh = userData.weightHistory || [];
    if (wh.length < 2) return null;
    const sorted = [...wh].sort((a, b) => new Date(a.date) - new Date(b.date));
    return parseFloat((sorted[sorted.length - 1].weight - sorted[0].weight).toFixed(1));
  }

  return (
    <AppContext.Provider value={{
      userData, setUserData, saveNow, loaded,
      getTodayFoodLog, addFoodEntry, removeFoodEntry, clearTodayFood,
      logWeight, finishWorkout,
      loadCustomWorkouts, saveCustomWorkouts,
      calcStreak, calc7DayCalAvg, calcWeightDelta,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

// Deep merge: src values override dst, arrays fully replaced
function deepMerge(dst, src) {
  if (!src || typeof src !== 'object') return dst;
  const out = { ...dst };
  for (const key of Object.keys(src)) {
    if (
      src[key] && typeof src[key] === 'object' && !Array.isArray(src[key]) &&
      dst[key] && typeof dst[key] === 'object' && !Array.isArray(dst[key])
    ) {
      out[key] = deepMerge(dst[key], src[key]);
    } else {
      out[key] = src[key];
    }
  }
  return out;
}
