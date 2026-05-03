import { describe, it, expect } from 'vitest';
import {
  toFirestoreValue,
  fromFirestoreValue,
  toFirestoreFields,
  fromFirestoreDoc,
} from './serializer';

describe('toFirestoreValue', () => {
  it('encodes strings', () => {
    expect(toFirestoreValue('hi')).toEqual({ stringValue: 'hi' });
  });
  it('encodes booleans', () => {
    expect(toFirestoreValue(true)).toEqual({ booleanValue: true });
    expect(toFirestoreValue(false)).toEqual({ booleanValue: false });
  });
  it('encodes null and undefined as nullValue', () => {
    expect(toFirestoreValue(null)).toEqual({ nullValue: null });
    expect(toFirestoreValue(undefined)).toEqual({ nullValue: null });
  });
  it('encodes integers as integerValue (stringified)', () => {
    expect(toFirestoreValue(42)).toEqual({ integerValue: '42' });
    expect(toFirestoreValue(0)).toEqual({ integerValue: '0' });
  });
  it('encodes floats as doubleValue', () => {
    expect(toFirestoreValue(3.14)).toEqual({ doubleValue: 3.14 });
  });
  it('encodes Date as timestampValue (ISO)', () => {
    const d = new Date('2026-04-20T10:00:00.000Z');
    expect(toFirestoreValue(d)).toEqual({ timestampValue: '2026-04-20T10:00:00.000Z' });
  });
  it('encodes arrays recursively', () => {
    expect(toFirestoreValue(['a', 1])).toEqual({
      arrayValue: {
        values: [{ stringValue: 'a' }, { integerValue: '1' }],
      },
    });
  });
  it('encodes plain objects as mapValue, skipping undefined', () => {
    expect(toFirestoreValue({ a: 1, b: undefined, c: 'x' })).toEqual({
      mapValue: {
        fields: {
          a: { integerValue: '1' },
          c: { stringValue: 'x' },
        },
      },
    });
  });
});

describe('fromFirestoreValue', () => {
  it('decodes each primitive type', () => {
    expect(fromFirestoreValue({ stringValue: 'hi' })).toBe('hi');
    expect(fromFirestoreValue({ booleanValue: true })).toBe(true);
    expect(fromFirestoreValue({ nullValue: null })).toBeNull();
    expect(fromFirestoreValue({ integerValue: '42' })).toBe(42);
    expect(fromFirestoreValue({ doubleValue: 3.14 })).toBe(3.14);
  });
  it('keeps timestamps as ISO strings', () => {
    expect(fromFirestoreValue({ timestampValue: '2026-04-20T10:00:00.000Z' })).toBe(
      '2026-04-20T10:00:00.000Z',
    );
  });
  it('decodes arrays', () => {
    expect(
      fromFirestoreValue({
        arrayValue: {
          values: [{ stringValue: 'a' }, { integerValue: '1' }],
        },
      }),
    ).toEqual(['a', 1]);
  });
  it('decodes mapValue back to plain object', () => {
    expect(
      fromFirestoreValue({
        mapValue: { fields: { a: { integerValue: '1' }, b: { stringValue: 'x' } } },
      }),
    ).toEqual({ a: 1, b: 'x' });
  });
  it('handles missing values gracefully', () => {
    expect(fromFirestoreValue(undefined)).toBeUndefined();
  });
});

describe('round-trip fidelity', () => {
  it('preserves an arbitrary task-shaped object', () => {
    const task = {
      uid: 'user-abc',
      listId: 'inbox-123',
      title: 'Buy milk',
      details: 'Whole milk, 1L',
      dueDate: '2026-04-21',
      completed: false,
      priority: 'high',
      subtasks: [
        { id: 's1', text: 'Check brand', done: false },
      ],
    };
    const encoded = toFirestoreValue(task);
    const decoded = fromFirestoreValue(encoded);
    expect(decoded).toEqual(task);
  });
});

describe('toFirestoreFields / fromFirestoreDoc', () => {
  it('converts top-level object to fields shape', () => {
    const out = toFirestoreFields({ title: 'a', completed: true, extra: undefined });
    expect(out).toEqual({
      title: { stringValue: 'a' },
      completed: { booleanValue: true },
    });
  });

  it('extracts doc id from the resource path', () => {
    const decoded = fromFirestoreDoc({
      name: 'projects/my-proj/databases/(default)/documents/tasks/abc123',
      fields: {
        title: { stringValue: 'hi' },
        completed: { booleanValue: false },
      },
    });
    expect(decoded).toEqual({ id: 'abc123', title: 'hi', completed: false });
  });
});
