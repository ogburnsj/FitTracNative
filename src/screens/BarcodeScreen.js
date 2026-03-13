import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function BarcodeScreen({ navigation }) {
  const { addFoodEntry } = useApp();
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned,   setScanned]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [product,   setProduct]   = useState(null);
  const [selMeal,   setSelMeal]   = useState('Breakfast');
  const [mealModal, setMealModal] = useState(false);
  const [servings,  setServings]  = useState('1');

  if (!permission) return <View style={{ flex:1, backgroundColor: theme.bgPage }} />;

  if (!permission.granted) {
    return (
      <View style={[s.centered, { backgroundColor: theme.bgPage }]}>
        <Ionicons name="camera-outline" size={64} color={theme.textMuted} />
        <Text style={[s.bodyPri, { marginTop:16, textAlign:'center' }]}>
          Camera permission is needed to scan barcodes.
        </Text>
        <TouchableOpacity style={[s.btn, { marginTop:20 }]} onPress={requestPermission}>
          <Text style={s.btnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop:16 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.textSec }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleBarcode({ data }) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const resp = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const json = await resp.json();
      if (json.status !== 1 || !json.product) {
        Alert.alert('Not Found', 'Product not found in Open Food Facts database.');
        setScanned(false);
        return;
      }
      const p = json.product;
      const n = p.nutriments || {};
      const item = {
        n:    p.product_name || p.product_name_en || 'Unknown Product',
        cal:  Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
        pro:  parseFloat((n.proteins_100g || 0).toFixed(1)),
        carb: parseFloat((n.carbohydrates_100g || 0).toFixed(1)),
        fat:  parseFloat((n.fat_100g || 0).toFixed(1)),
        fib:  parseFloat((n.fiber_100g || 0).toFixed(1)),
        sod:  Math.round((n.sodium_100g || 0) * 1000), // g → mg
        srv:  p.serving_size || '100g',
        servings: 1,
      };
      setProduct(item);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch product info.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  }

  function confirmAdd() {
    if (!product) return;
    const mult = parseFloat(servings) || 1;
    const entry = {
      n:    product.n,
      cal:  Math.round(product.cal * mult),
      pro:  parseFloat((product.pro  * mult).toFixed(1)),
      carb: parseFloat((product.carb * mult).toFixed(1)),
      fat:  parseFloat((product.fat  * mult).toFixed(1)),
      fib:  parseFloat((product.fib  * mult).toFixed(1)),
      sod:  Math.round(product.sod  * mult),
      srv:  product.srv,
      servings: mult,
    };
    addFoodEntry(selMeal, entry);
    Alert.alert('Added!', `${product.n} added to ${selMeal}.`, [
      { text: 'Scan Another', onPress: () => { setProduct(null); setScanned(false); setServings('1'); } },
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  }

  if (product) {
    return (
      <ScrollView style={{ flex:1, backgroundColor: theme.bgPage }} contentContainerStyle={{ padding:16 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { setProduct(null); setScanned(false); }} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.textPri} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Product Found</Text>
          <View style={{ width:40 }} />
        </View>

        <View style={s.card}>
          <Text style={s.productName}>{product.n}</Text>
          <Text style={[s.bodySec, { marginBottom:12 }]}>per {product.srv}</Text>
          <View style={s.macroGrid}>
            <MacroCell label="Calories" value={product.cal}  unit="" color={theme.textPri} theme={theme} />
            <MacroCell label="Protein"  value={product.pro}  unit="g" color="#60a5fa"     theme={theme} />
            <MacroCell label="Carbs"    value={product.carb} unit="g" color="#fbbf24"     theme={theme} />
            <MacroCell label="Fat"      value={product.fat}  unit="g" color="#f87171"     theme={theme} />
          </View>
          <View style={[s.macroGrid, { marginTop:8 }]}>
            <MacroCell label="Fiber"  value={product.fib} unit="g"  color={theme.accent}  theme={theme} />
            <MacroCell label="Sodium" value={product.sod} unit="mg" color={theme.textSec} theme={theme} />
          </View>
        </View>

        <View style={s.card}>
          <Text style={[s.label, { marginBottom:8 }]}>SERVINGS</Text>
          <Text style={[s.bodySec, { marginBottom:10 }]}>1 serving = {product.srv}</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
            <Text style={s.bodySec}>Qty:</Text>
            <TextInput
              style={[s.servingInput]}
              keyboardType="decimal-pad"
              value={servings}
              onChangeText={setServings}
            />
            <Text style={[s.bodySec, { flex:1 }]}>
              = {Math.round(product.cal * (parseFloat(servings) || 1))} cal
              {'  '}
              {parseFloat(((product.pro  || 0) * (parseFloat(servings) || 1)).toFixed(1))}g pro
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={[s.label, { marginBottom:8 }]}>ADD TO MEAL</Text>
          <TouchableOpacity style={s.mealSelector} onPress={() => setMealModal(true)}>
            <Text style={{ color: theme.textPri, fontSize:15, fontWeight:'600' }}>{selMeal}</Text>
            <Ionicons name="chevron-down" size={18} color={theme.textSec} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { marginTop:12 }]} onPress={confirmAdd}>
            <Ionicons name="add-circle" size={18} color="#fff" style={{ marginRight:6 }} />
            <Text style={s.btnText}>Add to {selMeal}</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={mealModal} transparent animationType="fade" onRequestClose={() => setMealModal(false)}>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setMealModal(false)}>
            <View style={s.mealPicker}>
              {MEALS.map(m => (
                <TouchableOpacity key={m} style={s.mealOption} onPress={() => { setSelMeal(m); setMealModal(false); }}>
                  <Text style={[s.mealOptionText, m === selMeal && { color: theme.accent, fontWeight:'800' }]}>{m}</Text>
                  {m === selMeal && <Ionicons name="checkmark" size={18} color={theme.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:'#000' }}>
      <CameraView
        style={{ flex:1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['ean13','ean8','upc_a','upc_e','qr'] }}
      >
        {/* Overlay */}
        <View style={s.scanOverlay}>
          <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={s.scanFrame}>
            <View style={[s.scanCorner, s.cornerTL]} />
            <View style={[s.scanCorner, s.cornerTR]} />
            <View style={[s.scanCorner, s.cornerBL]} />
            <View style={[s.scanCorner, s.cornerBR]} />
            {loading && <ActivityIndicator size="large" color="#fff" style={{ position:'absolute' }} />}
          </View>

          <Text style={s.scanHint}>
            {loading ? 'Looking up product…' : 'Point camera at a barcode'}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

function MacroCell({ label, value, unit, color, theme }) {
  return (
    <View style={{ alignItems:'center', flex:1 }}>
      <Text style={{ fontSize:18, fontWeight:'900', color }}>{value}{unit}</Text>
      <Text style={{ fontSize:10, color: theme.textSec, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</Text>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    centered:    { flex:1, alignItems:'center', justifyContent:'center', padding:32 },
    header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
    backBtn:     { width:40 },
    headerTitle: { fontSize:20, fontWeight:'900', color: theme.textPri },
    card:        { backgroundColor: theme.bgCard, borderRadius: theme.cardRadius, borderWidth:1, borderColor: theme.border, padding:16, marginBottom:12, ...(theme.shadow || {}) },
    label:       { fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color: theme.textSec, fontWeight:'600' },
    bodySec:     { fontSize:13, color: theme.textSec },
    bodyPri:     { fontSize:15, fontWeight:'600', color: theme.textPri },
    productName: { fontSize:20, fontWeight:'900', color: theme.textPri, marginBottom:4 },
    macroGrid:   { flexDirection:'row', justifyContent:'space-around' },

    servingInput:{ backgroundColor: theme.bgInput, borderRadius:8, paddingHorizontal:12, paddingVertical:8, color: theme.textPri, fontSize:16, fontWeight:'700', width:80, textAlign:'center', borderWidth:1, borderColor: theme.border },
    mealSelector:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor: theme.bgInput, borderRadius:10, padding:12, borderWidth:1, borderColor: theme.border },
    btn:         { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor: theme.accent, borderRadius:10, padding:14 },
    btnText:     { color:'#fff', fontWeight:'800', fontSize:15 },

    overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
    mealPicker:  { backgroundColor: theme.bgCard, borderTopLeftRadius:20, borderTopRightRadius:20, paddingBottom:30 },
    mealOption:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:18, borderBottomWidth:1, borderBottomColor: theme.border },
    mealOptionText:{ fontSize:16, color: theme.textPri },

    scanOverlay: { flex:1, alignItems:'center', justifyContent:'center' },
    closeBtn:    { position:'absolute', top:50, left:20, padding:8 },
    scanFrame:   { width:260, height:180, justifyContent:'center', alignItems:'center', position:'relative' },
    scanHint:    { position:'absolute', bottom:80, color:'#fff', fontSize:15, fontWeight:'600', textShadowColor:'rgba(0,0,0,0.8)', textShadowOffset:{width:0,height:1}, textShadowRadius:4 },
    scanCorner:  { position:'absolute', width:24, height:24, borderColor:'#fff', borderWidth:3 },
    cornerTL:    { top:0,    left:0,    borderRightWidth:0, borderBottomWidth:0 },
    cornerTR:    { top:0,    right:0,   borderLeftWidth:0,  borderBottomWidth:0 },
    cornerBL:    { bottom:0, left:0,    borderRightWidth:0, borderTopWidth:0    },
    cornerBR:    { bottom:0, right:0,   borderLeftWidth:0,  borderTopWidth:0    },
  });
}
