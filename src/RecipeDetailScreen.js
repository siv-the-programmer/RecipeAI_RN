import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFullRecipe } from './groqService';
import { generateAndSharePDF } from './pdfService';
import { colors, difficulty } from './theme';

export default function RecipeDetailScreen({ navigation, route }) {
  const { recipeTitle, ingredients, recipeBasic } = route.params;
  const insets = useSafeAreaInsets();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const full = await getFullRecipe(recipeTitle, ingredients);
      setRecipe(full);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) {
      Alert.alert('Error', e.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = async () => {
    if (!recipe) return;
    setPdfLoading(true);
    try {
      await generateAndSharePDF(recipe);
    } catch (e) {
      Alert.alert('PDF Error', e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadScreen, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#0D0D0D', '#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />
        <Text style={styles.loadEmoji}>{recipeBasic?.emoji || '👨‍🍳'}</Text>
        <ActivityIndicator color={colors.accent} size="large" style={{ marginBottom: 18 }} />
        <Text style={styles.loadTitle}>{recipeTitle}</Text>
        <Text style={styles.loadSub}>Generating full recipe...</Text>
      </View>
    );
  }

  if (!recipe) return null;

  const diff = difficulty[recipe.difficulty] || difficulty.Easy;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0D0D0D', '#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />

      {/* Back button */}
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => navigation.goBack()}>
        <View style={styles.backBtnInner}>
          <Text style={styles.backText}>‹</Text>
        </View>
      </TouchableOpacity>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{recipe.emoji || '🍽️'}</Text>
          <Text style={styles.heroTitle}>{recipe.title}</Text>
          <Text style={styles.heroDesc}>{recipe.description}</Text>

          {/* Meta pills */}
          <View style={styles.metaRow}>
            {[
              { label: 'Prep', value: recipe.prepTime },
              { label: 'Cook', value: recipe.cookTime },
              { label: 'Serves', value: recipe.servings },
              { label: 'Level', value: recipe.difficulty, color: diff.text },
            ].map((m, i) => (
              <View key={i} style={styles.metaPill}>
                <Text style={styles.metaLabel}>{m.label}</Text>
                <Text style={[styles.metaValue, m.color ? { color: m.color } : {}]}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥦  Ingredients</Text>
          {(recipe.ingredients || []).map((ing, i) => (
            <View key={i} style={styles.ingChip}>
              <Text style={styles.ingAmt}>{ing.amount} {ing.unit}</Text>
              <Text style={styles.ingName}>{ing.item}</Text>
            </View>
          ))}
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>  Instructions</Text>
          {(recipe.steps || []).map((step, i) => (
            <View key={i} style={styles.step}>
              <LinearGradient colors={[colors.accent, colors.accent2]} style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.number}</Text>
              </LinearGradient>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>{step.instruction}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        {recipe.tips?.length > 0 && (
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡  Chef's Tips</Text>
            {recipe.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipStar}>★</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Nutrition */}
        {recipe.nutrition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>  Nutrition per serving</Text>
            <View style={styles.nutGrid}>
              {[
                { label: 'Calories', value: recipe.nutrition.calories },
                { label: 'Protein', value: recipe.nutrition.protein },
                { label: 'Carbs', value: recipe.nutrition.carbs },
                { label: 'Fat', value: recipe.nutrition.fat },
              ].map((n, i) => (
                <View key={i} style={styles.nutCard}>
                  <Text style={styles.nutVal}>{n.value}</Text>
                  <Text style={styles.nutLabel}>{n.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* PDF button - fixed at bottom */}
      <View style={[styles.pdfBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={handlePDF}
          disabled={pdfLoading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.accent, colors.accent2]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.pdfBtnGrad}
          >
            {pdfLoading
              ? <ActivityIndicator color="#fff" />
              : <><Text style={styles.pdfBtnIcon}>📥</Text><Text style={styles.pdfBtnText}>Download Recipe PDF</Text></>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadEmoji: { fontSize: 70, marginBottom: 24 },
  loadTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center', paddingHorizontal: 40, marginBottom: 6 },
  loadSub: { color: colors.muted, fontSize: 14 },
  backBtn: { position: 'absolute', left: 20, zIndex: 100 },
  backBtnInner: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 24, lineHeight: 28 },
  scroll: { paddingTop: 0 },
  hero: {
    paddingTop: 96, paddingBottom: 32, paddingHorizontal: 24,
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4,
  },
  heroEmoji: { fontSize: 76, marginBottom: 18 },
  heroTitle: {
    color: colors.text, fontSize: 28, fontWeight: '800',
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 10, lineHeight: 34,
  },
  heroDesc: {
    color: colors.muted, fontSize: 14, textAlign: 'center',
    lineHeight: 21, marginBottom: 24, paddingHorizontal: 16,
  },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', minWidth: 72,
  },
  metaLabel: { color: colors.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  metaValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  section: {
    paddingHorizontal: 20, paddingVertical: 22,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  ingChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    padding: 13, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: colors.blue,
  },
  ingAmt: { color: colors.lightBlue, fontWeight: '700', fontSize: 13, minWidth: 88 },
  ingName: { color: 'rgba(255,255,255,0.85)', fontSize: 14, flex: 1 },
  step: { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  stepContent: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14 },
  stepText: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 21 },
  tipsBox: {
    marginHorizontal: 20, marginVertical: 8, padding: 20,
    backgroundColor: 'rgba(244,164,0,0.07)', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: colors.gold,
  },
  tipsTitle: { color: colors.gold, fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  tipRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  tipStar: { color: colors.gold, fontSize: 12, marginTop: 2 },
  tipText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 19, flex: 1 },
  nutGrid: { flexDirection: 'row', gap: 10 },
  nutCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  nutVal: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  nutLabel: { color: colors.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  pdfBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: 'rgba(13,13,13,0.92)',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  pdfBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  pdfBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10, borderRadius: 18,
  },
  pdfBtnIcon: { fontSize: 20 },
  pdfBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
