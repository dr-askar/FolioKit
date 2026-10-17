'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { withBasePath } from '@/lib/utils/path';

/** Android loads one shared message file per locale instead of embedding it in every route. */
export function AndroidIntlProvider({ locale, children }: { locale: string; children: React.ReactNode }) {
  const [loaded, setLoaded] = useState<{ locale: string; messages: AbstractIntlMessages } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    fetch(withBasePath(`/android-messages/${locale}.json`), { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Language file unavailable: ${response.status}`);
        return response.json();
      })
      .then(messages => { if (!controller.signal.aborted) setLoaded({ locale, messages }); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [locale, attempt]);

  if (loaded?.locale !== locale) {
    return <div role="status" className="p-6 text-center">
      {failed ? <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry / إعادة المحاولة</button> : 'FolioKit…'}
    </div>;
  }
  return <NextIntlClientProvider locale={locale} timeZone="UTC" messages={loaded.messages}>{children}</NextIntlClientProvider>;
}
