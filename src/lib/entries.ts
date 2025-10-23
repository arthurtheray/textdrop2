import { Collection } from 'mongodb';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { getDb } from './db';
import { createSecret, fingerprintSecret, verifySecret } from './secrets';
import type {
  CreateEntryPayload,
  EntryRecord,
  EntryResponse,
  PublicEntrySummary,
} from '@/types/entry';

const collectionName = 'entries';

const createEntrySchema = z.object({
  title: z.string().trim().min(1, 'Описание обязательно'),
  content: z.string().trim().min(1, 'Текст обязателен'),
  secret: z.string().trim().min(4, 'Минимум 4 символа').max(128).optional(),
});

function getCollection(): Promise<Collection<EntryRecord>> {
  return getDb().then((db) => db.collection<EntryRecord>(collectionName));
}

async function generateUniqueSlug(collection: Collection<EntryRecord>): Promise<string> {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const slug = nanoid(8);
    const existing = await collection.findOne({ slug });
    if (!existing) {
      return slug;
    }
  }

  throw new Error('Не удалось создать уникальный идентификатор, попробуйте ещё раз');
}

function mapToResponse(entry: EntryRecord, includeContent: boolean): EntryResponse {
  return {
    slug: entry.slug,
    title: entry.title,
    createdAt: entry.createdAt.toISOString(),
    isPrivate: entry.isPrivate,
    content: includeContent ? entry.content : undefined,
  };
}

export async function createEntry(payload: CreateEntryPayload): Promise<EntryResponse & { secretRequired: boolean }> {
  const parsed = createEntrySchema.safeParse({
    title: payload.title,
    content: payload.content,
    secret: payload.secret ?? undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Некорректные данные';
    throw new Error(message);
  }

  const { title, content, secret } = parsed.data;
  const collection = await getCollection();
  const slug = await generateUniqueSlug(collection);

  const baseRecord: Omit<EntryRecord, '_id'> = {
    slug,
    title,
    content,
    isPrivate: Boolean(secret),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (secret) {
    const { hash, lookup } = await createSecret(secret);
    baseRecord.secretHash = hash;
    baseRecord.secretLookup = lookup;
  }

  const insertResult = await collection.insertOne(baseRecord);

  if (!insertResult.acknowledged) {
    throw new Error('Не удалось сохранить текст, попробуйте ещё раз');
  }

  return {
    slug,
    title,
    content,
    createdAt: baseRecord.createdAt.toISOString(),
    isPrivate: baseRecord.isPrivate,
    secretRequired: baseRecord.isPrivate,
  };
}

export async function listPublicEntries(limit = 20): Promise<PublicEntrySummary[]> {
  const collection = await getCollection();
  const cursor = collection
    .find({ isPrivate: false })
    .sort({ createdAt: -1 })
    .limit(limit);

  const entries = await cursor.toArray();

  return entries.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    createdAt: entry.createdAt.toISOString(),
  }));
}

export async function findEntry(slug: string): Promise<EntryRecord | null> {
  const collection = await getCollection();
  return collection.findOne({ slug });
}

export async function getEntrySummary(slug: string): Promise<EntryResponse | null> {
  const entry = await findEntry(slug);

  if (!entry) {
    return null;
  }

  return mapToResponse(entry, !entry.isPrivate);
}

export async function getProtectedEntry(slug: string, secret: string): Promise<EntryResponse | null> {
  const entry = await findEntry(slug);

  if (!entry || !entry.isPrivate || !entry.secretHash) {
    return null;
  }

  const isValid = await verifySecret(secret, entry.secretHash);

  if (!isValid) {
    return null;
  }

  await touchEntry(slug);

  return mapToResponse(entry, true);
}

export async function unlockEntryBySecret(secret: string): Promise<EntryResponse | null> {
  const collection = await getCollection();
  const lookup = fingerprintSecret(secret);
  const entry = await collection.findOne({ secretLookup: lookup });

  if (!entry || !entry.secretHash) {
    return null;
  }

  const isValid = await verifySecret(secret, entry.secretHash);
  if (!isValid) {
    return null;
  }

  await touchEntry(entry.slug);

  return mapToResponse(entry, true);
}

export async function touchEntry(slug: string) {
  const collection = await getCollection();
  await collection.updateOne(
    { slug },
    { $set: { updatedAt: new Date() } },
  );
}
