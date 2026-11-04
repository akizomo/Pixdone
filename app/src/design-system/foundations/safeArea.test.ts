import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// Safe-area insets must go through the --pd-layout-safe-* tokens (tokens.css) so
// Storybook can simulate a notched phone; raw env() is invisible in a browser.
const SRC = resolve(process.cwd(), 'src');
const ALLOWED = new Set(['design-system/foundations/tokens.css']);

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : /\.(css|tsx?)$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}

describe('safe-area insets', () => {
  it('are only read through --pd-layout-safe-* tokens', () => {
    const offenders = listFiles(SRC)
      .map((f) => relative(SRC, f))
      .filter((f) => !ALLOWED.has(f) && !f.endsWith('safeArea.test.ts'))
      .filter((f) => readFileSync(join(SRC, f), 'utf8').includes('env(safe-area-inset'));
    expect(offenders).toEqual([]);
  });
});
