import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ManualField from './ManualField';

const EMPTY = { name: '', cal: '', pro: '', carb: '', fat: '', fib: '', sod: '' };

export default function ManualEntryModal({ visible, meal, onClose, onAdd, theme }) {
  const s = makeStyles(theme);
  const [manual, setManual] = useState(EMPTY);

  function handleClose() { setManual(EMPTY); onClose(); }

  function confirmManual() {
    const name = manual.name.trim();
    if (!name) { Alert.alert('Name required'); return; }
    onAdd(meal, {
      n:    name,
      cal:  parseInt(manual.cal)    || 0,
      pro:  parseFloat(manual.pro)  || 0,
      carb: parseFloat(manual.carb) || 0,
      fat:  parseFloat(manual.fat)  || 0,
      fib:  parseFloat(manual.fib)  || 0,
      sod:  parseInt(manual.sod)    || 0,
      srv:  '1 serving',
      servings: 1,
    });
    handleClose();
  }

  const set = (key) => (t) => setManual(p => ({ ...p, [key]: t }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.bgPage }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.panelHeader}>
          <Text style={s.panelTitle}>Manual Entry — {meal}</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.textPri} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <ManualField label="Name *"       value={manual.name} onChangeText={set('name')} theme={theme} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><ManualField label="Calories"    value={manual.cal}  onChangeText={set('cal')}  theme={theme} kb="numeric" /></View>
            <View style={{ flex: 1 }}><ManualField label="Protein (g)" value={manual.pro}  onChangeText={set('pro')}  theme={theme} kb="decimal-pad" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><ManualField label="Carbs (g)"   value={manual.carb} onChangeText={set('carb')} theme={theme} kb="decimal-pad" /></View>
            <View style={{ flex: 1 }}><ManualField label="Fat (g)"     value={manual.fat}  onChangeText={set('fat')}  theme={theme} kb="decimal-pad" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><ManualField label="Fiber (g)"   value={manual.fib}  onChangeText={set('fib')}  theme={theme} kb="decimal-pad" /></View>
            <View style={{ flex: 1 }}><ManualField label="Sodium (mg)" value={manual.sod}  onChangeText={set('sod')}  theme={theme} kb="numeric" /></View>
          </View>
          <TouchableOpacity style={[s.btn, { marginTop: 12 }]} onPress={confirmManual}>
            <Text style={s.btnText}>Add to {meal}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
    panelTitle:  { fontSize: 18, fontWeight: '800', color: theme.textPri },
    btn:         { backgroundColor: theme.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
    btnText:     { color: '#fff', fontWeight: '800', fontSize: 15 },
  });
}
