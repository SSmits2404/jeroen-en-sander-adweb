import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Simuleer localStorage voor alle tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};

// @ts-ignore
window.localStorage = localStorageMock;