import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

// 5 HR zones based on max HR percentage
const ZONE_DEFS = [
  { zone:1, name:'Recovery',     min:0.50, max:0.60, color:'#60a5fa' },
  { zone:2, name:'Fat Burn',     min:0.60, max:0.70, color:'#34d399' },
  { zone:3, name:'Aerobic',      min:0.70, max:0.80, color:'#fbbf24' },
  { zone:4, name:'Threshold',    min:0.80, max:0.90, color:'#f97316' },
  { zone:5, name:'Max Effort',   min:0.90, max:1.00, color:'#f87171' },
];

const ZONE_GOAL_SECS = 30 * 60; // 30-minute goal
const WALK_DURATION  = 30 * 60; // 12-3-30 timer: 30 minutes

function getZone(bpm, maxHR) {
  const pct = bpm / maxHR;
  return ZONE_DEFS.find(z => pct >= z.min && pct < z.max) || (pct >= 1 ? ZONE_DEFS[4] : null);
}

export default function HRMonitorScreen({ navigation }) {
  const { theme } = useTheme();
  const { userData } = useApp();
  const s = makeStyles(theme);

  const age    = parseInt(userData.profile?.age) || 30;
  const maxHR  = 220 - age;

  const [bpmInput, setBpmInput]   = useState('');
  const [currentBPM, setCurrentBPM] = useState(null);

  // Zone time tracker (seconds per zone)
  const [zoneTimes, setZoneTimes] = useState({ 1:0, 2:0, 3:0, 4:0, 5:0 });
  const [tracking, setTracking]   = useState(false);
  const trackRef = useRef(null);

  // 12-3-30 timer
  const [walkTime, setWalkTime]   = useState(WALK_DURATION);
  const [walkRunning, setWalkRunning] = useState(false);
  const walkRef = useRef(null);

  // Zone tracking ticker
  useEffect(() => {
    if (tracking && currentBPM) {
      trackRef.current = setInterval(() => {
        const zone = getZone(currentBPM, maxHR);
        if (zone) {
          setZoneTimes(prev => ({ ...prev, [zone.zone]: (prev[zone.zone] || 0) + 1 }));
        }
      }, 1000);
    } else {
      clearInterval(trackRef.current);
    }
    return () => clearInterval(trackRef.current);
  }, [tracking, currentBPM, maxHR]);

  // 12-3-30 countdown
  useEffect(() => {
    if (walkRunning) {
      walkRef.current = setInterval(() => {
        setWalkTime(t => {
          if (t <= 1) {
            clearInterval(walkRef.current);
            setWalkRunning(false);
            Alert.alert('12-3-30 Complete!', 'Great job finishing your treadmill workout!');
            return WALK_DURATION;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(walkRef.current);
    }
    return () => clearInterval(walkRef.current);
  }, [walkRunning]);

  function applyBPM() {
    const v = parseInt(bpmInput);
    if (isNaN(v) || v < 40 || v > 220) {
      Alert.alert('Invalid BPM', 'Enter a value between 40 and 220.');
      return;
    }
    setCurrentBPM(v);
  }

  function toggleTracking() {
    if (!currentBPM) { Alert.alert('Enter BPM first'); return; }
    setTracking(t => !t);
  }

  function resetZones() {
    setZoneTimes({ 1:0, 2:0, 3:0, 4:0, 5:0 });
    setTracking(false);
  }

  function fmtTime(secs) {
    const m = Math.floor(secs / 60);
    const s2 = secs % 60;
    return `${String(m).padStart(2,'0')}:${String(s2).padStart(2,'0')}`;
  }

  const activeZone = currentBPM ? getZone(currentBPM, maxHR) : null;
  const totalTracked = Object.values(zoneTimes).reduce((a, b) => a + b, 0);
  const goalZone = zoneTimes[2] || 0; // Zone 2 fat burn is the main goal

  return (
    <ScrollView style={s.page} contentContainerStyle={{ paddingBottom:60 }} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPri} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>HR Monitor</Text>
        <View style={{ width:40 }} />
      </View>

      {/* BT note */}
      <View style={s.infoBox}>
        <Ionicons name="bluetooth" size={14} color={theme.textSec} />
        <Text style={s.infoText}>Bluetooth HR coming in a future update. Enter BPM manually below.</Text>
      </View>

      {/* Age / max HR */}
      <View style={s.card}>
        <Text style={s.label}>YOUR HEART RATE INFO</Text>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:8 }}>
          <Text style={s.bodySec}>Age: {age}</Text>
          <Text style={s.bodySec}>Max HR: {maxHR} bpm</Text>
        </View>
      </View>

      {/* BPM input */}
      <View style={s.card}>
        <Text style={s.label}>CURRENT BPM</Text>
        <View style={{ flexDirection:'row', gap:10, marginTop:8 }}>
          <TextInput
            style={[s.bpmInput, { flex:1 }]}
            value={bpmInput}
            onChangeText={setBpmInput}
            keyboardType="number-pad"
            placeholder="e.g. 140"
            placeholderTextColor={theme.textSec}
          />
          <TouchableOpacity style={s.applyBtn} onPress={applyBPM}>
            <Text style={s.applyBtnText}>Set</Text>
          </TouchableOpacity>
        </View>

        {currentBPM && (
          <View style={[s.bpmDisplay, { borderColor: activeZone?.color || theme.border }]}>
            <Text style={[s.bpmBig, { color: activeZone?.color || theme.textPri }]}>{currentBPM}</Text>
            <Text style={s.bpmUnit}>BPM</Text>
            {activeZone && (
              <View style={[s.zoneBadge, { backgroundColor: activeZone.color + '30', borderColor: activeZone.color }]}>
                <Text style={[s.zoneBadgeText, { color: activeZone.color }]}>
                  Zone {activeZone.zone} — {activeZone.name}
                </Text>
              </View>
            )}
            <Text style={[s.bodySec, { marginTop:4, fontSize:12 }]}>
              {Math.round((currentBPM / maxHR) * 100)}% of max HR
            </Text>
          </View>
        )}
      </View>

      {/* Zone ranges */}
      <View style={s.card}>
        <Text style={[s.label, { marginBottom:10 }]}>HR ZONES</Text>
        {ZONE_DEFS.map(z => {
          const lo = Math.round(z.min * maxHR);
          const hi = Math.round(z.max * maxHR);
          const isActive = activeZone?.zone === z.zone;
          return (
            <View key={z.zone} style={[s.zoneRow, isActive && { backgroundColor: z.color + '15', borderRadius:8 }]}>
              <View style={[s.zoneColor, { backgroundColor: z.color }]} />
              <Text style={[s.zoneName, isActive && { color: z.color, fontWeight:'900' }]}>Z{z.zone} {z.name}</Text>
              <Text style={s.zoneRange}>{lo}–{hi} bpm</Text>
              <Text style={s.zonePct}>{Math.round(z.min * 100)}–{Math.round(z.max * 100)}%</Text>
            </View>
          );
        })}
      </View>

      {/* Zone time tracker */}
      <View style={s.card}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <Text style={s.label}>ZONE TIME TRACKER</Text>
          <View style={{ flexDirection:'row', gap:8 }}>
            <TouchableOpacity onPress={toggleTracking} style={[s.smallBtn, tracking && { backgroundColor: '#f87171' }]}>
              <Text style={s.smallBtnText}>{tracking ? 'Pause' : 'Start'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetZones} style={s.smallBtn}>
              <Text style={s.smallBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goal progress (Zone 2, 30 min) */}
        <Text style={s.bodySec}>Zone 2 Goal: {fmtTime(goalZone)} / 30:00</Text>
        <View style={s.progTrack}>
          <View style={[s.progFill, { width:`${Math.min(1, goalZone / ZONE_GOAL_SECS) * 100}%`, backgroundColor: ZONE_DEFS[1].color }]} />
        </View>

        {ZONE_DEFS.map(z => (
          <View key={z.zone} style={s.zoneTimeRow}>
            <View style={[s.zoneColor, { backgroundColor: z.color }]} />
            <Text style={s.zoneName}>Z{z.zone} {z.name}</Text>
            <Text style={[s.zoneTime, { color: z.color }]}>{fmtTime(zoneTimes[z.zone] || 0)}</Text>
          </View>
        ))}
        <Text style={[s.bodySec, { marginTop:8, fontSize:11 }]}>Total tracked: {fmtTime(totalTracked)}</Text>
      </View>

      {/* 12-3-30 timer */}
      <View style={s.card}>
        <Text style={[s.label, { marginBottom:4 }]}>12-3-30 TREADMILL TIMER</Text>
        <Text style={[s.bodySec, { fontSize:11, marginBottom:12 }]}>12% incline · 3 mph · 30 minutes</Text>
        <Text style={[s.timerDisplay, { color: walkRunning ? theme.accent : theme.textPri }]}>
          {fmtTime(walkTime)}
        </Text>
        <View style={{ flexDirection:'row', gap:10, marginTop:12 }}>
          <TouchableOpacity
            style={[s.btn, { flex:1 }]}
            onPress={() => setWalkRunning(r => !r)}
          >
            <Ionicons name={walkRunning ? 'pause' : 'play'} size={18} color="#fff" style={{ marginRight:6 }} />
            <Text style={s.btnText}>{walkRunning ? 'Pause' : 'Start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, { flex:1, backgroundColor: theme.bgCard2, borderWidth:1, borderColor: theme.border }]}
            onPress={() => { setWalkRunning(false); setWalkTime(WALK_DURATION); }}
          >
            <Ionicons name="refresh" size={18} color={theme.textPri} style={{ marginRight:6 }} />
            <Text style={[s.btnText, { color: theme.textPri }]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    page:       { flex:1, backgroundColor: theme.bgPage },
    header:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:20 },
    backBtn:    { width:40 },
    headerTitle:{ fontSize:20, fontWeight:'900', color: theme.textPri },
    card:       { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth:1, borderColor: theme.border, padding:16, marginHorizontal:16, marginBottom:12, ...(theme.shadow || {}) },
    label:      { fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600' },
    bodySec:    { fontSize:13, color: theme.textSec },

    infoBox:    { flexDirection:'row', alignItems:'center', gap:8, backgroundColor: theme.bgCard2, paddingHorizontal:16, paddingVertical:10, marginHorizontal:16, marginBottom:12, borderRadius:8, borderWidth:1, borderColor: theme.border },
    infoText:   { fontSize:12, color: theme.textSec, flex:1 },

    bpmInput:   { backgroundColor: theme.bgInput, borderRadius:10, paddingHorizontal:14, paddingVertical:12, color: theme.textPri, fontSize:22, fontWeight:'700', borderWidth:1, borderColor: theme.border },
    applyBtn:   { backgroundColor: theme.accent, borderRadius:10, paddingHorizontal:16, justifyContent:'center' },
    applyBtnText:{ color:'#fff', fontWeight:'800', fontSize:15 },

    bpmDisplay: { alignItems:'center', marginTop:14, borderWidth:2, borderRadius:16, padding:16 },
    bpmBig:     { fontSize:64, fontWeight:'900', lineHeight:72 },
    bpmUnit:    { fontSize:14, color: theme.textSec, marginBottom:6 },
    zoneBadge:  { borderWidth:1, borderRadius:20, paddingHorizontal:12, paddingVertical:4, marginTop:4 },
    zoneBadgeText:{ fontSize:13, fontWeight:'700' },

    zoneRow:    { flexDirection:'row', alignItems:'center', paddingVertical:8, borderBottomWidth:1, borderBottomColor: theme.border, gap:10, paddingHorizontal:4 },
    zoneColor:  { width:10, height:10, borderRadius:5 },
    zoneName:   { flex:1, fontSize:13, fontWeight:'600', color: theme.textPri },
    zoneRange:  { fontSize:12, color: theme.textSec, marginRight:8 },
    zonePct:    { fontSize:11, color: theme.textMuted, width:55, textAlign:'right' },

    progTrack:  { height:6, backgroundColor: theme.progTrack, borderRadius:3, overflow:'hidden', marginVertical:8 },
    progFill:   { height:6, borderRadius:3 },

    zoneTimeRow:{ flexDirection:'row', alignItems:'center', paddingVertical:6, gap:10 },
    zoneTime:   { fontSize:14, fontWeight:'700' },

    smallBtn:    { paddingHorizontal:12, paddingVertical:6, backgroundColor: theme.accent, borderRadius:8 },
    smallBtnText:{ color:'#fff', fontWeight:'700', fontSize:12 },

    timerDisplay:{ fontSize:56, fontWeight:'900', textAlign:'center', letterSpacing:2 },

    btn:        { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor: theme.accent, borderRadius:10, padding:12 },
    btnText:    { color:'#fff', fontWeight:'800', fontSize:14 },
  });
}
