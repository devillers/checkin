import { mocks } from '../mock-registry.mjs';

export async function requireAuth(...args) {
  return mocks.requireAuth(...args);
}
