'use client';

import { useEffect, useMemo, useState } from 'react';

type PublicEntry = {
  slug: string;
  title: string;
  createdAt: string;
};

type Props = {
  refreshToken?: string;
};

export function PublicEntriesPanel({ refreshToken }: Props) {
  const [entries, setEntries] = useState<PublicEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadEntries() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/entries');
        if (!response.ok) {
          throw new Error('Не удалось загрузить тексты');
        }
        const data = await response.json();
        if (!ignore) {
          setEntries(data.entries ?? []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadEntries();

    return () => {
      ignore = true;
    };
  }, [refreshToken]);

  const formatter = useMemo(() => new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }), []);

  return (
    <div className="rounded-3xl bg-white/5 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Общедоступные тексты</h3>
        <span className="text-xs text-slate-400">последние 20</span>
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-400">Загружаем...</p>}
      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

      {!isLoading && entries.length === 0 && !error ? (
        <p className="mt-4 text-sm text-slate-400">Пока нет записей.</p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {entries.map((entry) => (
          <li key={entry.slug} className="group rounded-2xl border border-transparent bg-white/[0.02] transition hover:border-indigo-400/60 hover:bg-white/10">
            <a href={`/entries/${entry.slug}`} className="block px-4 py-3">
              <p className="text-sm font-medium text-slate-100 group-hover:text-white">{entry.title}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                {formatter.format(new Date(entry.createdAt))}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
