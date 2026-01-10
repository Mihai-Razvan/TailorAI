import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import StyleCard from '@/components/StyleCard';
import PhotoUpload from '@/components/PhotoUpload';
import ResultDisplay from '@/components/ResultDisplay';
import HistoryView from '@/components/HistoryView';
import { HistoryItem } from '@/components/HistoryItem';
import { ClothingStyle } from '@/app/types';

const HISTORY_STORAGE_KEY = '@tailorai_history';

const API_BASE_URL = 'https://14377f2ed4cc.ngrok-free.app';

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ClothingStyle | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveToHistory = async (originalImage: string, generatedImage: string, style: string) => {
    try {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        originalImage,
        generatedImage,
        style,
        timestamp: Date.now(),
      };
      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setHistory([]);
            await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
          },
        },
      ]
    );
  };

  const handleHistoryItemPress = (item: HistoryItem) => {
    setSelectedImage(item.originalImage);
    setGeneratedImage(item.generatedImage);
    setSelectedStyle(item.style as ClothingStyle);
    setShowHistory(false);
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to use this feature.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setGeneratedImage(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !selectedStyle) {
      Alert.alert('Missing Information', 'Please select both an image and a style.');
      return;
    }

    setLoading(true);
    setLoadingMessage('Preparing your image...');
    setGeneratedImage(null);

    try {
      // Convert image to base64 using expo-file-system
      setLoadingMessage('Processing image...');
      
      const base64data = await FileSystem.readAsStringAsync(selectedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const base64Image = `data:image/jpeg;base64,${base64data}`;
      
      try {
        setLoadingMessage('Generating your look...');
      
        const url = `${API_BASE_URL}/api/generate-outfit`;
      
        console.log('➡️ REQUEST URL:', url);
        console.log('➡️ IMAGE SIZE (base64 chars):', base64Image.length);
        console.log('➡️ STYLE:', selectedStyle);
      
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            style: selectedStyle,
          }),
        });
      
        console.log('⬅️ RESPONSE STATUS:', response.status);
      
        const text = await response.text();
        console.log('⬅️ RAW RESPONSE:', text);
      
        const data = JSON.parse(text);
      
        if (!response.ok) {
          throw new Error(data.error || `API error ${response.status}`);
        }
      
        if (data.success && data.generatedImage) {
          setGeneratedImage(data.generatedImage);
          // Save to history
          if (selectedImage) {
            await saveToHistory(selectedImage, data.generatedImage, selectedStyle || 'casual');
          }
        } else {
          throw new Error(data.error || 'Invalid API response');
        }
      
      } catch (error: any) {
        console.error('❌ FULL ERROR OBJECT:', error);
        console.error('❌ ERROR MESSAGE:', error?.message);
        console.error('❌ ERROR STACK:', error?.stack);
      
        Alert.alert(
          'Generation Failed',
          error?.message ?? JSON.stringify(error)
        );
      } finally {
        setLoading(false);
        setLoadingMessage('');
      }
    } catch (error) {
      setLoading(false);
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  };

  if (showHistory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HistoryView
          history={history}
          onItemPress={handleHistoryItemPress}
          onClose={() => setShowHistory(false)}
          onClear={clearHistory}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>TailorAI</Text>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => setShowHistory(true)}
            >
              <Text style={styles.historyButtonText}>📚</Text>
              {history.length > 0 && (
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>{history.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Transform your style with AI</Text>
        </View>

        <PhotoUpload 
          imageUri={selectedImage}
          onPickImage={handleImagePick}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScrollView}>
            <View style={styles.styleGrid}>
              <StyleCard
                style="casual"
                label="Casual"
                emoji="👕"
                selected={selectedStyle === 'casual'}
                onPress={() => setSelectedStyle('casual')}
              />
              <StyleCard
                style="modern"
                label="Modern"
                emoji="💼"
                selected={selectedStyle === 'modern'}
                onPress={() => setSelectedStyle('modern')}
              />
              <StyleCard
                style="edgy"
                label="Edgy"
                emoji="🖤"
                selected={selectedStyle === 'edgy'}
                onPress={() => setSelectedStyle('edgy')}
              />
              <StyleCard
                style="formal"
                label="Formal"
                emoji="🤵"
                selected={selectedStyle === 'formal'}
                onPress={() => setSelectedStyle('formal')}
              />
              <StyleCard
                style="sporty"
                label="Sporty"
                emoji="⚽"
                selected={selectedStyle === 'sporty'}
                onPress={() => setSelectedStyle('sporty')}
              />
              <StyleCard
                style="vintage"
                label="Vintage"
                emoji="📻"
                selected={selectedStyle === 'vintage'}
                onPress={() => setSelectedStyle('vintage')}
              />
              <StyleCard
                style="bohemian"
                label="Bohemian"
                emoji="🌸"
                selected={selectedStyle === 'bohemian'}
                onPress={() => setSelectedStyle('bohemian')}
              />
              <StyleCard
                style="cyberpunk"
                label="Cyberpunk"
                emoji="🤖"
                selected={selectedStyle === 'cyberpunk'}
                onPress={() => setSelectedStyle('cyberpunk')}
              />
              <StyleCard
                style="steampunk"
                label="Steampunk"
                emoji="⚙️"
                selected={selectedStyle === 'steampunk'}
                onPress={() => setSelectedStyle('steampunk')}
              />
              <StyleCard
                style="gothic"
                label="Gothic"
                emoji="🦇"
                selected={selectedStyle === 'gothic'}
                onPress={() => setSelectedStyle('gothic')}
              />
              <StyleCard
                style="kawaii"
                label="Kawaii"
                emoji="🎀"
                selected={selectedStyle === 'kawaii'}
                onPress={() => setSelectedStyle('kawaii')}
              />
              <StyleCard
                style="minimalist"
                label="Minimalist"
                emoji="⚪"
                selected={selectedStyle === 'minimalist'}
                onPress={() => setSelectedStyle('minimalist')}
              />
              <StyleCard
                style="streetwear"
                label="Streetwear"
                emoji="👟"
                selected={selectedStyle === 'streetwear'}
                onPress={() => setSelectedStyle('streetwear')}
              />
            </View>
          </ScrollView>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>{loadingMessage || 'Processing...'}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.generateButton,
            (!selectedImage || !selectedStyle || loading) && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerate}
          disabled={!selectedImage || !selectedStyle || loading}
        >
          <Text style={styles.generateButtonText}>Generate Outfit</Text>
        </TouchableOpacity>

        {generatedImage && selectedImage && (
          <ResultDisplay
            originalImage={selectedImage}
            generatedImage={generatedImage}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  historyButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButtonText: {
    fontSize: 24,
  },
  historyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  historyBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  styleScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  styleGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  generateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
