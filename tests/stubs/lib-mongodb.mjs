import { mocks } from '../mock-registry.mjs';

export async function connectDB(...args) {
  return mocks.connectDB(...args);
}
