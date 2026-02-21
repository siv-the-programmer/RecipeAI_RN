import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Alert, ActivityIndicator, Dimensions, Animated, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyzeIngredientsAndGetRecipes } from './groqService';
import { colors } from './theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.07, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  };

  const setImageWithAnimation = (asset) => {
    setImage(asset);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access in your phone settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true, allowsEditing: false });
      if (!result.canceled && result.assets?.[0]) setImageWithAnimation(result.assets[0]);
    } catch (e) { Alert.alert('Camera error', e.message); }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access in your settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, base64: true, allowsEditing: false });
      if (!result.canceled && result.assets?.[0]) setImageWithAnimation(result.assets[0]);
    } catch (e) { Alert.alert('Gallery error', e.message); }
  };

  const analyze = async () => {
    if (!image?.base64) { Alert.alert('No image', 'Please add a photo first.'); return; }
    setLoading(true);
    startPulse();
    try {
      setLoadingText(' Scanning ingredients...');
      const result = await analyzeIngredientsAndGetRecipes(image.base64, 'image/jpeg');
      setLoadingText('✨ Almost ready!');
      await new Promise(r => setTimeout(r, 300));
      navigation.navigate('RecipeList', {
        recipes: result.recipes,
        ingredients: result.ingredients,
        imageUri: image.uri,
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0D0D0D', '#030303', '#070707']} style={StyleSheet.absoluteFill} />

      {/* Background orbs */}
      <View style={[styles.orb, { width: 300, height: 300, backgroundColor: colors.accent, top: -100, right: -80, opacity: 0.12 }]} />
      <View style={[styles.orb, { width: 220, height: 220, backgroundColor: colors.blue, bottom: 80, left: -70, opacity: 0.18 }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Recipe AI</Text>
          <Text style={styles.tagline}>Snap ingredients. Discover meals.</Text>
        </View>

        {/* Image Box */}
        <View style={styles.imageBox}>
          {image ? (
            <Animated.Image
              source={{ uri: image.uri }}
              style={[styles.previewImg, { opacity: fadeAnim }]}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}></Text>
              <Text style={styles.placeholderTitle}>Add a photo</Text>
              <Text style={styles.placeholderSub}>Take a picture or upload from gallery</Text>
            </View>
          )}
        </View>

        {/* Camera + Gallery */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.iconBtn, { marginRight: 12 }]} onPress={pickFromCamera} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={[colors.blue2, colors.blue]} style={styles.iconBtnGrad}>
              <Text style={styles.iconBtnEmoji}></Text>
              <Text style={styles.iconBtnLabel}>Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={pickFromGallery} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={[colors.blue2, colors.blue]} style={styles.iconBtnGrad}>
              <Text style={styles.iconBtnEmoji}></Text>
              <Text style={styles.iconBtnLabel}>Gallery</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Analyze */}
        {image && !loading && (
          <TouchableOpacity style={styles.analyzeBtn} onPress={analyze} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.accent, colors.accent2]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.analyzeBtnGrad}
            >
              <Text style={styles.analyzeBtnText}>  Find Recipes</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingWrap}>
            <Animated.View style={[styles.loadingCircle, { transform: [{ scale: pulseAnim }] }]}>
              <ActivityIndicator size="large" color={colors.accent} />
            </Animated.View>
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        )}

        {/* Clear */}
        {image && !loading && (
          <TouchableOpacity onPress={() => setImage(null)} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear photo</Text>
          </TouchableOpacity>
        )}

        {!image && (
          <Text style={styles.hint}>Works best with clear, well-lit photos</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 999 },
  scroll: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 36 },
  appName: {
    fontSize: 42, fontWeight: '900', color: '#fff',
    letterSpacing: -1.5, lineHeight: 46,
  },
  tagline: { fontSize: 15, color: colors.muted, marginTop: 6, letterSpacing: 0.3 },
  imageBox: {
    width: width - 48, height: 250, borderRadius: 24,
    overflow: 'hidden', marginBottom: 20,
    borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed',
  },
  previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center', justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 50, marginBottom: 14 },
  placeholderTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  placeholderSub: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  btnRow: { flexDirection: 'row', width: width - 48, marginBottom: 16 },
  iconBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  iconBtnGrad: {
    paddingVertical: 18, alignItems: 'center',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBtnEmoji: { fontSize: 28, marginBottom: 5 },
  iconBtnLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
  analyzeBtn: {
    width: width - 48, borderRadius: 20, overflow: 'hidden', marginBottom: 14,
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  analyzeBtnGrad: { paddingVertical: 20, alignItems: 'center', borderRadius: 20 },
  analyzeBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  loadingWrap: { alignItems: 'center', marginVertical: 8 },
  loadingCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' },
  clearBtn: { marginTop: 4 },
  clearText: { color: 'rgba(255,255,255,0.3)', fontSize: 13, textDecorationLine: 'underline' },
  hint: {
    color: 'rgba(255,255,255,0.2)', fontSize: 12,
    textAlign: 'center', marginTop: 20, lineHeight: 18,
  },
});
