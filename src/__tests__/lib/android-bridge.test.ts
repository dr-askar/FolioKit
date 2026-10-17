import { beforeEach, describe, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => true), getPlatform: vi.fn(() => 'android'),
  writeFile: vi.fn(async () => ({ uri: 'content://export/file' })),
  share: vi.fn(async () => ({})),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: native }));
vi.mock('@capacitor/filesystem', () => ({ Filesystem: native, Directory: { Cache: 'CACHE' } }));
vi.mock('@capacitor/share', () => ({ Share: native }));
import { exportAndroidFile, isAndroidApp } from '@/lib/android-bridge';

describe('Android export', () => {
  beforeEach(() => vi.clearAllMocks());
  it('distinguishes browsers from the native Android app', () => {
    native.isNativePlatform.mockReturnValueOnce(false);
    expect(isAndroidApp()).toBe(false);
    expect(isAndroidApp()).toBe(true);
  });
  it('preserves binary data, strips paths, and shares the granted cache URI', async () => {
    await exportAndroidFile(new Uint8Array([0, 127, 255]), '../../secret/report.pdf');
    expect(native.writeFile).toHaveBeenCalledWith(expect.objectContaining({
      path: expect.stringMatching(/^exports\/[^/]+\/report\.pdf$/), data: 'AH//', directory: 'CACHE', recursive: true,
    }));
    expect(native.share).toHaveBeenCalledWith(expect.objectContaining({ files: ['content://export/file'], title: 'report.pdf' }));
  });
  it('does not share when writing fails', async () => {
    native.writeFile.mockRejectedValueOnce(new Error('Disk full'));
    await expect(exportAndroidFile(new Uint8Array([1]), 'a.pdf')).rejects.toThrow('Disk full');
    expect(native.share).not.toHaveBeenCalled();
  });
  it('does not report success when sharing fails', async () => {
    native.share.mockRejectedValueOnce(new Error('Share unavailable'));
    await expect(exportAndroidFile(new Uint8Array([1]), 'a.pdf')).rejects.toThrow('Share unavailable');
  });
});
