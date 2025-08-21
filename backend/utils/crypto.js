import crypto from 'crypto';

const ALG = 'aes-256-gcm';

export function maybeEncrypt(buffer) {
  if (String(process.env.ENABLE_ENCRYPTION) !== 'true') return { buf: buffer, meta: null };
  const key = Buffer.from(process.env.ENCRYPTION_SECRET, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { buf: Buffer.concat([iv, tag, enc]), meta: { iv: iv.toString('hex'), tag: tag.toString('hex') } };
}

export function maybeDecrypt(buffer) {
  if (String(process.env.ENABLE_ENCRYPTION) !== 'true') return buffer;
  const key = Buffer.from(process.env.ENCRYPTION_SECRET, 'hex');
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const data = buffer.subarray(28);
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}