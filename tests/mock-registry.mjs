export const mocks = {
  nextResponseJson: () => {
    throw new Error('nextResponseJson mock not configured');
  },
  connectDB: async () => {
    throw new Error('connectDB mock not configured');
  },
  requireAuth: async () => {
    throw new Error('requireAuth mock not configured');
  },
  validatePayload: () => {
    throw new Error('validateAndNormalizePropertyPayload mock not configured');
  },
  uuidv4: () => {
    throw new Error('uuidv4 mock not configured');
  }
};
