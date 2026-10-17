import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PagePreviewGrid } from '@/components/tools/PagePreviewGrid';
import { App } from '@capacitor/app';
import { getDocument } from 'pdfjs-dist';
vi.mock('next-intl', () => ({ useLocale: () => 'en' }));
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn() } }));
vi.mock('@/lib/android-bridge', () => ({ isAndroidApp: () => true }));
vi.mock('pdfjs-dist', () => ({ getDocument: vi.fn(), GlobalWorkerOptions: {} }));
describe('Mobile page inspection', () => {
  const file = new File(['pdf'], 'test.pdf', { type:'application/pdf' });
  let destroy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_ANDROID_BUILD','true');
    vi.clearAllMocks(); localStorage.clear();
    destroy=vi.fn().mockResolvedValue(undefined);
    vi.mocked(getDocument).mockReturnValue({promise:new Promise(()=>{}),destroy} as never);
    Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:vi.fn(function(this: HTMLDialogElement){this.setAttribute('open','');})});
    Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:vi.fn(function(this: HTMLDialogElement){this.removeAttribute('open');})});
    Object.defineProperty(file,'arrayBuffer',{configurable:true,value:vi.fn().mockResolvedValue(new ArrayBuffer(1))});
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
  it('inspects without toggling page selection and removes the native Back listener on close', async () => {
    let back: (()=>void)|undefined; const remove=vi.fn().mockResolvedValue(undefined); const toggle=vi.fn();
    vi.mocked(App.addListener).mockImplementation(async (_name,callback)=>{back=callback as ()=>void;return {remove};});
    render(<PagePreviewGrid file={file}><button aria-pressed="true" onClick={toggle}>Page 1 selected</button></PagePreviewGrid>);
    fireEvent.click(screen.getByRole('button',{name:'View page 1'}));
    await waitFor(()=>expect(App.addListener).toHaveBeenCalled());
    await waitFor(()=>expect(getDocument).toHaveBeenCalled());
    expect(toggle).not.toHaveBeenCalled();
    expect(screen.getByRole('button',{name:'Page 1 selected',hidden:true})).toHaveAttribute('aria-pressed','true');
    await act(async()=>{back?.();});
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(remove).toHaveBeenCalledOnce(); expect(destroy).toHaveBeenCalledOnce();
  });
  it('removes a late Back listener if inspection closes while registration is pending', async () => {
    let resolve: (value: {remove:()=>Promise<void>})=>void=()=>{};
    const remove=vi.fn().mockResolvedValue(undefined);
    vi.mocked(App.addListener).mockReturnValue(new Promise(done=>{resolve=done;}) as never);
    render(<PagePreviewGrid file={file}><button>Page</button></PagePreviewGrid>);
    fireEvent.click(screen.getByRole('button',{name:'View page 1'}));
    await waitFor(()=>expect(App.addListener).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button',{name:'Close'}));
    await act(async()=>{resolve({remove});}); expect(remove).toHaveBeenCalledOnce();
  });
  it('keeps the chosen size across tool mounts', () => {
    const {unmount}=render(<PagePreviewGrid file={file}><button>Page</button></PagePreviewGrid>);
    fireEvent.click(screen.getByRole('button',{name:'Larger previews'})); unmount();
    render(<PagePreviewGrid file={file}><button>Page</button></PagePreviewGrid>);
    expect(screen.getByRole('button',{name:'Larger previews'})).toBeDisabled();
  });
  it('retains the original desktop grid without mobile controls', () => {
    vi.stubEnv('NEXT_PUBLIC_ANDROID_BUILD','false');
    render(<PagePreviewGrid file={file}><button>Page</button></PagePreviewGrid>);
    expect(screen.getByRole('button',{name:'Page'})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'View page 1'})).not.toBeInTheDocument();
  });
});
