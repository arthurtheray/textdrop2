import { NextResponse } from 'next/server';

import { createEntry, listPublicEntries } from '@/lib/entries';
import type { CreateEntryPayload } from '@/types/entry';

export async function GET() {
  try {
    const entries = await listPublicEntries();
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Failed to fetch entries', error);
    return NextResponse.json({ message: 'Не удалось загрузить тексты' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateEntryPayload;
    const entry = await createEntry(payload);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сохранить текст';
    const status = message.includes('обязател') ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
