import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

function readRootAnimations() {
  const rootPath = path.resolve(process.cwd(), '../public/animations.js');
  return readFileSync(rootPath, 'utf8');
}

function readAppAnimations() {
  const appPath = path.resolve(process.cwd(), 'public/animations.js');
  return readFileSync(appPath, 'utf8');
}

function readRootFreeze() {
  const rootPath = path.resolve(process.cwd(), '../public/freeze-effect.js');
  return readFileSync(rootPath, 'utf8');
}

function readAppFreeze() {
  const appPath = path.resolve(process.cwd(), 'public/freeze-effect.js');
  return readFileSync(appPath, 'utf8');
}

describe('vanilla parity: animations.js', () => {
  it('matches epicChance between vanilla and React copies', () => {
    const root = readRootAnimations();
    const app = readAppAnimations();

    const epicRegex = /this\.epicChance\s*=\s*([0-9.]+)\s*;/;
    const rootMatch = root.match(epicRegex);
    const appMatch = app.match(epicRegex);

    expect(rootMatch?.[1]).toBeDefined();
    expect(appMatch?.[1]).toBeDefined();
    expect(appMatch?.[1]).toBe(rootMatch?.[1]);
  });

  it('matches superRareEffects between vanilla and React copies', () => {
    const root = readRootAnimations();
    const app = readAppAnimations();

    const superRareRegex = /this\.superRareEffects\s*=\s*(\[[^\]]+\]);/;
    const rootMatch = root.match(superRareRegex);
    const appMatch = app.match(superRareRegex);

    expect(appMatch?.[1]).toBe(rootMatch?.[1]);
  });
});

describe('vanilla parity: freeze-effect.js', () => {
  it('React copy of FreezeEffect matches vanilla source exactly', () => {
    const root = readRootFreeze();
    const app = readAppFreeze();
    expect(app).toBe(root);
  });
});

