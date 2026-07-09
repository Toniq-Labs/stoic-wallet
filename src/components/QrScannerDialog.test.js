import {parseScannedAddress} from './QrScannerDialog';

// A valid 64-char hex account ID (as encoded by ReceiveDialog) and a valid principal.
const ACCOUNT_ID = 'a'.repeat(64);
const PRINCIPAL = '2vxsx-fae';

test('parseScannedAddress accepts a bare account ID', () => {
  expect(parseScannedAddress(ACCOUNT_ID)).toBe(ACCOUNT_ID);
});

test('parseScannedAddress accepts a bare principal', () => {
  expect(parseScannedAddress(PRINCIPAL)).toBe(PRINCIPAL);
});

test('parseScannedAddress trims surrounding whitespace', () => {
  expect(parseScannedAddress('  ' + ACCOUNT_ID + '\n')).toBe(ACCOUNT_ID);
});

test('parseScannedAddress strips a URI scheme prefix', () => {
  expect(parseScannedAddress('icp:' + ACCOUNT_ID)).toBe(ACCOUNT_ID);
});

test('parseScannedAddress rejects non-address payloads', () => {
  expect(parseScannedAddress('hello world')).toBeNull();
  expect(parseScannedAddress('')).toBeNull();
  expect(parseScannedAddress(null)).toBeNull();
});
