'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

type UnlockResponse = {
  slug: string;
  title: string;
  content?: string;
  createdAt: string;
  isPrivate: boolean;
};

export function UnlockBySecretForm() {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!secret.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/entries/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: secret.trim() }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: 'Не удалось открыть текст' }));
          throw new Error(data.message ?? 'Не удалось открыть текст');
        }

        const entry = (await response.json()) as UnlockResponse;
        const storageKey = `textdrop-entry-${entry.slug}`;
        if (entry.content) {
          sessionStorage.setItem(storageKey, JSON.stringify(entry));
        }
        router.push(`/entries/${entry.slug}?source=secret`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось открыть текст');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, router, secret],
  );

  return (
    <div className="rounded-3xl bg-white/5 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
      <h3 className="text-lg font-semibold text-slate-100">Открыть приватный текст</h3>
      <p className="mt-1 text-sm text-slate-400">Введите секретный ключ, чтобы открыть скрытый текст, даже без ссылки.</p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <input
          name="secret"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder="Секретный ключ"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:bg-white/10"
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={!secret.trim() || isLoading}
          className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900/40"
        >
          {isLoading ? 'Открываем...' : 'Открыть текст'}
        </button>
      </form>
    </div>
  );
}
