import { NextResponse } from 'next/server';

import { getEntrySummary } from '@/lib/entries';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Next.js build expects promise-wrapped params
export async function GET(_request: Request, { params }: any) {
  try {
    const entry = await getEntrySummary(params.slug);

    if (!entry) {
      return NextResponse.json({ message: 'Текст не найден' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error(`Failed to fetch entry ${params.slug}`, error);
    return NextResponse.json({ message: 'Не удалось загрузить текст' }, { status: 500 });
  }
}
