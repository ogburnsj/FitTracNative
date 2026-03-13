import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function LogWeightScreen({ navigation }) {
  const { userData, logWeight } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [weight, setWeight] = useState(
    userData.weight ? String(userData.weight) : ''
  );

  const wh = [...(userData.weightHistory || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  function handleLog() {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 50 || w > 700) {
      Alert.alert('Invalid weight', 'Enter a weight between 50 and 700 lbs.');
      return;
    }
    logWeight(w);
    Alert.alert('Logged!', `Weight ${w} lbs recorded.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: theme.bgPage }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPri} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Log Weight</Text>
        <View style={{ width:40 }} />
      </View>

      <ScrollView style={{ flex:1, padding:16 }} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.label}>CURRENT WEIGHT (LBS)</Text>
          <TextInput
            style={[s.bigInput, { marginTop:8 }]}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={userData.weight ? String(userData.weight) : "0.0"}
            placeholderTextColor={theme.textSec}
            autoFocus
          />
          <TouchableOpacity style={[s.btn, { marginTop:12 }]} onPress={handleLog}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight:6 }} />
            <Text style={s.btnText}>Log Weight</Text>
          </TouchableOpacity>
        </View>

        {wh.length > 0 && (
          <View style={s.card}>
            <Text style={[s.label, { marginBottom:10 }]}>RECENT ENTRIES</Text>
            {wh.map((e, i) => (
              <View key={i} style={[s.histRow, i === wh.length - 1 && { borderBottomWidth:0 }]}>
                <Text style={s.histDate}>{fmtDate(e.date)}</Text>
                <Text style={[s.histWeight, { color: theme.accent }]}>{e.weight} lbs</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:20, borderBottomWidth:1, borderBottomColor: theme.border, backgroundColor: theme.bgCard },
    backBtn:     { width:40 },
    headerTitle: { fontSize:20, fontWeight:'900', color: theme.textPri },
    card:        { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth:1, borderColor: theme.border, padding:16, marginBottom:12, ...(theme.shadow || {}) },
    label:       { fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600' },
    bigInput:    { fontSize:36, fontWeight:'900', color: theme.textPri, backgroundColor: theme.bgInput, borderRadius:10, paddingHorizontal:16, paddingVertical:12, textAlign:'center', borderWidth:1, borderColor: theme.border },
    btn:         { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor: theme.accent, borderRadius:10, padding:14 },
    btnText:     { color:'#fff', fontWeight:'800', fontSize:15 },
    histRow:     { flexDirection:'row', justifyContent:'space-between', paddingVertical:10, borderBottomWidth:1, borderBottomColor: theme.border },
    histDate:    { fontSize:14, color: theme.textSec },
    histWeight:  { fontSize:14, fontWeight:'700' },
  });
}
