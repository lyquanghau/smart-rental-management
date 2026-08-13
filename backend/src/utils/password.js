import { randomBytes } from 'node:crypto';

export function generateTemporaryPassword() {
  return `Sr@${randomBytes(6).toString('base64url')}`;
}
