import createHttpError from 'http-errors';
import util from 'util';
import crypto from 'crypto';

export const hasObject = (obj: any, key: string): void => {
  if (!(key in obj)) throw createHttpError(400, `Malformed request: No parameter "${key}"`);
  if (typeof obj[key] !== 'object') throw createHttpError(400, `Malformed request: Wrong type of "${key}", must be object`);
};
export const hasString = (obj: any, key: string): void => {
  if (!(key in obj)) throw createHttpError(400, `Malformed request: No parameter "${key}"`);
  if (typeof obj[key] !== 'string') throw createHttpError(400, `Malformed request: Wrong type of "${key}", must be string`);
};
export const hasBool = (obj: any, key: string): void => {
  if (!(key in obj)) throw createHttpError(400, `Malformed request: No parameter "${key}"`);
  if (typeof obj[key] !== 'boolean') throw createHttpError(400, `Malformed request: Wrong type of "${key}", must be boolean`);
};

export const randomBytes = util.promisify(crypto.randomBytes);

export const generatePassword = async (length: number): Promise<string> => {
  let password = '';
  const seed = await randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[seed.readUInt8(i) % 26];
  }
  return password;
};

export function encodeBase64(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeBase64(encoded: string): Buffer {
  const normal = encoded + Array(5 - (encoded.length % 4)).fill('=');
  const base64 = normal
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  return Buffer.from(base64, 'base64');
}

export function validateBase64(str: string): boolean {
  return /^[A-Za-z0-9\-_]+$/.test(str);
}
