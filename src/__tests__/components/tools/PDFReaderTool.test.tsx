import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import React from 'react';
import { PDFReaderTool } from '@/components/tools/pdf-reader/PDFReaderTool';
import * as tauriBridge from '@/lib/tauri-bridge';
import * as androidBridge from '@/lib/android-bridge';
import { App } from '@capacitor/app';

vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn() } }));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'buttons.save': 'Save',
      'buttons.close': 'Close',
      'pdfReader.uploadLabel': 'Open PDF File',
      'pdfReader.uploadDescription': 'Open a PDF file to read and view.',
      'pdfReader.print': 'Print (Ctrl+P)',
      'pdfReader.printModalTitle': 'Print Document',
    };
    return translations[key] || key;
  },
}));

// Mock path util
vi.mock('@/lib/utils/path', () => ({
  withBasePath: (path: string) => path,
}));

// Mock FileUploader
vi.mock('@/components/tools/FileUploader', () => ({
  FileUploader: ({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) => (
    <button
      data-testid="mock-uploader"
      onClick={() => onFilesSelected([new File(['test content'], 'sample.pdf', { type: 'application/pdf' })])}
    >
      Upload PDF
    </button>
  ),
}));

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe('PDFReaderTool', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('renders upload component initially', () => {
    render(<PDFReaderTool />);
    expect(screen.getByTestId('mock-uploader')).toBeInTheDocument();
  });

  it('renders viewer and print button after file is selected', async () => {
    render(<PDFReaderTool />);
    fireEvent.click(screen.getByTestId('mock-uploader'));

    await waitFor(() => {
      expect(screen.getByText('sample.pdf')).toBeInTheDocument();
    });

    const printBtn = screen.getByTitle('打印 (Ctrl+P)');
    expect(printBtn).toBeInTheDocument();
  });

  it('falls back to window.print in browser mode when print button is clicked', async () => {
    vi.spyOn(tauriBridge, 'isTauri').mockReturnValue(false);
    const printSpy = vi.fn();
    window.print = printSpy;
    const originalGetter = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      configurable: true,
      get: () => ({ print: printSpy }),
    });

    try {
      render(<PDFReaderTool />);
      fireEvent.click(screen.getByTestId('mock-uploader'));

      await waitFor(() => {
        expect(screen.getByText('sample.pdf')).toBeInTheDocument();
      });

      const printBtn = screen.getByTitle('打印 (Ctrl+P)');
      fireEvent.click(printBtn);

      expect(printSpy).toHaveBeenCalled();
    } finally {
      if (originalGetter) {
        Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', originalGetter);
      }
    }
  });

  it('opens native print modal in Tauri desktop mode when print button is clicked', async () => {
    vi.spyOn(tauriBridge, 'isTauri').mockReturnValue(true);
    vi.spyOn(tauriBridge, 'getSystemPrinters').mockResolvedValue([
      { name: 'HP LaserJet M14', is_default: true, port_name: 'USB001' },
      { name: 'SHARP MX-M3558NV', is_default: false, port_name: '192.168.1.100' },
    ]);

    render(<PDFReaderTool />);
    fireEvent.click(screen.getByTestId('mock-uploader'));

    await waitFor(() => {
      expect(screen.getByText('sample.pdf')).toBeInTheDocument();
    });

    const printBtn = screen.getByTitle('打印 (Ctrl+P)');
    fireEvent.click(printBtn);

    await waitFor(() => {
      expect(screen.getByText('打印文档')).toBeInTheDocument();
      expect(screen.getByText('HP LaserJet M14 (默认)')).toBeInTheDocument();
    });
  });

  it('responds to pdfcraft-print-requested message posted by viewer iframe', async () => {
    vi.spyOn(tauriBridge, 'isTauri').mockReturnValue(true);
    vi.spyOn(tauriBridge, 'getSystemPrinters').mockResolvedValue([
      { name: 'Office Printer', is_default: true, port_name: 'NET' },
    ]);

    render(<PDFReaderTool />);
    fireEvent.click(screen.getByTestId('mock-uploader'));

    await waitFor(() => {
      expect(screen.getByText('sample.pdf')).toBeInTheDocument();
    });

    // Simulate postMessage event from viewer iframe
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'pdfcraft-print-requested' },
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('打印文档')).toBeInTheDocument();
      expect(screen.getByText('Office Printer (默认)')).toBeInTheDocument();
    });
  });

  it('exports PDF.js serialized annotations rather than the originally selected file', async () => {
    const saveDocument = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    const save = vi.spyOn(tauriBridge, 'saveBlobFile').mockResolvedValue(true);
    render(<PDFReaderTool />);
    fireEvent.click(screen.getByTestId('mock-uploader'));
    const frame = screen.getByTitle('sample.pdf') as HTMLIFrameElement;
    Object.defineProperty(frame, 'contentWindow', { value: { PDFViewerApplication: { pdfDocument: { saveDocument } } }, configurable: true });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(saveDocument).toHaveBeenCalledOnce();
    const exported = save.mock.calls[0][0] as Blob;
    expect(exported).toBeInstanceOf(Blob);
    expect(exported.size).toBe(4);
    expect(exported.type).toBe('application/pdf');
    expect(save.mock.calls[0][1]).toBe('sample.pdf');
  });

  it('shows serialization errors without exporting the unannotated original', async () => {
    const save = vi.spyOn(tauriBridge, 'saveBlobFile').mockResolvedValue(true);
    render(<PDFReaderTool />);
    fireEvent.click(screen.getByTestId('mock-uploader'));
    const frame = screen.getByTitle('sample.pdf') as HTMLIFrameElement;
    Object.defineProperty(frame, 'contentWindow', { value: { PDFViewerApplication: { pdfDocument: { saveDocument: vi.fn().mockRejectedValue(new Error('Serialization failed')) } } }, configurable: true });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Serialization failed'));
    expect(save).not.toHaveBeenCalled();
  });

  it('accepts save requests only from the current same-origin reader frame', async () => {
    const save = vi.spyOn(tauriBridge, 'saveBlobFile').mockResolvedValue(true);
    const viewer = { PDFViewerApplication: { pdfDocument: { saveDocument: vi.fn().mockResolvedValue(new Uint8Array([1])) } } };
    render(<PDFReaderTool />);
    fireEvent.click(screen.getByTestId('mock-uploader'));
    Object.defineProperty(screen.getByTitle('sample.pdf'), 'contentWindow', { value: viewer, configurable: true });
    const message = { type: 'foliokit-reader-save-requested' };
    act(() => window.dispatchEvent(new MessageEvent('message', { data: message, origin: 'https://unrelated.example', source: viewer as unknown as Window })));
    act(() => window.dispatchEvent(new MessageEvent('message', { data: message, origin: window.location.origin, source: window })));
    expect(save).not.toHaveBeenCalled();
    act(() => window.dispatchEvent(new MessageEvent('message', { data: message, origin: window.location.origin, source: viewer as unknown as Window })));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
  });

  it('keeps a modified Android reader open when closing is cancelled', async () => {
    vi.stubEnv('NEXT_PUBLIC_ANDROID_BUILD', 'true');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PDFReaderTool />);
    fireEvent.click(screen.getByTestId('mock-uploader'));
    Object.defineProperty(screen.getByTitle('sample.pdf'), 'contentWindow', { value: { PDFViewerApplication: { _hasAnnotationEditors: true } }, configurable: true });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByTitle('sample.pdf')).toBeInTheDocument();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByTestId('mock-uploader')).toBeInTheDocument();
  });

  it('uses Android Back to close settings before closing the document and removes its listener', async () => {
    vi.stubEnv('NEXT_PUBLIC_ANDROID_BUILD', 'true');
    vi.spyOn(androidBridge, 'isAndroidApp').mockReturnValue(true);
    const remove = vi.fn().mockResolvedValue(undefined);
    vi.mocked(App.addListener).mockResolvedValue({ remove });
    render(<PDFReaderTool />);
    fireEvent.click(screen.getByTestId('mock-uploader'));
    const closePanel = vi.fn().mockReturnValue(true);
    Object.defineProperty(screen.getByTitle('sample.pdf'), 'contentWindow', { value: { foliokitReaderClosePanel: closePanel }, configurable: true });
    await waitFor(() => expect(App.addListener).toHaveBeenCalledOnce());
    const back = vi.mocked(App.addListener).mock.calls[0][1] as unknown as () => void;
    act(() => back());
    expect(closePanel).toHaveBeenCalledOnce();
    expect(screen.getByTitle('sample.pdf')).toBeInTheDocument();
    closePanel.mockReturnValue(false);
    act(() => back());
    expect(screen.getByTestId('mock-uploader')).toBeInTheDocument();
    await waitFor(() => expect(remove).toHaveBeenCalledOnce());
  });
});
