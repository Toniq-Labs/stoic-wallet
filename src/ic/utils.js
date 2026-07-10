import {Principal} from '@icp-sdk/core/principal';
import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import {sha224} from 'js-sha256';
import RosettaApi from './RosettaApi.js';
import {
  amountToBigInt,
  getSubAccountArray,
  from32bits,
  to32bits,
  toHexString,
  fromHexString,
  isHex,
  validateAddress,
} from './format.js';

// CRC32 (IEEE 802.3) — vendored because @icp-sdk/core/@dfinity principal no
// longer exports the internal getCrc32 the old version did. Returns an unsigned
// 32-bit integer; verified to match the previous implementation for account ids.
const CRC32_TABLE = (() => {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
const getCrc32 = bytes => {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let crc = 0xffffffff;
  for (let i = 0; i < b.length; i++) crc = CRC32_TABLE[(crc ^ b[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
const GOVERNANCE_CANISTER_ID = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
const NNS_CANISTER_ID = 'qoctq-giaaa-aaaaa-aaaea-cai';
const CYCLES_MINTING_CANISTER_ID = 'rkp4c-7iaaa-aaaaa-aaaca-cai';
const rosettaApi = new RosettaApi();
const sjcl = require('sjcl');
const bip39 = require('bip39');
const pbkdf2 = require('pbkdf2');
const getCyclesTopupAddress = canisterId => {
  return principalToAccountIdentifier(
    CYCLES_MINTING_CANISTER_ID,
    getCyclesTopupSubAccount(canisterId),
  );
};
const getCyclesTopupSubAccount = canisterId => {
  var pb = Array.from(Principal.fromText(canisterId).toUint8Array());
  return [pb.length, ...pb];
};
const principalToAccountIdentifier = (p, s) => {
  const padding = Buffer.from('\x0Aaccount-id');
  const array = new Uint8Array([
    ...padding,
    ...Principal.fromText(p).toUint8Array(),
    ...getSubAccountArray(s),
  ]);
  const hash = new Uint8Array(sha224.array(array));
  const checksum = to32bits(getCrc32(hash));
  const array2 = new Uint8Array([...checksum, ...hash]);
  return toHexString(array2);
};
const mnemonicToId = mnemonic => {
  var seed = bip39.mnemonicToSeedSync(mnemonic);
  seed = Array.from(seed);
  seed = seed.splice(0, 32);
  seed = new Uint8Array(seed);
  return Ed25519KeyIdentity.generate(seed);
};
const encrypt = (mnemonic, principal, password) => {
  return new Promise((resolve, reject) => {
    pbkdf2.pbkdf2(password, principal, 30000, 512, 'sha512', (e, d) => {
      if (e) return reject(e);
      resolve(sjcl.encrypt(d.toString(), btoa(mnemonic)));
    });
  });
};
const decrypt = (data, principal, password) => {
  return new Promise((resolve, reject) => {
    pbkdf2.pbkdf2(password, principal, 30000, 512, 'sha512', (e, d) => {
      if (e) return reject(e);
      try {
        resolve(atob(sjcl.decrypt(d.toString(), data)));
      } catch (e) {
        reject(e);
      }
    });
  });
};
const validatePrincipal = p => {
  try {
    return p === Principal.fromText(p).toText();
  } catch (e) {
    return false;
  }
};
export {
  LEDGER_CANISTER_ID,
  GOVERNANCE_CANISTER_ID,
  NNS_CANISTER_ID,
  CYCLES_MINTING_CANISTER_ID,
  getCyclesTopupAddress,
  getCyclesTopupSubAccount,
  amountToBigInt,
  rosettaApi,
  Principal,
  principalToAccountIdentifier,
  getSubAccountArray,
  from32bits,
  to32bits,
  toHexString,
  fromHexString,
  mnemonicToId,
  encrypt,
  decrypt,
  isHex,
  bip39,
  validateAddress,
  validatePrincipal,
};
