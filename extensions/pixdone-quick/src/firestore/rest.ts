/// <reference types="chrome" />
/**
 * Firestore REST API client, intended to run in the background service worker
 * (extension-privileged origin). Reads the Firebase ID token from chrome.storage
 * and attaches it as a Bearer credential on every call.
 */
import {
  type FirestoreDocument,
  toFirestoreFields,
  fromFirestoreDoc,
} from './serializer';

const PROJECT_ID = 'red-girder-465715-n6';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export interface StoredAuth {
  idToken: string;
  uid: string;
}

async function getAuth(): Promise<StoredAuth | null> {
  const { pixdoneAuth } = await chrome.storage.local.get('pixdoneAuth');
  const a = pixdoneAuth as { idToken?: string; uid?: string } | undefined;
  if (!a?.idToken || !a.uid) return null;
  return { idToken: a.idToken, uid: a.uid };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = await getAuth();
  if (!auth) throw new Error('not_authenticated');
  const headers = new Headers(init.headers ?? {});
  headers.set('Authorization', `Bearer ${auth.idToken}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const method = init.method ?? 'GET';
  console.log(`[PixDone Quick/fs] ${method} ${path}`, init.body);
  const resp = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error(`[PixDone Quick/fs] ${method} ${path} failed: ${resp.status}`, text);
    throw new Error(`firestore ${method} ${path}: ${resp.status} ${text}`);
  }
  console.log(`[PixDone Quick/fs] ${method} ${path} ok (${resp.status})`);
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

/** Run a structured query, returning hydrated plain JS documents. */
export async function runQuery(
  collection: string,
  filter: { fieldPath: string; op: 'EQUAL'; value: string },
): Promise<Array<Record<string, unknown> & { id: string }>> {
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: filter.fieldPath },
          op: filter.op,
          value: { stringValue: filter.value },
        },
      },
    },
  };
  type QueryResult = Array<{ document?: FirestoreDocument }>;
  const rows = await request<QueryResult>(':runQuery', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return rows
    .filter((r): r is { document: FirestoreDocument } => !!r.document)
    .map((r) => fromFirestoreDoc(r.document));
}

export async function createDocument(
  collection: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown> & { id: string }> {
  const body = { fields: toFirestoreFields(data) };
  const doc = await request<FirestoreDocument>(`/${collection}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return fromFirestoreDoc(doc);
}

/**
 * Patch (merge-update) specific fields of a document. Only the keys you pass
 * are written; other fields are left untouched (thanks to `updateMask`).
 */
export async function updateDocument(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown> & { id: string }> {
  const keys = Object.keys(data);
  const params = new URLSearchParams();
  for (const k of keys) params.append('updateMask.fieldPaths', k);
  const body = { fields: toFirestoreFields(data) };
  const doc = await request<FirestoreDocument>(`/${collection}/${docId}?${params.toString()}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return fromFirestoreDoc(doc);
}

export async function deleteDocument(collection: string, docId: string): Promise<void> {
  await request<void>(`/${collection}/${docId}`, { method: 'DELETE' });
}
