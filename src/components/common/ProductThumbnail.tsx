import React, { useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import theme from '@/constants/theme';
import { gradeColor } from '@/utils/safetyColors';

interface Props {
  imageUrl?: string | null;
  grade?: string | null;
  size?: number;
}

const ProductThumbnail: React.FC<Props> = ({ imageUrl, grade, size = 48 }) => {
  const [failed, setFailed] = useState(false);
  const radius = size * 0.22;

  if (imageUrl && !failed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
        onError={() => setFailed(true)}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: gradeColor(grade),
        },
      ]}
    >
      <Text style={[styles.grade, { fontSize: size * 0.38 }]}>{grade ?? '?'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.border,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  grade: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});

export default ProductThumbnail;
