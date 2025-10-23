import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getProtectedEntry } from '@/lib/entries';

const unlockSchema = z.object({
  secret: z.string().trim().min(4, 'Минимум 4 символа'),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Next.js build expects promise-wrapped params
export async function POST(request: Request, { params }: any) {
  try {
    const body = await request.json();
    const parsed = unlockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? 'Некорректный ключ' }, { status: 400 });
    }

    const entry = await getProtectedEntry(params.slug, parsed.data.secret);

    if (!entry) {
      return NextResponse.json({ message: 'Ключ не подошёл или текст не найден' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error(`Failed to unlock entry ${params.slug}`, error);
    return NextResponse.json({ message: 'Не удалось открыть текст' }, { status: 500 });
  }
}
