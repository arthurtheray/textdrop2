'use client';

import { useCallback, useMemo, useState } from 'react';

type CreateEntryResponse = {
  slug: string;
  title: string;
  content: string;
  isPrivate: boolean;
  secretRequired: boolean;
  createdAt: string;
};

type Props = {
  onCreated?: () => void;
};

const initialForm = {
  title: '',
  content: '',
  secret: '',
};

export function CreateEntryForm({ onCreated }: Props) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateEntryResponse | null>(null);

  const hasSecret = form.secret.trim().length > 0;

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && form.content.trim().length > 0;
  }, [form.title, form.content]);

  const shareUrl = useMemo(() => {
    if (!result) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/entries/${result.slug}`;
  }, [result]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setForm(initialForm);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSubmit || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content.trim(),
            secret: form.secret.trim() || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: 'Неизвестная ошибка' }));
          throw new Error(data.message ?? 'Неизвестная ошибка');
        }

        const data = (await response.json()) as CreateEntryResponse;
        setResult(data);
        onCreated?.();
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось сохранить текст');
      } finally {
        setIsSubmitting(false);
      }
    },
    [canSubmit, form.content, form.secret, form.title, isSubmitting, onCreated, resetForm],
  );

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      console.error('Clipboard error', err);
    }
  }, [shareUrl]);

  return (
    <div className="rounded-3xl bg-white/5 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Новый текст</h2>
          <p className="mt-1 text-sm text-slate-400">Добавьте описание, текст и при необходимости секретный ключ</p>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title" className="text-sm font-medium text-slate-200">
            Описание
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Например: Заметка для статьи"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:bg-white/10"
          />
        </div>

        <div>
          <label htmlFor="content" className="text-sm font-medium text-slate-200">
            Текст
          </label>
          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Вставьте или напишите текст..."
            rows={8}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:bg-white/10"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="secret" className="text-sm font-medium text-slate-200">
              Секретный ключ (опционально)
            </label>
            <span className="text-xs text-slate-400">{hasSecret ? 'Будет создан приватный текст' : 'Текст станет общедоступным'}</span>
          </div>
          <input
            id="secret"
            name="secret"
            value={form.secret}
            onChange={handleChange}
            placeholder="Минимум 4 символа"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:bg-white/10"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-900/40"
        >
          {isSubmitting ? 'Сохраняем...' : 'Сохранить текст'}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
          <p className="font-medium">Текст сохранён</p>
          <p className="mt-1 text-slate-400">Ссылка: {shareUrl}</p>
          {result.secretRequired ? (
            <p className="mt-2 text-slate-300">Не забудьте секретный ключ — без него открыть текст не получится.</p>
          ) : (
            <p className="mt-2 text-slate-300">Этот текст доступен по ссылке всем, у кого она есть.</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopy}
              type="button"
              className="rounded-xl border border-white/10 px-3 py-2 text-xs uppercase tracking-wide text-slate-100 transition hover:border-indigo-300 hover:text-indigo-200"
            >
              Скопировать ссылку
            </button>
            <a
              href={shareUrl}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs uppercase tracking-wide text-slate-100 transition hover:border-indigo-300 hover:text-indigo-200"
            >
              Открыть текст
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
