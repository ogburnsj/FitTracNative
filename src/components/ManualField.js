import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function ManualField({ label, value, onChangeText, theme, kb = 'default' }) {
  const s = makeStyles(theme);
  return (
    <View style={{ marginBottom: 12 }}>
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
    fieldLabel: { fontSize: 12, color: theme.textSec, marginBottom: 4, fontWeight: '600' },
    input:      { backgroundColor: theme.bgInput, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: theme.textPri, fontSize: 14, borderWidth: 1, borderColor: theme.border },
  });
}
