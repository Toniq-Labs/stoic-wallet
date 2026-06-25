import {formatNumberForDisplay} from './utils';

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
