import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('../firebase.config', () => ({
  db: {},
  auth: {},
}));


