import {compressAddress, numf} from './utils';

describe('compressAddress', () => {
  it('returns empty string for falsy input', () => {
    expect(compressAddress('')).toBe('');
    expect(compressAddress(undefined)).toBe('');
  });
  it('shortens a 64-char hex account id', () => {
    const id = 'a'.repeat(64);
    expect(compressAddress(id)).toBe(id.slice(0, 16) + '...');
  });
  it('leaves short principals unchanged', () => {
    expect(compressAddress('aaaaa-aa')).toBe('aaaaa-aa');
  });
});

describe('numf', () => {
  it('passes through N/A', () => {
    expect(numf('N/A')).toBe('N/A');
  });
  it('formats with thousands separators and 2 decimals by default', () => {
    expect(numf(1234.5)).toBe('1,234.50');
  });
  it('respects the decimals argument', () => {
    expect(numf(1.23456, 4)).toBe('1.2346');
  });
});
