import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import StyleCard from '@/components/StyleCard';
import PhotoUpload from '@/components/PhotoUpload';
import ResultDisplay from '@/components/ResultDisplay';
import { ClothingStyle } from '@/app/types';

const API_BASE_URL = __DEV__ 
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001')
  : 'https://your-production-api.com';

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ClothingStyle | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

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
        
        const apiResponse = await fetch(`${API_BASE_URL}/api/generate-outfit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            style: selectedStyle,
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        
        if (data.success && data.generatedImage) {
          setGeneratedImage(data.generatedImage);
          setLoadingMessage('');
        } else {
          throw new Error(data.error || 'Failed to generate outfit');
        }
      } catch (error) {
        console.error('Generation error:', error);
        Alert.alert(
          'Generation Failed',
          error instanceof Error ? error.message : 'Failed to generate outfit. Please try again.'
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>TailorAI</Text>
          <Text style={styles.subtitle}>Transform your style with AI</Text>
        </View>

        <PhotoUpload 
          imageUri={selectedImage}
          onPickImage={handleImagePick}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Style</Text>
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
          </View>
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
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
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
  styleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
