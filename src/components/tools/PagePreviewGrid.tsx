'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { configurePdfjsWorker } from '@/lib/pdf/loader';
import { isAndroidApp } from '@/lib/android-bridge';
import translations from '@/lib/mobile-preview-labels.json';

interface PreviewDocument { file?: File | null; pageNumber: number; rotation?: number }
interface Props {
  children: React.ReactNode;
  className?: string;
  file?: File | null;
  documents?: PreviewDocument[];
}
const preference = 'foliokit-page-preview-columns';

/** Shared mobile sizing and explicit inspection; inspecting never changes selection. */
export function PagePreviewGrid({ children, className = '', file, documents }: Props) {
  const android = process.env.NEXT_PUBLIC_ANDROID_BUILD === 'true';
  const locale = useLocale();
  const labels = translations[locale as keyof typeof translations] || translations.en;
  const [columns, setColumns] = useState(2);
  const [inspection, setInspection] = useState<PreviewDocument | null>(null);
  const close = useCallback(() => setInspection(null), []);
  useEffect(() => {
    if (!android) return;
    try {
      const stored = Number(localStorage.getItem(preference));
      if ([1, 2, 3].includes(stored)) setColumns(stored);
    } catch { /* Sizing still works when storage is unavailable. */ }
  }, [android]);
  const resize = (next: number) => {
    setColumns(next);
    try { localStorage.setItem(preference, String(next)); } catch { /* Optional preference. */ }
  };
  if (!android) return <div className={className}>{children}</div>;
  return <div className="foliokit-page-previews" style={{ '--foliokit-page-columns': columns } as React.CSSProperties}>
    <div className="foliokit-page-controls" role="group" aria-label={labels.size}>
      <span>{labels.size}</span>
      <div>
        <button type="button" onClick={() => resize(columns + 1)} disabled={columns === 3} aria-label={labels.smaller}>−</button>
        <span aria-live="polite">{labels.columns}: {columns}</span>
        <button type="button" onClick={() => resize(columns - 1)} disabled={columns === 1} aria-label={labels.larger}>+</button>
      </div>
    </div>
    <div className={`${className} foliokit-page-grid`}>
      {React.Children.toArray(children).map((child, index) => {
        const document = documents?.[index] || { file, pageNumber: index + 1 };
        return <div className="foliokit-page-tile" key={React.isValidElement(child) ? child.key : index}>
          {child}
          {document.file && <button type="button" className="foliokit-page-zoom" aria-label={`${labels.view} ${document.pageNumber}`}
            onClick={event => { event.stopPropagation(); setInspection(document); }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M10 7v6m-3-3h6"/></svg>
          </button>}
        </div>;
      })}
    </div>
    {inspection?.file && createPortal(<PageInspection {...inspection} file={inspection.file} onClose={close}/>, document.body)}
  </div>;
}

function PageInspection({ file, pageNumber, rotation = 0, onClose }: PreviewDocument & { file: File; onClose: () => void }) {
  const locale = useLocale();
  const labels = translations[locale as keyof typeof translations] || translations.en;
  const dialog = useRef<HTMLDialogElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(300);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    const focused = document.activeElement as HTMLElement | null;
    node?.showModal();
    let cancelled = false;
    let remove: (() => Promise<void>) | undefined;
    if (isAndroidApp()) void import('@capacitor/app').then(async ({ App }) => {
      const handle = await App.addListener('backButton', onClose);
      if (cancelled) await handle.remove();
      else remove = () => handle.remove();
    });
    return () => { cancelled = true; void remove?.(); node?.close(); focused?.focus(); };
  }, [onClose]);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const measure = () => setWidth(Math.max(120, node.clientWidth - 24));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<typeof import('pdfjs-dist').getDocument> | undefined;
    void (async () => {
      try {
        const library = await import('pdfjs-dist');
        configurePdfjsWorker(library);
        const data = await file.arrayBuffer();
        if (cancelled) return;
        task = library.getDocument({ data });
        const loaded = await task.promise;
        if (!cancelled) setPdf(loaded);
      } catch { if (!cancelled) { setError(true); setBusy(false); } }
    })();
    return () => { cancelled = true; void task?.destroy().catch(() => {}); };
  }, [file]);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let cancelled = false;
    let render: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    setBusy(true);
    void (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled || !canvas.current) return;
        const angle = ((page.rotate + rotation) % 360 + 360) % 360;
        const base = page.getViewport({ scale: 1, rotation: angle });
        const scale = width / base.width * zoom;
        const logical = page.getViewport({ scale, rotation: angle });
        // Bound the backing bitmap while keeping zoomed content scrollable.
        const density = Math.min(devicePixelRatio || 1, 2, Math.sqrt(4_000_000 / (logical.width * logical.height)));
        const viewport = page.getViewport({ scale: scale * density, rotation: angle });
        const node = canvas.current;
        node.width = Math.ceil(viewport.width); node.height = Math.ceil(viewport.height);
        node.style.width = `${logical.width}px`; node.style.height = `${logical.height}px`;
        const context = node.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        render = page.render({ canvasContext: context, viewport });
        await render.promise;
        if (!cancelled) setBusy(false);
      } catch { if (!cancelled) { setError(true); setBusy(false); } }
    })();
    return () => { cancelled = true; render?.cancel(); };
  }, [pdf, pageNumber, rotation, zoom, width]);
  return <dialog ref={dialog} className="foliokit-page-dialog" dir={['ar', 'he'].includes(locale) ? 'rtl' : 'ltr'} aria-label={`${labels.view} ${pageNumber}`}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><strong>{labels.view} {pageNumber}</strong><button type="button" onClick={onClose} aria-label={labels.close}>✕</button></header>
    <div className="foliokit-inspection-controls">
      <button type="button" onClick={() => setZoom(value => Math.max(.75, value - .25))} disabled={zoom <= .75} aria-label={labels.zoomOut}>−</button>
      <button type="button" onClick={() => setZoom(1)} aria-label={labels.fit}>{Math.round(zoom * 100)}%</button>
      <button type="button" onClick={() => setZoom(value => Math.min(3, value + .25))} disabled={zoom >= 3} aria-label={labels.zoomIn}>+</button>
    </div>
    <div ref={container} className="foliokit-inspection-content">
      {busy && !error && <p role="status">{labels.loading}</p>}
      {error && <p role="alert">{labels.error}</p>}
      <canvas ref={canvas} aria-label={`${labels.view} ${pageNumber}`} hidden={error}/>
    </div>
  </dialog>;
}
