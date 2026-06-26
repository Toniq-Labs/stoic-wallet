import {
  to32bits,
  from32bits,
  toHexString,
  fromHexString,
  isHex,
  validateAddress,
  getSubAccountArray,
  amountToBigInt,
} from './format.js';

describe('to32bits / from32bits (big-endian uint32)', () => {
  test('to32bits encodes', () => {
    expect(to32bits(0)).toEqual([0, 0, 0, 0]);
    expect(to32bits(1)).toEqual([0, 0, 0, 1]);
    expect(to32bits(256)).toEqual([0, 0, 1, 0]);
    expect(to32bits(0xffffffff)).toEqual([255, 255, 255, 255]);
  });
  test('from32bits decodes', () => {
    expect(from32bits([0, 0, 0, 1])).toBe(1);
    expect(from32bits([0, 0, 1, 0])).toBe(256);
  });
  test('round-trips', () => {
    [0, 1, 256, 123456, 0xffffffff].forEach(n => {
      expect(from32bits(to32bits(n)) >>> 0).toBe(n);
    });
  });
});

describe('toHexString / fromHexString', () => {
  test('toHexString lowercases & zero-pads', () => {
    expect(toHexString([0, 255, 16])).toBe('00ff10');
    expect(toHexString([10, 11, 12])).toBe('0a0b0c');
    expect(toHexString([])).toBe('');
  });
  test('fromHexString parses, strips 0x', () => {
    expect(fromHexString('0a0b0c')).toEqual([10, 11, 12]);
    expect(fromHexString('0x0a0b0c')).toEqual([10, 11, 12]);
  });
  test('round-trips', () => {
    expect(toHexString(fromHexString('deadbeef'))).toBe('deadbeef');
  });
});

describe('isHex', () => {
  test('accepts hex', () => {
    expect(isHex('deadBEEF12')).toBe(true);
    expect(isHex('00')).toBe(true);
  });
  test('rejects non-hex / empty', () => {
    expect(isHex('xyz')).toBe(false);
    expect(isHex('')).toBe(false);
    expect(isHex('12 34')).toBe(false);
  });
});

describe('validateAddress', () => {
  test('64-char hex is valid', () => {
    expect(validateAddress('a'.repeat(64))).toBe(true);
    expect(validateAddress('0'.repeat(64))).toBe(true);
  });
  test('wrong length / non-hex is invalid', () => {
    expect(validateAddress('a'.repeat(63))).toBe(false);
    expect(validateAddress('a'.repeat(65))).toBe(false);
    expect(validateAddress('z'.repeat(64))).toBe(false);
  });
});

describe('getSubAccountArray', () => {
  test('number subaccount -> 32 bytes, big-endian in last 4', () => {
    expect(getSubAccountArray(0)).toHaveLength(32);
    expect(getSubAccountArray(0).every(b => b === 0)).toBe(true);
    expect(getSubAccountArray(1).slice(28)).toEqual([0, 0, 0, 1]);
  });
  test('array subaccount -> padded to 32', () => {
    const a = getSubAccountArray([1, 2]);
    expect(a).toHaveLength(32);
    expect(a.slice(0, 4)).toEqual([1, 2, 0, 0]);
  });
});

describe('amountToBigInt', () => {
  test('whole and zero amounts', () => {
    expect(amountToBigInt(1, 8)).toBe(100000000n);
    expect(amountToBigInt(2, 8)).toBe(200000000n);
    expect(amountToBigInt(0, 8)).toBe(0n);
  });
  test('clean fractional amount', () => {
    expect(amountToBigInt(0.5, 8)).toBe(50000000n);
  });
});
