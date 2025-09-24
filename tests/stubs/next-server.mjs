import { mocks } from '../mock-registry.mjs';

export const NextResponse = {
  json: (...args) => mocks.nextResponseJson(...args)
};
