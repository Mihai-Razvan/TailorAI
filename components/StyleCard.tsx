import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ClothingStyle } from '@/app/types';

interface StyleCardProps {
  style: ClothingStyle;
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}

export default function StyleCard({
  style,
  label,
  emoji,
  selected,
  onPress,
}: StyleCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
      {selected && <View style={styles.checkmark} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
    minHeight: 100,
  },
  cardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#6366f1',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
