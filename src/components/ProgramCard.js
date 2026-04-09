import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ProgramCard({ program: p, onPress, theme, s }) {
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
