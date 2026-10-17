import { Capacitor } from '@capacitor/core';

export const isAndroidApp = (): boolean => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

/** Export through Android's share sheet; recipients can save to Files or another app. */
export async function exportAndroidFile(file: Blob | Uint8Array, name: string): Promise<boolean> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const filename = name.split(/[\\/]/).pop()?.replace(/[\x00-\x1f]/g, '_') || 'download.pdf';
  const blob = file instanceof Blob ? file : new Blob([new Uint8Array(file).buffer]);
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Unable to read export'));
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(blob);
  });
  const path = `exports/${crypto.randomUUID()}/${filename}`;
  const { uri } = await Filesystem.writeFile({ path, data, directory: Directory.Cache, recursive: true });
  // Keep cached exports available while receiving apps read their granted URIs.
  await Share.share({ title: filename, files: [uri], dialogTitle: 'Save or share file' });
  return true;
}
