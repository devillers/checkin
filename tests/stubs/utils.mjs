import { mocks } from '../mock-registry.mjs';

export function validateAndNormalizePropertyPayload(...args) {
  return mocks.validatePayload(...args);
}
