'use client';

import { useCallback, useMemo, useState } from 'react';

import { CreateEntryForm } from './CreateEntryForm';
import { PublicEntriesPanel } from './PublicEntriesPanel';
import { UnlockBySecretForm } from './UnlockBySecretForm';

export function HomePageClient() {
  const [refreshToken, setRefreshToken] = useState<string>('init');

  const handleCreated = useCallback(() => {
    setRefreshToken(`${Date.now()}`);
  }, []);

  const gradientClass = useMemo(
    () =>
      'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100',
    [],
  );

  return (
    <div className={gradientClass}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:px-10 lg:px-12">
        <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Textdrop</span>
          <h1 className="text-3xl font-semibold text-slate-100 md:text-4xl">
            Быстрый обмен текстом между устройствами
          </h1>
          <p className="max-w-3xl text-sm text-slate-300 md:text-base">
            Сохраняйте заметки, ссылки, черновики и любые фрагменты текста. Публичные записи сразу появляются в списке, приватные защищаются секретным ключом и доступны только вам.
          </p>
        </header>

        <main className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-8">
            <CreateEntryForm onCreated={handleCreated} />
            <UnlockBySecretForm />
          </div>
          <div>
            <PublicEntriesPanel refreshToken={refreshToken} />
          </div>
        </main>
      </div>
    </div>
  );
}
