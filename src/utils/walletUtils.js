import crypto from 'crypto-js';

const secretKey = process.env.SECRET_KEY;

export function encryptPrivateKey(privateKey) {
  return crypto.AES.encrypt(privateKey, secretKey).toString();
}

export function decryptPrivateKey(encryptedPrivateKey) {
  const bytes = crypto.AES.decrypt(encryptedPrivateKey, secretKey);
  return bytes.toString(crypto.enc.Utf8);
}
