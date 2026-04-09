import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ── Type definitions ──────────────────────────────────────────────────────────

/**
 * A single food log entry.
 * @typedef {{ n: string, cal: number, pro: number, carb: number, fat: number, fib: number, sod: number, srv: string, servings: number, _usda?: boolean }} FoodEntry
 */

/**
 * A single weight log entry.
 * @typedef {{ date: string, weight: number }} WeightEntry
 */

/**
 * A completed workout record.
 * @typedef {{ date: string, program: string, day: string, duration: number, completed: boolean }} WorkoutEntry
 */

/**
 * User's physical profile used for TDEE calculations.
 * @typedef {{ age: number|null, heightFt: number|null, heightIn: number|null, weight: number|null, sex: string, activityLevel: string, goal: string, tdee: number|null, goalAdjustment: number, goalSliderIdx: number }} UserProfile
 */

/**
 * All meals for a single calendar day.
 * @typedef {{ Breakfast: FoodEntry[], Lunch: FoodEntry[], Dinner: FoodEntry[], Snacks: FoodEntry[] }} DayFoodLog
 */

/**
 * The full persisted user state.
 * @typedef {{
 *   calories: number,
 *   targetCalories: number,
 *   workoutsCompleted: number,
 *   weight: number,
 *   weightHistory: WeightEntry[],
 *   workoutHistory: WorkoutEntry[],
 *   currentProgram: string|null,
 *   lastWorkout: string|null,
 *   chatHistory: any[],
 *   isPremium: boolean,
 *   foodLog: Record<string, DayFoodLog>,
 *   oneRM: Record<string, number>,
 *   weights: Record<string, number>,
 *   apiKey: string,
 *   profile: UserProfile
 * }} UserData
 */

const STORAGE_KEY   = 'fittrac_user_data';
const CUSTOM_KEY    = 'fittrac_custom_workouts';
const SECURE_API_KEY = 'fittrac_api_key';

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
  usdaKey: '',          // USDA FoodData Central API key (optional, removes rate limits)
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
    async function load() {
      // Load API key from secure storage
      let apiKey = '';
      try { apiKey = await SecureStore.getItemAsync(SECURE_API_KEY) || ''; } catch {}

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          // Migrate: if old data has apiKey in AsyncStorage, move it to SecureStore
          if (saved.apiKey && !apiKey) {
            try { await SecureStore.setItemAsync(SECURE_API_KEY, saved.apiKey); apiKey = saved.apiKey; } catch {}
            delete saved.apiKey;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
          } else {
            delete saved.apiKey; // never keep it in AsyncStorage
          }
          setUserDataRaw(prev => deepMerge(prev, { ...pruneData(saved), apiKey }));
        } else if (apiKey) {
          setUserDataRaw(prev => ({ ...prev, apiKey }));
        }
      } catch {}

      setLoaded(true);
    }
    load();
  }, []);

  // Debounced save — write 400ms after last update
  // apiKey is always routed to SecureStore, never written to AsyncStorage
  function setUserData(updater) {
    setUserDataRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (next.apiKey !== prev.apiKey) {
        if (next.apiKey) {
          SecureStore.setItemAsync(SECURE_API_KEY, next.apiKey).catch(() => {});
        } else {
          SecureStore.deleteItemAsync(SECURE_API_KEY).catch(() => {});
        }
      }
      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        const { apiKey: _key, ...toStore } = next;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      }, 400);
      return next;
    });
  }

  // Immediate save (for critical writes like program finish)
  async function saveNow(data) {
    clearTimeout(saveTimeout.current);
    const { apiKey: _key, ...toStore } = data;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }

  // ── Food helpers ─────────────────────────────────────
  /** @returns {string} today's date as YYYY-MM-DD */
  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  /** @returns {DayFoodLog} */
  function getTodayFoodLog() {
    const today = getTodayKey();
    const log = userData.foodLog?.[today];
    return log || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  }

  /**
   * @param {string} meal - 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'
   * @param {FoodEntry} entry
   */
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

  /**
   * @param {string} meal - 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'
   * @param {number} idx - index within the meal array
   */
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
  /** @param {number} weight - weight in lbs */
  function logWeight(weight) {
    setUserData(prev => ({
      ...prev,
      weight,
      weightHistory: [...(prev.weightHistory || []), { date: new Date().toISOString(), weight }],
    }));
  }

  // ── Workout helpers ───────────────────────────────────
  /**
   * @param {string} programId
   * @param {string} dayName
   * @param {number} durationMins
   * @param {Array<{name:string, sets:number, reps:string|number, weight:number|null}>} [exercises]
   */
  function finishWorkout(programId, dayName, durationMins, exercises) {
    setUserData(prev => {
      const history = [...(prev.workoutHistory || []), {
        date: new Date().toISOString(),
        program: programId,
        day: dayName,
        duration: durationMins,
        completed: true,
        exercises: exercises || [],
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
  /** @returns {number} consecutive workout days ending today or yesterday */
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

  /** @returns {number|null} average daily calories over the last 7 logged days, or null if no data */
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

  /** @returns {number|null} weight change (lbs) from first to latest entry, or null if fewer than 2 entries */
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

/**
 * @returns {{
 *   userData: UserData,
 *   setUserData: (updater: UserData | ((prev: UserData) => UserData)) => void,
 *   saveNow: (data: UserData) => Promise<void>,
 *   loaded: boolean,
 *   getTodayKey: () => string,
 *   getTodayFoodLog: () => DayFoodLog,
 *   addFoodEntry: (meal: string, entry: FoodEntry) => void,
 *   removeFoodEntry: (meal: string, idx: number) => void,
 *   clearTodayFood: () => void,
 *   logWeight: (weight: number) => void,
 *   finishWorkout: (programId: string, dayName: string, durationMins: number) => void,
 *   loadCustomWorkouts: () => Promise<any[]>,
 *   saveCustomWorkouts: (workouts: any[]) => Promise<void>,
 *   calcStreak: () => number,
 *   calc7DayCalAvg: () => number|null,
 *   calcWeightDelta: () => number|null,
 * }}
 */
export function useApp() {
  return useContext(AppContext);
}

// Prune large arrays and stale foodLog entries on load to keep AsyncStorage lean
function pruneData(data) {
  const out = { ...data };

  // Keep only the last 90 days of food logs
  if (out.foodLog && typeof out.foodLog === 'object') {
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    const pruned = {};
    for (const [date, log] of Object.entries(out.foodLog)) {
      if (date >= cutoff) pruned[date] = log;
    }
    out.foodLog = pruned;
  }

  // Cap workout history at 500 entries (keep most recent)
  if (Array.isArray(out.workoutHistory) && out.workoutHistory.length > 500) {
    out.workoutHistory = out.workoutHistory.slice(-500);
  }

  // Cap weight history at 365 entries (keep most recent)
  if (Array.isArray(out.weightHistory) && out.weightHistory.length > 365) {
    out.weightHistory = out.weightHistory.slice(-365);
  }

  // Cap chat history at 200 messages locally
  if (Array.isArray(out.chatHistory) && out.chatHistory.length > 200) {
    out.chatHistory = out.chatHistory.slice(-200);
  }

  return out;
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
