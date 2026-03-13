import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, FlatList, Modal, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { FOOD_DB } from '../data/foodDatabase';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const CATS  = ['All', 'My Recipes', 'Protein', 'Carbs'];

const USDA_KEY = 'DEMO_KEY'; // fallback public key

export default function NutritionScreen({ navigation }) {
  const { userData, getTodayFoodLog, addFoodEntry, removeFoodEntry, clearTodayFood } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [, forceUpdate] = useState(0);
  useFocusEffect(useCallback(() => { forceUpdate(n => n + 1); }, []));

  // Panel state
  const [panel, setPanel]   = useState(null); // null | 'search' | 'manual'
  const [selMeal, setSelMeal] = useState('Breakfast');

  // Search state
  const [query, setQuery]   = useState('');
  const [cat, setCat]       = useState('All');
  const [results, setResults] = useState([]);
  const [usdaLoading, setUsdaLoading] = useState(false);
  const [selFood, setSelFood] = useState(null);
  const [servings, setServings] = useState('1');
  const searchTimeout = useRef(null);

  // Manual entry state
  const [manual, setManual] = useState({ name:'', cal:'', pro:'', carb:'', fat:'', fib:'', sod:'' });

  const dayLog = getTodayFoodLog();

  // ── Macro totals ──────────────────────────────────────────────────
  const allEntries = MEALS.flatMap(m => dayLog[m] || []);
  const totals = allEntries.reduce((acc, e) => ({
    cal:  acc.cal  + (e.cal  || 0),
    pro:  acc.pro  + (e.pro  || 0),
    carb: acc.carb + (e.carb || 0),
    fat:  acc.fat  + (e.fat  || 0),
    fib:  acc.fib  + (e.fib  || 0),
    sod:  acc.sod  + (e.sod  || 0),
  }), { cal:0, pro:0, carb:0, fat:0, fib:0, sod:0 });

  const target = userData.targetCalories || 2000;
  const calPct = Math.min(1, totals.cal / target);
  const calBarColor = calPct >= 1 ? '#f87171' : calPct >= 0.85 ? '#fbbf24' : theme.accent;

  // ── Local search + USDA fallback ─────────────────────────────────
  function runSearch(q, c) {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) { setResults([]); return; }

    let db = FOOD_DB;
    if (c === 'My Recipes') db = FOOD_DB.filter(f => f.cat === 'My Recipes');
    else if (c === 'Protein') db = FOOD_DB.filter(f => f.cat === 'Protein');
    else if (c === 'Carbs')   db = FOOD_DB.filter(f => f.cat === 'Carbs');

    const local = db.filter(f => f.n.toLowerCase().includes(trimmed));
    setResults(local);

    if (local.length < 3 && c === 'All') {
      fetchUSDA(trimmed, local);
    }
  }

  async function fetchUSDA(q, existing) {
    setUsdaLoading(true);
    try {
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=8&api_key=${USDA_KEY}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const usda = (data.foods || []).map(f => {
        const get = (n) => (f.foodNutrients || []).find(x => x.nutrientName === n)?.value || 0;
        return {
          n:    f.description,
          cal:  Math.round(get('Energy')),
          pro:  parseFloat(get('Protein').toFixed(1)),
          carb: parseFloat(get('Carbohydrate, by difference').toFixed(1)),
          fat:  parseFloat(get('Total lipid (fat)').toFixed(1)),
          fib:  parseFloat((get('Fiber, total dietary') || 0).toFixed(1)),
          sod:  Math.round(get('Sodium, Na') || 0),
          srv:  '100g',
          _usda: true,
        };
      });
      setResults([...existing, ...usda]);
    } catch {
      // silently fail — local results still shown
    } finally {
      setUsdaLoading(false);
    }
  }

  function onQueryChange(text) {
    setQuery(text);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => runSearch(text, cat), 300);
  }

  function onCatChange(c) {
    setCat(c);
    runSearch(query, c);
  }

  // ── Add food ─────────────────────────────────────────────────────
  function confirmAdd() {
    if (!selFood) return;
    const mult = parseFloat(servings) || 1;
    const entry = {
      n:    selFood.n,
      cal:  Math.round((selFood.cal || 0) * mult),
      pro:  parseFloat(((selFood.pro || 0) * mult).toFixed(1)),
      carb: parseFloat(((selFood.carb || 0) * mult).toFixed(1)),
      fat:  parseFloat(((selFood.fat || 0) * mult).toFixed(1)),
      fib:  parseFloat(((selFood.fib || 0) * mult).toFixed(1)),
      sod:  Math.round((selFood.sod || 0) * mult),
      srv:  selFood.srv,
      servings: mult,
    };
    addFoodEntry(selMeal, entry);
    setSelFood(null);
    setServings('1');
    setQuery('');
    setResults([]);
    setPanel(null);
  }

  function confirmManual() {
    const name = manual.name.trim();
    if (!name) { Alert.alert('Name required'); return; }
    const entry = {
      n:    name,
      cal:  parseInt(manual.cal)  || 0,
      pro:  parseFloat(manual.pro)  || 0,
      carb: parseFloat(manual.carb) || 0,
      fat:  parseFloat(manual.fat)  || 0,
      fib:  parseFloat(manual.fib)  || 0,
      sod:  parseInt(manual.sod)  || 0,
      srv:  '1 serving',
      servings: 1,
    };
    addFoodEntry(selMeal, entry);
    setManual({ name:'', cal:'', pro:'', carb:'', fat:'', fib:'', sod:'' });
    setPanel(null);
  }

  function openPanel(meal, type) {
    setSelMeal(meal);
    setQuery('');
    setCat('All');
    setResults([]);
    setSelFood(null);
    setServings('1');
    setPanel(type);
  }

  function handleClearDay() {
    Alert.alert('Clear Today', 'Remove all food entries for today?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearTodayFood },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgPage }}>
      <ScrollView style={s.page} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Daily summary card */}
        <View style={s.card}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <Text style={s.label}>TODAY'S CALORIES</Text>
            <TouchableOpacity onPress={handleClearDay}>
              <Ionicons name="trash-outline" size={18} color={theme.textSec} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginBottom:8 }}>
            <Text style={[s.bigNum, { color: calPct >= 1 ? '#f87171' : theme.textPri }]}>{totals.cal}</Text>
            <Text style={s.bodySec}>/ {target} cal</Text>
          </View>
          <View style={s.progTrack}>
            <View style={[s.progFill, { width:`${calPct * 100}%`, backgroundColor: calBarColor }]} />
          </View>

          {/* Macro row */}
          <View style={s.macroRow}>
            <MacroCell label="Protein"  value={totals.pro}  unit="g" color="#60a5fa" theme={theme} />
            <MacroCell label="Carbs"    value={totals.carb} unit="g" color="#fbbf24" theme={theme} />
            <MacroCell label="Fat"      value={totals.fat}  unit="g" color="#f87171" theme={theme} />
            <MacroCell label="Fiber"    value={totals.fib}  unit="g" color={theme.accent} theme={theme} />
            <MacroCell label="Sodium"   value={totals.sod}  unit="mg" color={theme.textSec} theme={theme} />
          </View>
        </View>

        {/* Meal sections */}
        {MEALS.map(meal => (
          <MealSection
            key={meal}
            meal={meal}
            entries={dayLog[meal] || []}
            onAdd={(type) => openPanel(meal, type)}
            onRemove={(idx) => removeFoodEntry(meal, idx)}
            theme={theme}
            s={s}
          />
        ))}
      </ScrollView>

      {/* Search panel */}
      <Modal visible={panel === 'search'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPanel(null)}>
        <KeyboardAvoidingView style={{ flex:1, backgroundColor: theme.bgPage }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.panelHeader}>
            <Text style={s.panelTitle}>Add to {selMeal}</Text>
            <TouchableOpacity onPress={() => setPanel(null)}>
              <Ionicons name="close" size={24} color={theme.textPri} />
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={s.searchRow}>
            <Ionicons name="search" size={16} color={theme.textSec} style={{ marginRight:6 }} />
            <TextInput
              style={[s.searchInput, { flex:1 }]}
              placeholder="Search foods..."
              placeholderTextColor={theme.textSec}
              value={query}
              onChangeText={onQueryChange}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSelFood(null); }}>
                <Ionicons name="close-circle" size={18} color={theme.textSec} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal:16, paddingBottom:8 }}>
            <View style={{ flexDirection:'row', gap:8 }}>
              {CATS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.chip, cat === c && s.chipActive]}
                  onPress={() => onCatChange(c)}
                >
                  <Text style={[s.chipText, cat === c && { color:'#fff' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Food selected → servings input */}
          {selFood && (
            <View style={[s.card, { marginHorizontal:16, marginBottom:8 }]}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                <Text style={[s.bodyPri, { marginBottom:4, flex:1, marginRight:8 }]}>{selFood.n}</Text>
                <TouchableOpacity onPress={() => { setSelFood(null); setServings('1'); }}>
                  <Ionicons name="close" size={20} color={theme.textSec} />
                </TouchableOpacity>
              </View>
              <Text style={s.bodySec}>{selFood.srv} • {selFood.cal} cal</Text>
              <View style={{ flexDirection:'row', alignItems:'center', marginTop:10, gap:12 }}>
                <Text style={s.bodySec}>Servings:</Text>
                <TextInput
                  style={[s.searchInput, { width:70, textAlign:'center' }]}
                  keyboardType="decimal-pad"
                  value={servings}
                  onChangeText={setServings}
                />
                <Text style={s.bodySec}>
                  = {Math.round((selFood.cal || 0) * (parseFloat(servings) || 1))} cal
                </Text>
              </View>
              <TouchableOpacity style={[s.btn, { marginTop:10 }]} onPress={confirmAdd}>
                <Text style={s.btnText}>Add to {selMeal}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Results list */}
          {usdaLoading && (
            <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:6 }}>
              <ActivityIndicator size="small" color={theme.accent} />
              <Text style={[s.bodySec, { marginLeft:8 }]}>Searching USDA database…</Text>
            </View>
          )}

          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.foodRow, selFood === item && { backgroundColor: theme.accentDim }]}
                onPress={() => { setSelFood(item); setServings('1'); }}
              >
                <View style={{ flex:1 }}>
                  <Text style={s.foodName} numberOfLines={1}>{item.n}</Text>
                  <Text style={s.foodSub}>{item.srv} • {item.cal} cal • {item.pro}g pro{item._usda ? ' · USDA' : ''}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              query.length > 0 && !usdaLoading ? (
                <Text style={[s.bodySec, { textAlign:'center', padding:24 }]}>No results found</Text>
              ) : null
            }
          />

          {/* Manual entry shortcut */}
          <TouchableOpacity
            style={[s.btn, { margin:16, backgroundColor: theme.bgCard, borderWidth:1, borderColor: theme.border }]}
            onPress={() => setPanel('manual')}
          >
            <Text style={[s.btnText, { color: theme.textPri }]}>Enter Manually</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Manual entry panel */}
      <Modal visible={panel === 'manual'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPanel(null)}>
        <KeyboardAvoidingView style={{ flex:1, backgroundColor: theme.bgPage }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.panelHeader}>
            <Text style={s.panelTitle}>Manual Entry — {selMeal}</Text>
            <TouchableOpacity onPress={() => setPanel(null)}>
              <Ionicons name="close" size={24} color={theme.textPri} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding:16 }} keyboardShouldPersistTaps="handled">
            <ManualField label="Name *" value={manual.name} onChangeText={t => setManual(p => ({...p, name:t}))} theme={theme} s={s} />
            <View style={{ flexDirection:'row', gap:12 }}>
              <View style={{ flex:1 }}>
                <ManualField label="Calories" value={manual.cal} onChangeText={t => setManual(p => ({...p, cal:t}))} theme={theme} s={s} kb="numeric" />
              </View>
              <View style={{ flex:1 }}>
                <ManualField label="Protein (g)" value={manual.pro} onChangeText={t => setManual(p => ({...p, pro:t}))} theme={theme} s={s} kb="decimal-pad" />
              </View>
            </View>
            <View style={{ flexDirection:'row', gap:12 }}>
              <View style={{ flex:1 }}>
                <ManualField label="Carbs (g)" value={manual.carb} onChangeText={t => setManual(p => ({...p, carb:t}))} theme={theme} s={s} kb="decimal-pad" />
              </View>
              <View style={{ flex:1 }}>
                <ManualField label="Fat (g)" value={manual.fat} onChangeText={t => setManual(p => ({...p, fat:t}))} theme={theme} s={s} kb="decimal-pad" />
              </View>
            </View>
            <View style={{ flexDirection:'row', gap:12 }}>
              <View style={{ flex:1 }}>
                <ManualField label="Fiber (g)" value={manual.fib} onChangeText={t => setManual(p => ({...p, fib:t}))} theme={theme} s={s} kb="decimal-pad" />
              </View>
              <View style={{ flex:1 }}>
                <ManualField label="Sodium (mg)" value={manual.sod} onChangeText={t => setManual(p => ({...p, sod:t}))} theme={theme} s={s} kb="numeric" />
              </View>
            </View>
            <TouchableOpacity style={[s.btn, { marginTop:12 }]} onPress={confirmManual}>
              <Text style={s.btnText}>Add to {selMeal}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function MealSection({ meal, entries, onAdd, onRemove, theme, s }) {
  const mealCal = entries.reduce((a, e) => a + (e.cal || 0), 0);
  return (
    <View style={[s.card, { marginBottom:10 }]}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Text style={s.mealTitle}>{meal}</Text>
          {mealCal > 0 && <Text style={s.mealCal}>{mealCal} cal</Text>}
        </View>
        <View style={{ flexDirection:'row', gap:10 }}>
          <TouchableOpacity onPress={() => onAdd('search')}>
            <Ionicons name="search" size={20} color={theme.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onAdd('manual')}>
            <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {entries.length === 0 ? (
        <Text style={[s.bodySec, { fontSize:12, fontStyle:'italic' }]}>Nothing logged yet</Text>
      ) : (
        entries.map((e, i) => (
          <View key={i} style={s.entryRow}>
            <View style={{ flex:1 }}>
              <Text style={s.entryName} numberOfLines={1}>{e.n}</Text>
              <Text style={s.entrySub}>
                {e.servings && e.servings !== 1 ? `×${e.servings} • ` : ''}{e.srv} • {e.pro}g pro • {e.carb}g carb • {e.fat}g fat
              </Text>
            </View>
            <Text style={[s.entryCalText, { marginRight:10 }]}>{e.cal} cal</Text>
            <TouchableOpacity onPress={() => onRemove(i)}>
              <Ionicons name="trash-outline" size={16} color="#f87171" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

function MacroCell({ label, value, unit, color, theme }) {
  return (
    <View style={{ alignItems:'center', flex:1 }}>
      <Text style={{ fontSize:14, fontWeight:'700', color }}>{Math.round(value)}</Text>
      <Text style={{ fontSize:9, color: theme.textSec, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</Text>
      <Text style={{ fontSize:9, color: theme.textMuted }}>{unit}</Text>
    </View>
  );
}

function ManualField({ label, value, onChangeText, theme, s, kb = 'default' }) {
  return (
    <View style={{ marginBottom:12 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={kb}
        placeholderTextColor={theme.textSec}
        placeholder="0"
      />
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    page:        { flex:1, backgroundColor: theme.bgPage, padding:16 },
    card:        { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth:1, borderColor: theme.border, padding:16, marginBottom:12, ...(theme.shadow || {}) },
    label:       { fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600' },
    bigNum:      { fontSize:40, fontWeight:'900', color: theme.textPri },
    bodySec:     { fontSize:13, color: theme.textSec },
    bodyPri:     { fontSize:14, color: theme.textPri, fontWeight:'600' },
    progTrack:   { height:6, backgroundColor: theme.progTrack, borderRadius:3, overflow:'hidden', marginBottom:12 },
    progFill:    { height:6, borderRadius:3 },
    macroRow:    { flexDirection:'row', justifyContent:'space-between' },

    panelHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderBottomWidth:1, borderBottomColor: theme.border },
    panelTitle:  { fontSize:18, fontWeight:'800', color: theme.textPri },

    searchRow:   { flexDirection:'row', alignItems:'center', backgroundColor: theme.bgInput, borderRadius:10, marginHorizontal:16, marginVertical:10, paddingHorizontal:12, paddingVertical:8 },
    searchInput: { backgroundColor: theme.bgInput, borderRadius:8, paddingHorizontal:10, paddingVertical:8, color: theme.textPri, fontSize:14 },

    chip:        { paddingHorizontal:14, paddingVertical:6, borderRadius:20, backgroundColor: theme.bgCard, borderWidth:1, borderColor: theme.border },
    chipActive:  { backgroundColor: theme.accent, borderColor: theme.accent },
    chipText:    { fontSize:13, color: theme.textSec, fontWeight:'600' },

    foodRow:     { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor: theme.border },
    foodName:    { fontSize:14, fontWeight:'600', color: theme.textPri, marginBottom:2 },
    foodSub:     { fontSize:12, color: theme.textSec },

    mealTitle:   { fontSize:15, fontWeight:'800', color: theme.textPri },
    mealCal:     { fontSize:12, color: theme.textSec },
    entryRow:    { flexDirection:'row', alignItems:'center', paddingVertical:8, borderBottomWidth:1, borderBottomColor: theme.border },
    entryName:   { fontSize:13, fontWeight:'600', color: theme.textPri, marginBottom:2 },
    entrySub:    { fontSize:11, color: theme.textSec },
    entryCalText:{ fontSize:13, fontWeight:'700', color: theme.textPri },

    btn:         { backgroundColor: theme.accent, borderRadius:10, padding:14, alignItems:'center' },
    btnText:     { color:'#fff', fontWeight:'800', fontSize:15 },

    fieldLabel:  { fontSize:12, color: theme.textSec, marginBottom:4, fontWeight:'600' },
    input:       { backgroundColor: theme.bgInput, borderRadius:8, paddingHorizontal:12, paddingVertical:10, color: theme.textPri, fontSize:14, borderWidth:1, borderColor: theme.border },
  });
}
