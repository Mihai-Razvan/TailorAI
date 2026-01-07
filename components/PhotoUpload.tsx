import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

interface PhotoUploadProps {
  imageUri: string | null;
  onPickImage: () => void;
}

export default function PhotoUpload({ imageUri, onPickImage }: PhotoUploadProps) {
  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <TouchableOpacity
            style={styles.changeButton}
            onPress={onPickImage}
          >
            <Text style={styles.changeButtonText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={onPickImage}>
          <View style={styles.uploadIcon}>
            <Text style={styles.uploadIconText}>📷</Text>
          </View>
          <Text style={styles.uploadButtonText}>Upload Photo</Text>
          <Text style={styles.uploadHint}>Tap to select from gallery</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  uploadButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    minHeight: 200,
    justifyContent: 'center',
  },
  uploadIcon: {
    marginBottom: 16,
  },
  uploadIconText: {
    fontSize: 48,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 14,
    color: '#6b7280',
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    resizeMode: 'cover',
  },
  changeButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
});
