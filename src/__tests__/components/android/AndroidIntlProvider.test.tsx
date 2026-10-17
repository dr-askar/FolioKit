import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { AndroidIntlProvider } from '@/components/android/AndroidIntlProvider';

function Greeting() {
  const t = useTranslations('common');
  return <p>{t('greeting')}</p>;
}

afterEach(() => vi.unstubAllGlobals());

describe('Android shared translations', () => {
  it('loads a bundled Arabic message file and provides actual translations', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ common: { greeting: 'مرحباً' } }) });
    vi.stubGlobal('fetch', fetcher);
    render(<AndroidIntlProvider locale="ar"><Greeting /></AndroidIntlProvider>);
    expect(await screen.findByText('مرحباً')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith('/android-messages/ar.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('offers a retry if the bundled file cannot load', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ common: { greeting: 'Hello' } }) });
    vi.stubGlobal('fetch', fetcher);
    render(<AndroidIntlProvider locale="en"><Greeting /></AndroidIntlProvider>);
    fireEvent.click(await screen.findByRole('button', { name: /Retry/ }));
    expect(await screen.findByText('Hello')).toBeInTheDocument();
  });

  it('does not show the previous language while a new locale loads', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ common: { greeting: 'Hello' } }) })
      .mockImplementationOnce(() => new Promise(() => {}));
    vi.stubGlobal('fetch', fetcher);
    const { rerender } = render(<AndroidIntlProvider locale="en"><Greeting /></AndroidIntlProvider>);
    await screen.findByText('Hello');
    rerender(<AndroidIntlProvider locale="ar"><Greeting /></AndroidIntlProvider>);
    await waitFor(() => expect(screen.queryByText('Hello')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('FolioKit');
  });
});
