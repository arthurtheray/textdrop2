import { notFound } from 'next/navigation';

import { EntryViewClient } from '@/components/EntryViewClient';
import { getEntrySummary } from '@/lib/entries';

export const dynamic = 'force-dynamic';

export default async function EntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getEntrySummary(slug);

  if (!entry) {
    notFound();
  }

  return <EntryViewClient initialEntry={entry} />;
}
