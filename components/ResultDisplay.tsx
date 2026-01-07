import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

interface ResultDisplayProps {
  originalImage: string;
  generatedImage: string;
}

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - 40;

export default function ResultDisplay({
  originalImage,
  generatedImage,
}: ResultDisplayProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'generated'>('original');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Results</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'original' && styles.tabActive]}
          onPress={() => setActiveTab('original')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'original' && styles.tabTextActive]}
          >
            Original
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'generated' && styles.tabActive]}
          onPress={() => setActiveTab('generated')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'generated' && styles.tabTextActive]}
          >
            Generated
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: activeTab === 'original' ? originalImage : generatedImage }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.sideBySideContainer}>
        <View style={styles.sideBySideItem}>
          <Text style={styles.sideBySideLabel}>Before</Text>
          <Image source={{ uri: originalImage }} style={styles.sideBySideImage} />
        </View>
        <View style={styles.sideBySideItem}>
          <Text style={styles.sideBySideLabel}>After</Text>
          <Image source={{ uri: generatedImage }} style={styles.sideBySideImage} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  imageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 400,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  sideBySideContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  sideBySideItem: {
    flex: 1,
  },
  sideBySideLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  sideBySideImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
});
