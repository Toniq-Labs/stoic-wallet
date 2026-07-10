import {Principal} from '@icp-sdk/core/principal';
import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import {getCrc32} from '@dfinity/principal/lib/esm/utils/getCrc';
import {sha224} from '@dfinity/principal/lib/esm/utils/sha224';
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
  const hash = sha224(array);
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
