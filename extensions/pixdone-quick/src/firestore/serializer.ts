/**
 * Firestore REST value serializer / deserializer.
 *
 * Firestore's REST API wraps every field in a type tag: `{ "title": { "stringValue": "foo" } }`.
 * This module converts between that wire shape and plain JS objects so callers
 * work with ergonomic data.
 *
 * Spec: https://cloud.google.com/firestore/docs/reference/rest/v1/Value
 */

export type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string | number }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

export interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

/** JS value → Firestore REST value */
export function toFirestoreValue(v: unknown): FirestoreValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return { integerValue: String(v) };
    return { doubleValue: v };
  }
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toFirestoreValue) } };
  }
  if (typeof v === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val === undefined) continue;
      fields[k] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  // Fallback (bigint, function, symbol): stringify
  return { stringValue: String(v) };
}

/** Firestore REST value → JS value */
export function fromFirestoreValue(v: FirestoreValue | undefined): unknown {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('integerValue' in v) {
    const n = typeof v.integerValue === 'string' ? Number(v.integerValue) : v.integerValue;
    return Number.isFinite(n) ? n : 0;
  }
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue; // keep ISO string — callers parse as needed
  if ('arrayValue' in v) {
    const values = v.arrayValue.values ?? [];
    return values.map((it) => fromFirestoreValue(it));
  }
  if ('mapValue' in v) {
    const out: Record<string, unknown> = {};
    const fields = v.mapValue.fields ?? {};
    for (const [k, val] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(val);
    }
    return out;
  }
  return undefined;
}

/** Serialize a plain JS object into the `fields` shape used by Firestore REST requests. */
export function toFirestoreFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const out: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = toFirestoreValue(v);
  }
  return out;
}

/** Deserialize a Firestore document into a plain JS object, injecting `id` from the path. */
export function fromFirestoreDoc(doc: FirestoreDocument): Record<string, unknown> & { id: string } {
  const fields = doc.fields ?? {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = fromFirestoreValue(v);
  }
  // document path: projects/.../documents/<collection>/<docId>
  const id = doc.name.split('/').pop() ?? '';
  return { ...out, id };
}
