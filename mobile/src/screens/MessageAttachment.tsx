import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { errorMessage, type FamilyAttachment } from '../lib/family';
import { attachmentPreview, openAttachment } from '../lib/message-attachments';
import { showAlert } from '../lib/show-alert';

export default function MessageAttachment({ attachment }: { attachment: FamilyAttachment }) {
  const [preview, setPreview] = useState<string>();

  useEffect(() => {
    let active = true;
    if (attachment.mime.startsWith('image/')) {
      void attachmentPreview(attachment).then(uri => {
        if (active) setPreview(uri);
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [attachment]);

  return <Pressable accessibilityRole="button" accessibilityLabel={`Open attachment ${attachment.name}`}
    style={styles.attachment} onPress={() => void openAttachment(attachment).catch(error => showAlert('Could not open attachment', errorMessage(error)))}>
    {preview && <Image source={{ uri: preview }} style={styles.image} resizeMode="contain" />}
    <View style={styles.row}>
      <Ionicons name="document-attach-outline" size={19} color="#A72559" />
      <Text style={styles.filename} numberOfLines={1}>{attachment.name}</Text>
      <Ionicons name="share-outline" size={19} color="#A72559" />
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  attachment: { gap: 8, backgroundColor: '#FFF4F8', padding: 9, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  filename: { color: '#782140', fontWeight: '600', fontSize: 13, flexShrink: 1 },
  image: { height: 140, width: 180, maxWidth: '100%' },
});
