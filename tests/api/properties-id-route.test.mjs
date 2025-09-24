import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { mocks } from '../mock-registry.mjs';

const routeUrl = new URL('../../app/api/properties/[id]/route.js', import.meta.url);
const { PUT } = await import(routeUrl);

let jsonMock;
let connectDBMock;
let requireAuthMock;
let validatePayloadMock;
let uuidMock;

test.beforeEach(() => {
  jsonMock = mock.fn((body, init = {}) => ({
    status: init?.status ?? 200,
    body
  }));
  connectDBMock = mock.fn(async () => {
    throw new Error('connectDB mock not configured');
  });
  requireAuthMock = mock.fn(async () => {
    throw new Error('requireAuth mock not configured');
  });
  validatePayloadMock = mock.fn(() => {
    throw new Error('validateAndNormalizePropertyPayload mock not configured');
  });
  uuidMock = mock.fn(() => 'test-uuid');

  mocks.nextResponseJson = jsonMock;
  mocks.connectDB = connectDBMock;
  mocks.requireAuth = requireAuthMock;
  mocks.validatePayload = validatePayloadMock;
  mocks.uuidv4 = uuidMock;
});

test('returns updated property when driver omits value field', async () => {
  requireAuthMock.mock.mockImplementation(async () => ({ id: 'user-1' }));
  validatePayloadMock.mock.mockImplementation(() => ({
    normalizedData: { name: 'Updated Name' }
  }));

  const existingProperty = { id: 'prop-1', userId: 'user-1', name: 'Old Name' };
  const updatedProperty = { ...existingProperty, name: 'Updated Name' };

  const findOneMock = mock.fn(async () => existingProperty);
  const findOneAndUpdateMock = mock.fn(async () => updatedProperty);
  const insertOneMock = mock.fn(async () => ({}));

  connectDBMock.mock.mockImplementation(async () => ({
    db: {
      collection: (name) => {
        if (name === 'properties') {
          return {
            findOne: findOneMock,
            findOneAndUpdate: findOneAndUpdateMock
          };
        }
        if (name === 'activity_logs') {
          return {
            insertOne: insertOneMock
          };
        }
        throw new Error(`Unexpected collection ${name}`);
      }
    }
  }));

  const request = {
    json: mock.fn(async () => ({ name: 'Updated Name' }))
  };

  const response = await PUT(request, { params: { id: 'prop-1' } });

  assert.deepEqual(response, { status: 200, body: updatedProperty });
  assert.equal(insertOneMock.mock.calls.length, 1);
  const logArguments = insertOneMock.mock.calls[0].arguments[0];
  assert.equal(logArguments.details.propertyName, 'Updated Name');
});

test('uses existing property name when updated document omits it', async () => {
  requireAuthMock.mock.mockImplementation(async () => ({ id: 'user-1' }));
  validatePayloadMock.mock.mockImplementation(() => ({
    normalizedData: { name: 'Updated Name' }
  }));

  const existingProperty = { id: 'prop-1', userId: 'user-1', name: 'Existing Name' };
  const updatedProperty = { id: 'prop-1', userId: 'user-1' };

  const findOneMock = mock.fn(async () => existingProperty);
  const findOneAndUpdateMock = mock.fn(async () => updatedProperty);
  const insertOneMock = mock.fn(async () => ({}));

  connectDBMock.mock.mockImplementation(async () => ({
    db: {
      collection: (name) => {
        if (name === 'properties') {
          return {
            findOne: findOneMock,
            findOneAndUpdate: findOneAndUpdateMock
          };
        }
        if (name === 'activity_logs') {
          return {
            insertOne: insertOneMock
          };
        }
        throw new Error(`Unexpected collection ${name}`);
      }
    }
  }));

  const request = {
    json: mock.fn(async () => ({ name: 'Updated Name' }))
  };

  const response = await PUT(request, { params: { id: 'prop-1' } });

  assert.deepEqual(response, { status: 200, body: updatedProperty });
  assert.equal(insertOneMock.mock.calls.length, 1);
  const logArguments = insertOneMock.mock.calls[0].arguments[0];
  assert.equal(logArguments.details.propertyName, 'Existing Name');
});

test('returns 404 when no document is updated', async () => {
  requireAuthMock.mock.mockImplementation(async () => ({ id: 'user-1' }));
  validatePayloadMock.mock.mockImplementation(() => ({
    normalizedData: { name: 'Updated Name' }
  }));

  const existingProperty = { id: 'prop-1', userId: 'user-1', name: 'Existing Name' };

  const findOneMock = mock.fn(async () => existingProperty);
  const findOneAndUpdateMock = mock.fn(async () => null);
  const insertOneMock = mock.fn(async () => ({}));

  connectDBMock.mock.mockImplementation(async () => ({
    db: {
      collection: (name) => {
        if (name === 'properties') {
          return {
            findOne: findOneMock,
            findOneAndUpdate: findOneAndUpdateMock
          };
        }
        if (name === 'activity_logs') {
          return {
            insertOne: insertOneMock
          };
        }
        throw new Error(`Unexpected collection ${name}`);
      }
    }
  }));

  const request = {
    json: mock.fn(async () => ({ name: 'Updated Name' }))
  };

  const response = await PUT(request, { params: { id: 'prop-1' } });

  assert.deepEqual(response, {
    status: 404,
    body: { message: 'Propriété introuvable' }
  });
  assert.equal(insertOneMock.mock.calls.length, 0);
});
