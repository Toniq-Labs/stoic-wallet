/* global BigInt */
// Pure, dependency-free formatting / byte helpers. Kept separate from ic/utils.js
// (which pulls in the heavy @dfinity/identity + agent stack) so they can be unit
// tested in isolation and reused without that weight.

export const isHex = (h) => /^[0-9a-fA-F]+$/.test(h);

export const validateAddress = (a) => isHex(a) && a.length === 64;

export const to32bits = (num) => {
  const b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
};

export const from32bits = (ba) => {
  let value = 0;
  for (let i = 0; i < 4; i++) {
    value = (value << 8) | ba[i];
  }
  return value;
};

export const toHexString = (byteArray) =>
  Array.from(byteArray, (byte) => ('0' + (byte & 0xff).toString(16)).slice(-2)).join('');

export const fromHexString = (hex) => {
  if (hex.substr(0, 2) === '0x') hex = hex.substr(2);
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
};

export const getSubAccountArray = (s) => {
  if (Array.isArray(s)) {
    return s.concat(Array(32 - s.length).fill(0));
  }
  // 32-bit number only
  return Array(28).fill(0).concat(to32bits(s ? s : 0));
};

export const amountToBigInt = (amount, decimals) => {
  if (amount < 1) {
    return BigInt(amount * 10 ** decimals);
  }
  return BigInt(amount) * BigInt(10 ** decimals);
};
