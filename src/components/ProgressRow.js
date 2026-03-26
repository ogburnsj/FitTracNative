import React from 'react';
import { View, Text } from 'react-native';

export default function ProgressRow({ label, value, color, theme }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <Text style={{ color: theme.textSec, fontSize: 14 }}>{label}</Text>
      <Text style={{ color, fontWeight: '700', fontSize: 14 }}>{value}</Text>
    </View>
  );
}
