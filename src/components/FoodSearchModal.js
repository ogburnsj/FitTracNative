import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, Modal, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FOOD_DB } from '../data/foodDatabase';

const CATS = ['All', 'My Recipes', 'Protein', 'Carbs'];

export default function FoodSearchModal({ visible, meal, onClose, onAdd, onSwitchToManual, theme, usdaKey }) {
  const s = makeStyles(theme);

  const [query, setQuery]           = useState('');
  const [cat, setCat]               = useState('All');
  const [results, setResults]       = useState([]);
  const [usdaLoading, setUsdaLoading] = useState(false);
  const [selFood, setSelFood]       = useState(null);
  const [servings, setServings]     = useState('1');
  const searchTimeout               = useRef(null);

  function resetState() {
    setQuery(''); setCat('All'); setResults([]);
    setSelFood(null); setServings('1');
  }

  function handleClose() { resetState(); onClose(); }
  function handleSwitchToManual() { resetState(); onSwitchToManual(); }

  function runSearch(q, c) {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) { setResults([]); return; }
    let db = FOOD_DB;
    if (c === 'My Recipes') db = FOOD_DB.filter(f => f.cat === 'My Recipes');
    else if (c === 'Protein') db = FOOD_DB.filter(f => f.cat === 'Protein');
    else if (c === 'Carbs')   db = FOOD_DB.filter(f => f.cat === 'Carbs');
    const local = db.filter(f => f.n.toLowerCase().includes(trimmed));
    setResults(local);
    if (local.length < 3 && c === 'All') fetchUSDA(trimmed, local);
  }

  async function fetchUSDA(q, existing) {
    setUsdaLoading(true);
    try {
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=8&api_key=${usdaKey || 'DEMO_KEY'}`;
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

  function onCatChange(c) { setCat(c); runSearch(query, c); }

  function confirmAdd() {
    if (!selFood) return;
    const mult = parseFloat(servings) || 1;
    onAdd(meal, {
      n:    selFood.n,
      cal:  Math.round((selFood.cal  || 0) * mult),
      pro:  parseFloat(((selFood.pro  || 0) * mult).toFixed(1)),
      carb: parseFloat(((selFood.carb || 0) * mult).toFixed(1)),
      fat:  parseFloat(((selFood.fat  || 0) * mult).toFixed(1)),
      fib:  parseFloat(((selFood.fib  || 0) * mult).toFixed(1)),
      sod:  Math.round((selFood.sod  || 0) * mult),
      srv:  selFood.srv,
      servings: mult,
    });
    handleClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.bgPage }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.panelHeader}>
          <Text style={s.panelTitle}>Add to {meal}</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.textPri} />
          </TouchableOpacity>
        </View>

        <View style={s.searchRow}>
          <Ionicons name="search" size={16} color={theme.textSec} style={{ marginRight: 6 }} />
          <TextInput
            style={[s.searchInput, { flex: 1 }]}
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATS.map(c => (
              <TouchableOpacity key={c} style={[s.chip, cat === c && s.chipActive]} onPress={() => onCatChange(c)}>
                <Text style={[s.chipText, cat === c && { color: '#fff' }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {selFood && (
          <View style={[s.card, { marginHorizontal: 16, marginBottom: 8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={[s.bodyPri, { marginBottom: 4, flex: 1, marginRight: 8 }]}>{selFood.n}</Text>
              <TouchableOpacity onPress={() => { setSelFood(null); setServings('1'); }}>
                <Ionicons name="close" size={20} color={theme.textSec} />
              </TouchableOpacity>
            </View>
            <Text style={s.bodySec}>{selFood.srv} • {selFood.cal} cal</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 }}>
              <Text style={s.bodySec}>Servings:</Text>
              <TextInput
                style={[s.searchInput, { width: 70, textAlign: 'center' }]}
                keyboardType="decimal-pad"
                value={servings}
                onChangeText={setServings}
              />
              <Text style={s.bodySec}>
                = {Math.round((selFood.cal || 0) * (parseFloat(servings) || 1))} cal
              </Text>
            </View>
            <TouchableOpacity style={[s.btn, { marginTop: 10 }]} onPress={confirmAdd}>
              <Text style={s.btnText}>Add to {meal}</Text>
            </TouchableOpacity>
          </View>
        )}

        {usdaLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 }}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[s.bodySec, { marginLeft: 8 }]}>Searching USDA database…</Text>
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
              <View style={{ flex: 1 }}>
                <Text style={s.foodName} numberOfLines={1}>{item.n}</Text>
                <Text style={s.foodSub}>{item.srv} • {item.cal} cal • {item.pro}g pro{item._usda ? ' · USDA' : ''}</Text>
              </View>
              <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query.length > 0 && !usdaLoading
              ? <Text style={[s.bodySec, { textAlign: 'center', padding: 24 }]}>No results found</Text>
              : null
          }
        />

        <TouchableOpacity
          style={[s.btn, { margin: 16, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border }]}
          onPress={handleSwitchToManual}
        >
          <Text style={[s.btnText, { color: theme.textPri }]}>Enter Manually</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card:        { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 12, ...(theme.shadow || {}) },
    bodySec:     { fontSize: 13, color: theme.textSec },
    bodyPri:     { fontSize: 14, color: theme.textPri, fontWeight: '600' },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
    panelTitle:  { fontSize: 18, fontWeight: '800', color: theme.textPri },
    searchRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgInput, borderRadius: 10, marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 12, paddingVertical: 8 },
    searchInput: { backgroundColor: theme.bgInput, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: theme.textPri, fontSize: 14 },
    chip:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border },
    chipActive:  { backgroundColor: theme.accent, borderColor: theme.accent },
    chipText:    { fontSize: 13, color: theme.textSec, fontWeight: '600' },
    foodRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    foodName:    { fontSize: 14, fontWeight: '600', color: theme.textPri, marginBottom: 2 },
    foodSub:     { fontSize: 12, color: theme.textSec },
    btn:         { backgroundColor: theme.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
    btnText:     { color: '#fff', fontWeight: '800', fontSize: 15 },
  });
}
