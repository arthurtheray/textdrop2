import { ObjectId } from 'mongodb';

export interface EntryRecord {
  _id?: ObjectId;
  slug: string;
  title: string;
  content: string;
  isPrivate: boolean;
  secretHash?: string;
  secretLookup?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntryPayload {
  title: string;
  content: string;
  secret?: string | null;
}

export interface PublicEntrySummary {
  slug: string;
  title: string;
  createdAt: string;
}

export interface EntryResponse {
  slug: string;
  title: string;
  content?: string;
  createdAt: string;
  isPrivate: boolean;
}
