import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const MODEL    = 'claude-sonnet-4-20250514';
const API_URL  = 'https://api.anthropic.com/v1/messages';
const MAX_HIST = 40; // max messages kept in history

const QUICK_PROMPTS = [
  "What should I eat post-workout?",
  "How do I improve my squat form?",
  "Help me plan a high-protein meal",
  "How many calories should I eat to lose weight?",
  "What's the best recovery strategy?",
  "Explain progressive overload",
];

function buildSystemPrompt(userData) {
  const p = userData.profile || {};
  const parts = ['You are a knowledgeable, encouraging fitness and nutrition coach.'];
  if (p.age)    parts.push(`User age: ${p.age}`);
  if (p.sex)    parts.push(`Sex: ${p.sex}`);
  if (p.weight) parts.push(`Current weight: ${p.weight} lbs`);
  if (p.tdee)   parts.push(`Estimated TDEE: ${p.tdee} cal/day`);
  if (userData.targetCalories) parts.push(`Calorie target: ${userData.targetCalories} cal/day`);
  if (p.goal)   parts.push(`Goal: ${p.goal}`);
  if (p.activityLevel) parts.push(`Activity level: ${p.activityLevel}`);
  const streak = (userData.workoutHistory || []).length;
  if (streak) parts.push(`Workouts completed: ${streak}`);

  const oneRM = userData.oneRM || {};
  const lifts = Object.entries(oneRM).filter(([, v]) => v > 0).map(([k, v]) => `${k}: ${v} lbs`);
  if (lifts.length) parts.push(`1RM lifts — ${lifts.join(', ')}`);

  parts.push('Give concise, actionable advice. Be supportive and motivating. Format responses with clear sections when helpful.');
  return parts.join('. ');
}

export default function CoachScreen() {
  const { userData, setUserData } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const scrollRef = useRef(null);

  const history = userData.chatHistory || [];
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  }, []));

  const apiKey = userData.apiKey || '';

  async function sendMessage(text) {
    const msg = text.trim();
    if (!msg) return;
    if (!apiKey) {
      Alert.alert(
        'API Key Required',
        'Go to Settings → AI Coach API Key and enter your Anthropic API key to use the coach.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newHistory = [...history, { role:'user', content: msg }];
    setUserData({ chatHistory: newHistory });
    setInput('');
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Keep only last MAX_HIST messages for API call
    const apiMessages = newHistory.slice(-MAX_HIST).map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: buildSystemPrompt(userData),
          messages: apiMessages,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const reply = data.content?.[0]?.text || '(no response)';
      const updated = [...newHistory, { role:'assistant', content: reply }];
      setUserData({ chatHistory: updated });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (e) {
      Alert.alert('Coach Error', e.message || 'Failed to reach the AI coach.');
      // Remove the user message we optimistically added
      setUserData({ chatHistory: history });
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    Alert.alert('Clear Chat', 'Remove all coach conversation history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setUserData({ chatHistory: [] }) },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex:1, backgroundColor: theme.bgPage }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>AI Coach</Text>
          <Text style={s.headerSub}>Powered by Claude</Text>
        </View>
        <TouchableOpacity onPress={clearHistory}>
          <Ionicons name="trash-outline" size={20} color={theme.textSec} />
        </TouchableOpacity>
      </View>

      {/* No API key warning */}
      {!apiKey && (
        <View style={[s.warnBanner]}>
          <Ionicons name="warning-outline" size={16} color="#fbbf24" />
          <Text style={s.warnText}>Add your Anthropic API key in Settings to use the coach</Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex:1 }}
        contentContainerStyle={{ padding:16, paddingBottom:8 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {history.length === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="hardware-chip-outline" size={48} color={theme.textMuted} />
            <Text style={[s.bodySec, { marginTop:12, textAlign:'center', lineHeight:20 }]}>
              Ask me anything about fitness, nutrition, or training. I have context on your stats and goals.
            </Text>
          </View>
        )}

        {history.map((msg, i) => (
          <View
            key={i}
            style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleAssistant]}
          >
            {msg.role === 'assistant' && (
              <View style={s.assistantLabel}>
                <Ionicons name="hardware-chip" size={12} color={theme.accent} />
                <Text style={[s.label, { marginLeft:4 }]}>COACH</Text>
              </View>
            )}
            <Text style={[s.bubbleText, msg.role === 'user' && { color:'#fff' }]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[s.bubble, s.bubbleAssistant]}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[s.bodySec, { marginLeft:8, fontSize:12 }]}>Thinking…</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick prompts — shown when no history */}
      {history.length === 0 && !loading && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight:48 }} contentContainerStyle={{ paddingHorizontal:16, gap:8, flexDirection:'row', alignItems:'center' }}>
          {QUICK_PROMPTS.map((p, i) => (
            <TouchableOpacity key={i} style={s.quickChip} onPress={() => sendMessage(p)}>
              <Text style={s.quickChipText} numberOfLines={1}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input row */}
      <View style={s.inputRow}>
        <TextInput
          style={s.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your coach…"
          placeholderTextColor={theme.textSec}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && { opacity:0.4 }]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    header:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderBottomWidth:1, borderBottomColor: theme.border, backgroundColor: theme.bgCard },
    headerTitle:{ fontSize:18, fontWeight:'800', color: theme.textPri },
    headerSub:  { fontSize:11, color: theme.textSec },

    warnBanner: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(251,191,36,0.1)', borderBottomWidth:1, borderBottomColor:'rgba(251,191,36,0.3)', paddingHorizontal:16, paddingVertical:10 },
    warnText:   { fontSize:12, color:'#fbbf24', flex:1 },

    emptyState: { alignItems:'center', paddingTop:60, paddingHorizontal:40 },

    bubble:          { borderRadius:14, padding:12, marginBottom:10, maxWidth:'85%' },
    bubbleUser:      { alignSelf:'flex-end', backgroundColor: theme.accent },
    bubbleAssistant: { alignSelf:'flex-start', backgroundColor: theme.bgCard, borderWidth:1, borderColor: theme.border, flexDirection:'column' },
    assistantLabel:  { flexDirection:'row', alignItems:'center', marginBottom:4 },
    bubbleText:      { fontSize:14, color: theme.textPri, lineHeight:20 },

    inputRow:   { flexDirection:'row', alignItems:'flex-end', padding:12, borderTopWidth:1, borderTopColor: theme.border, backgroundColor: theme.bgCard, gap:8 },
    textInput:  { flex:1, backgroundColor: theme.bgInput, borderRadius:10, paddingHorizontal:12, paddingVertical:10, color: theme.textPri, fontSize:14, maxHeight:100, borderWidth:1, borderColor: theme.border },
    sendBtn:    { backgroundColor: theme.accent, borderRadius:10, padding:10, alignItems:'center', justifyContent:'center' },

    quickChip:     { backgroundColor: theme.bgCard, borderRadius:16, paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor: theme.border },
    quickChipText: { fontSize:12, color: theme.textSec, fontWeight:'600' },

    label:   { fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600' },
    bodySec: { fontSize:13, color: theme.textSec },
  });
}
