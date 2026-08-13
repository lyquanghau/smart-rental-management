import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildTenantRoomUsername,
  normalizeLoginPart,
} from '../src/utils/tenantAccount.js';

test('normalizeLoginPart removes Vietnamese accents and unsafe characters', () => {
  assert.equal(normalizeLoginPart('Lý Quang Hậu'), 'lyquanghau');
  assert.equal(normalizeLoginPart('Đặng Thị A'), 'dangthia');
  assert.equal(normalizeLoginPart('P.101'), 'p101');
});

test('buildTenantRoomUsername joins normalized tenant name and room name', () => {
  const username = buildTenantRoomUsername(
    { fullName: 'Lý Quang Hậu' },
    { name: '101' },
  );

  assert.equal(username, 'lyquanghau101');
});
