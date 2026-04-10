/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';

// Mock sound service globally — tests don't need actual audio
vi.mock('../services/sound', () => ({
  playSound: vi.fn(),
}));
