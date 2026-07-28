import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpError } from '../src/utils/httpError.js';
import { ownerFilter } from '../src/utils/ownership.js';
import {
  minNumber,
  oneOf,
  required,
  validateBody,
} from '../src/middleware/validateRequest.js';

test('ownerFilter appends the authenticated landlord owner id', () => {
  const filter = ownerFilter(
    { user: { _id: 'landlord-1' } },
    { status: 'active', deletedAt: null },
  );

  assert.deepEqual(filter, {
    status: 'active',
    deletedAt: null,
    owner: 'landlord-1',
  });
});

test('createHttpError carries status and field errors', () => {
  const error = createHttpError(400, 'Invalid payload', {
    amount: 'Amount must be positive',
  });

  assert.equal(error.statusCode, 400);
  assert.equal(error.message, 'Invalid payload');
  assert.deepEqual(error.errors, { amount: 'Amount must be positive' });
});

test('validateBody reports first validation error per field', () => {
  const middleware = validateBody({
    amount: [required('Amount'), minNumber('Amount', 0)],
    status: [oneOf('Status', ['pending', 'paid'])],
  });
  const req = { body: { amount: -1, status: 'cancelled' } };
  let capturedError;

  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.equal(capturedError.statusCode, 400);
  assert.match(capturedError.errors.amount, /0/);
  assert.match(capturedError.errors.status, /pending, paid/);
});

test('validateBody passes valid payloads to the next middleware', () => {
  const middleware = validateBody({
    amount: [required('Amount'), minNumber('Amount', 0)],
    status: [oneOf('Status', ['pending', 'paid'])],
  });
  const req = { body: { amount: 100000, status: 'pending' } };
  let called = false;

  middleware(req, {}, (error) => {
    assert.equal(error, undefined);
    called = true;
  });

  assert.equal(called, true);
});
