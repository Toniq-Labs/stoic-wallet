import {toU8, bytesFromParam} from './bytes.js';

describe('icrc byte helpers', () => {
  it('toU8 normalises arrays, ArrayBuffers and Uint8Arrays', () => {
    expect(toU8([1, 2, 3])).toEqual(Uint8Array.from([1, 2, 3]));
    const u = new Uint8Array([9, 8]);
    expect(toU8(u)).toBe(u);
    expect(toU8(new Uint8Array([4, 5]).buffer)).toEqual(Uint8Array.from([4, 5]));
  });

  it('bytesFromParam passes through binary forms', () => {
    const u = new Uint8Array([1, 2, 3]);
    expect(bytesFromParam(u)).toBe(u);
    expect(bytesFromParam([10, 20])).toEqual(Uint8Array.from([10, 20]));
    expect(bytesFromParam(new Uint8Array([7, 7]).buffer)).toEqual(Uint8Array.from([7, 7]));
  });

  it('decodes hex strings', () => {
    expect(bytesFromParam('0a1bff')).toEqual(Uint8Array.from([0x0a, 0x1b, 0xff]));
  });

  it('decodes base64 strings (incl. base64url)', () => {
    // btoa('Ma') === 'TWE='
    expect(bytesFromParam('TWE=')).toEqual(new Uint8Array([0x4d, 0x61]));
    // base64url with - / _ replaced
    const b64 = btoa(String.fromCharCode(251, 239, 255));
    const url = b64.replace(/\+/g, '-').replace(/\//g, '_');
    expect(bytesFromParam(url)).toEqual(new Uint8Array([251, 239, 255]));
  });

  it('throws on unsupported encodings', () => {
    expect(() => bytesFromParam(42)).toThrow();
    expect(() => bytesFromParam(null)).toThrow();
  });
});
