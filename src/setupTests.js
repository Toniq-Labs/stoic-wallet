// Polyfills so the modern @dfinity SDK (agent/identity crypto) can be imported in
// the jsdom test environment — previously these libs couldn't be unit-tested
// because jsdom lacks TextEncoder/TextDecoder and WebCrypto.
import {TextEncoder, TextDecoder} from 'util';
import {webcrypto} from 'crypto';

if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
if (typeof global.crypto === 'undefined') global.crypto = webcrypto;
