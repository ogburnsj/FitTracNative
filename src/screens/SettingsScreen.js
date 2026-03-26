import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen({ navigation }) {
  const { userData, setUserData } = useApp();
  const { theme, setThemeName } = useTheme();
  const s = makeStyles(theme);

  const [apiKey, setApiKey] = useState(userData.apiKey || '');
  const [showKey, setShowKey] = useState(false);

  function saveApiKey() {
    setUserData({ apiKey: apiKey.trim() });
    Alert.alert('Saved', 'API key saved.');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgPage }}>
    <ScrollView style={s.page} contentContainerStyle={{ paddingBottom:60 }} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPri} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width:40 }} />
      </View>

      {/* Theme */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>APPEARANCE</Text>
        <View style={s.card}>
          {['bold', 'minimal'].map(name => (
            <TouchableOpacity
              key={name}
              style={[s.themeRow, name !== 'minimal' && { borderBottomWidth:1, borderBottomColor: theme.border }]}
              onPress={() => setThemeName(name)}
            >
              <View style={s.themePreview(name)} />
              <Text style={s.themeLabel}>{name === 'bold' ? 'Bold (Dark)' : 'Minimal (Light)'}</Text>
              {theme.name === name && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* AI Coach API Key */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>AI COACH</Text>
        <View style={s.card}>
          <Text style={[s.bodySec, { marginBottom:8 }]}>
            Enter your Anthropic API key to use the AI Coach feature.
          </Text>
          <View style={s.keyRow}>
            <TextInput
              style={[s.input, { flex:1 }]}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showKey}
              placeholder="sk-ant-..."
              placeholderTextColor={theme.textSec}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowKey(v => !v)}>
              <Ionicons name={showKey ? 'eye-off' : 'eye'} size={20} color={theme.textSec} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[s.btn, { marginTop:10 }]} onPress={saveApiKey}>
            <Text style={s.btnText}>Save API Key</Text>
          </TouchableOpacity>
          {userData.apiKey && (
            <TouchableOpacity
              style={{ marginTop:10, alignItems:'center' }}
              onPress={() => { setUserData({ apiKey:'' }); setApiKey(''); }}
            >
              <Text style={{ color:'#f87171', fontSize:13 }}>Remove API Key</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* TDEE / Goals */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>GOALS & NUTRITION</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.navRow}
            onPress={() => navigation.navigate('TDEE')}
          >
            <Ionicons name="calculator-outline" size={20} color={theme.accent} />
            <Text style={s.navRowText}>TDEE Calculator & Goals</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSec} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>DATA</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={[s.navRow, { borderBottomWidth:0 }]}
            onPress={() => {
              Alert.alert(
                'Clear All Data',
                'This will permanently delete all your fitness data. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Everything', style: 'destructive',
                    onPress: () => {
                      setUserData({
                        calories: 0, workoutsCompleted: 0, weight: 0,
                        weightHistory: [], workoutHistory: [], chatHistory: [],
                        foodLog: {}, currentProgram: null, lastWorkout: null,
                      });
                      Alert.alert('Done', 'All data cleared.');
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#f87171" />
            <Text style={[s.navRowText, { color:'#f87171' }]}>Clear All Data</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSec} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[s.bodySec, { textAlign:'center', marginTop:8, fontSize:11 }]}>FitTrac v1.0</Text>
    </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    page:        { flex:1, backgroundColor: theme.bgPage },
    header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:8 },
    backBtn:     { width:40 },
    headerTitle: { fontSize:20, fontWeight:'900', color: theme.textPri },
    section:     { paddingHorizontal:16, marginBottom:16 },
    sectionTitle:{ fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600', marginBottom:8 },
    card:        { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth:1, borderColor: theme.border, overflow:'hidden', ...(theme.shadow || {}) },
    bodySec:     { fontSize:13, color: theme.textSec, paddingHorizontal:16, paddingTop:12 },

    themeRow:    { flexDirection:'row', alignItems:'center', padding:16, gap:12 },
    themePreview:(name) => ({
      width:24, height:24, borderRadius:12,
      backgroundColor: name === 'bold' ? '#0d0d11' : '#f7f7f5',
      borderWidth:2, borderColor: name === 'bold' ? '#2d6a4f' : '#ccc',
    }),
    themeLabel:  { flex:1, fontSize:15, fontWeight:'600', color: theme.textPri },

    keyRow:      { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingTop:0, gap:8 },
    input:       { backgroundColor: theme.bgInput, borderRadius:8, paddingHorizontal:12, paddingVertical:10, color: theme.textPri, fontSize:13, borderWidth:1, borderColor: theme.border, fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace' },
    eyeBtn:      { padding:10 },

    btn:         { backgroundColor: theme.accent, borderRadius:10, padding:12, alignItems:'center', marginHorizontal:16, marginBottom:12 },
    btnText:     { color:'#fff', fontWeight:'800', fontSize:14 },

    navRow:      { flexDirection:'row', alignItems:'center', padding:16, gap:12, borderBottomWidth:1, borderBottomColor: theme.border },
    navRowText:  { flex:1, fontSize:15, fontWeight:'600', color: theme.textPri },
  });
}
