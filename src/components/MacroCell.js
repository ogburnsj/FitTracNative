import React from 'react';
import { View, Text } from 'react-native';

export default function MacroCell({ label, value, unit, color, theme }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color }}>{Math.round(value)}</Text>
      <Text style={{ fontSize: 9, color: theme.textSec, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ fontSize: 9, color: theme.textMuted }}>{unit}</Text>
    </View>
  );
}
