import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDocumentAsync } from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { Platform } from 'react-native';

import type { FamilyAttachment } from './family';

const mimeTypes: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};
const limit = 1024 * 1024;

export type AttachmentDraft = Omit<FamilyAttachment, 'id'> & { base64: string };
export const attachmentKey = (id: string) => `@quietcue_attachment:${id}`;

export async function pickAttachment(): Promise<AttachmentDraft | null> {
  const result = await getDocumentAsync({ type: [...new Set(Object.values(mimeTypes))], copyToCacheDirectory: true });
  const asset = result.assets?.[0];
  if (!asset) return null;
  try {
    const mime = mimeTypes[asset.name.split('.').pop()?.toLowerCase() ?? ''];
    if (!mime) throw new Error('Choose a PDF or an image.');
    if ((asset.size ?? 0) > limit) throw new Error('Choose an attachment under 1 MB.');
    const base64 = Platform.OS === 'web'
      ? await readWebFile(asset.file)
      : await new File(asset.uri).base64();
    if (base64.length > 4 * Math.ceil(limit / 3)) throw new Error('Choose an attachment under 1 MB.');
    return { name: asset.name.replace(/[\\/]/g, '_'), mime, base64 };
  } finally {
    if (Platform.OS === 'web') URL.revokeObjectURL(asset.uri);
  }
}

function readWebFile(file?: globalThis.File) {
  return new Promise<string>((resolve, reject) => {
    if (!file) { reject(new Error('The selected file could not be read.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The selected file could not be read.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(file);
  });
}

async function loadAttachment(attachment: FamilyAttachment) {
  const base64 = await AsyncStorage.getItem(attachmentKey(attachment.id));
  if (!base64) throw new Error('This file is unavailable on this device.');
  return base64;
}

export async function attachmentPreview(attachment: FamilyAttachment) {
  return `data:${attachment.mime};base64,${await loadAttachment(attachment)}`;
}

export async function openAttachment(attachment: FamilyAttachment) {
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.download = attachment.name;
    link.href = await attachmentPreview(attachment);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  const directory = new Directory(Paths.cache, `quietcue-${attachment.id}`);
  directory.create({ idempotent: true });
  const file = new File(directory, attachment.name);
  await file.write(await loadAttachment(attachment), { encoding: 'base64' });
  await shareAsync(file.uri, { mimeType: attachment.mime, dialogTitle: attachment.name });
}
