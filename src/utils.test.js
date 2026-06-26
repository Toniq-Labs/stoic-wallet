import {formatNumberForDisplay, compressAddress, numf, identityTypes} from './utils';

describe('formatNumberForDisplay', () => {
  it('returns regular numbers unchanged', () => {
    expect(formatNumberForDisplay(123)).toBe(123);
    expect(formatNumberForDisplay(1.5)).toBe(1.5);
    expect(formatNumberForDisplay(0)).toBe(0);
  });
  it('expands small scientific-notation numbers to fixed decimals', () => {
    expect(formatNumberForDisplay(1e-7)).toBe('0.0000001');
  });
});

describe('compressAddress', () => {
  it('returns empty for falsy', () => {
    expect(compressAddress('')).toBe('');
    expect(compressAddress(undefined)).toBe('');
  });
  it('truncates a 64-char hex account id', () => {
    const hex = 'a'.repeat(64);
    expect(compressAddress(hex)).toBe(hex.substr(0, 16) + '...');
  });
  it('compresses a long (>4 segment) principal', () => {
    expect(compressAddress('rwlgt-iiaaa-aaaaa-aaaaa-cai')).toBe('rwlgt-iia...aaa-aaaaa-cai');
  });
  it('leaves short (<=4 segment) principals unchanged', () => {
    expect(compressAddress('aaaaa-aa')).toBe('aaaaa-aa');
  });
});

describe('numf', () => {
  it('passes through N/A', () => {
    expect(numf('N/A')).toBe('N/A');
  });
  it('formats with thousands separators (2dp default)', () => {
    expect(numf(1234567.89)).toBe('1,234,567.89');
    expect(numf(0)).toBe('0.00');
  });
  it('honours a custom decimal count', () => {
    expect(numf(1.23456, 4)).toBe('1.2346');
  });
});

describe('identityTypes', () => {
  it('maps known identity types to labels', () => {
    expect(identityTypes.ii).toBe('Internet Identity');
    expect(identityTypes.private).toBe('Mnemonic Key');
    expect(identityTypes.watch).toBe('Read-only');
    expect(identityTypes.pem).toBe('PEM Import');
  });
});
