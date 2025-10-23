'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type EntryView = {
  slug: string;
  title: string;
  createdAt: string;
  isPrivate: boolean;
  content?: string;
};

type Props = {
  initialEntry: EntryView;
};

export function EntryViewClient({ initialEntry }: Props) {
  const router = useRouter();
  const [entry, setEntry] = useState<EntryView>(initialEntry);
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const hasContent = Boolean(entry.content);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(entry.createdAt)),
    [entry.createdAt],
  );

  useEffect(() => {
    if (hasContent) {
      const storageKey = `textdrop-entry-${entry.slug}`;
      sessionStorage.removeItem(storageKey);
    }
  }, [entry.slug, hasContent]);

  const { slug, isPrivate, content } = entry;

  useEffect(() => {
    if (isPrivate && !content) {
      const storageKey = `textdrop-entry-${slug}`;
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as EntryView;
          setEntry((prev) => ({ ...prev, content: parsed.content }));
        } catch (err) {
          console.error('Failed to parse cached entry', err);
          sessionStorage.removeItem(storageKey);
        }
      }
    }
  }, [content, isPrivate, slug]);

  const handleUnlock = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!secret.trim() || isUnlocking) return;

      setIsUnlocking(true);
      setError(null);

      try {
        const response = await fetch(`/api/entries/${entry.slug}/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: secret.trim() }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: 'Не удалось открыть текст' }));
          throw new Error(data.message ?? 'Не удалось открыть текст');
        }

        const unlocked = (await response.json()) as EntryView;
        setEntry(unlocked);
        setSecret('');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось открыть текст');
      } finally {
        setIsUnlocking(false);
      }
    },
    [entry.slug, isUnlocking, router, secret],
  );

  const handleCopy = useCallback(async () => {
    if (!entry.content) return;
    try {
      await navigator.clipboard.writeText(entry.content);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Clipboard error', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [entry.content]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16 text-slate-100">
      <div className="mx-auto max-w-4xl px-6 md:px-10">
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.35em] text-slate-400 transition hover:text-slate-200"
          >
            Textdrop
          </Link>
          <h1 className="text-3xl font-semibold md:text-4xl">{entry.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span>{formattedDate}</span>
            {entry.isPrivate ? <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-amber-300/90">Приватно</span> : <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-emerald-300/90">Публично</span>}
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          {hasContent ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Содержимое</span>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
                  >
                    Скопировать
                  </button>
                  {copyStatus === 'copied' && <span className="text-sm text-emerald-300">Скопировано</span>}
                  {copyStatus === 'error' && <span className="text-sm text-rose-400">Не удалось скопировать</span>}
                </div>
              </div>
              <pre className="whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/20 p-5 text-base leading-7 text-slate-100">
                {entry.content}
              </pre>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-slate-300">
                Этот текст защищён секретным ключом. Введите его ниже, чтобы открыть содержимое.
              </p>
              <form className="space-y-4" onSubmit={handleUnlock}>
                <input
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                  placeholder="Секретный ключ"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:bg-white/10"
                />
                {error && <p className="text-sm text-rose-400">{error}</p>}
                <button
                  type="submit"
                  disabled={!secret.trim() || isUnlocking}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900/40"
                >
                  {isUnlocking ? 'Открываем...' : 'Открыть текст'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
