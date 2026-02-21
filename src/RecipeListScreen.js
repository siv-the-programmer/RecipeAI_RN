import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, difficulty } from './theme';

const { width } = Dimensions.get('window');

function RecipeCard({ recipe, index, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const diff = difficulty[recipe.difficulty] || difficulty.Easy;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={styles.card}>
        <LinearGradient
          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']}
          style={styles.cardGrad}
        >
          <View style={styles.cardEmojiWrap}>
            <Text style={styles.cardEmoji}>{recipe.emoji || '🍽️'}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={1}>{recipe.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{recipe.description}</Text>
            <View style={styles.cardMeta}>
              <View style={[styles.badge, { backgroundColor: diff.bg }]}>
                <Text style={[styles.badgeText, { color: diff.text }]}>{recipe.difficulty}</Text>
              </View>
              <Text style={styles.cardTime}>⏱ {recipe.time}</Text>
            </View>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RecipeListScreen({ navigation, route }) {
  const { recipes = [], ingredients = [], imageUri } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0D0D0D', '#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Ideas</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Ingredients banner */}
        <View style={styles.ingBanner}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.ingThumb} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.ingLabel}>Detected Ingredients</Text>
            <Text style={styles.ingList} numberOfLines={3}>{ingredients.join(', ')}</Text>
          </View>
        </View>

        <Text style={styles.countText}>{recipes.length} recipes found for you</Text>

        {recipes.map((recipe, index) => (
          <RecipeCard
            key={recipe.id || index}
            recipe={recipe}
            index={index}
            onPress={() => navigation.navigate('RecipeDetail', {
              recipeTitle: recipe.title,
              ingredients,
              recipeBasic: recipe,
            })}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 24, lineHeight: 28 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  ingBanner: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 20,
    alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  ingThumb: { width: 68, height: 68, borderRadius: 12, marginRight: 2 },
  ingLabel: {
    fontSize: 10, textTransform: 'uppercase',
    letterSpacing: 1.2, color: colors.muted, marginBottom: 5,
  },
  ingList: { fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 19 },
  countText: { fontSize: 13, color: colors.muted, marginBottom: 14 },
  card: {
    borderRadius: 18, overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  cardGrad: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 14 },
  cardEmojiWrap: {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4, letterSpacing: -0.2 },
  cardDesc: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardTime: { fontSize: 11, color: colors.muted },
  cardArrow: { color: 'rgba(255,255,255,0.25)', fontSize: 28, lineHeight: 28 },
});
