import {Buffer} from 'buffer/';
import {Cbor, SignIdentity} from '@dfinity/agent';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import LedgerApp, {LedgerError} from '@zondax/ledger-icp';

// BIP44 derivation path used by the Internet Computer Ledger app for ICP.
const DERIVATION_PATH = "m/44'/223'/0'/0/0";
// P2 value passed to the sign instruction for a regular (non-stake) transaction.
const SIGN_TX_DEFAULT = 0;
// DER (RFC 5480 SubjectPublicKeyInfo) header for an uncompressed secp256k1 key.
const SECP256K1_DER_PREFIX = Uint8Array.from([
  0x30, 0x56, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x05, 0x2b,
  0x81, 0x04, 0x00, 0x0a, 0x03, 0x42, 0x00,
]);

// True when the browser exposes the WebHID API needed to reach a Ledger device.
const hasWebHID = () =>
  typeof window !== 'undefined' && !!(window.navigator && window.navigator.hid);

class Secp256k1PublicKey {
  constructor(rawKey) {
    this.rawKey = rawKey;
    this.derKey = Buffer.concat([Buffer.from(SECP256K1_DER_PREFIX), Buffer.from(rawKey)]);
  }
  toDer() {
    return this.derKey;
  }
  toRaw() {
    return this.rawKey;
  }
}

const assertOk = response => {
  if (response.returnCode !== LedgerError.NoErrors) {
    throw new Error(response.errorMessage || 'Ledger device error (' + response.returnCode + ')');
  }
};

// The Ledger app signs the full CBOR-encoded request envelope so the device can
// parse and display the transaction details to the user before signing.
const prepareCborForLedger = request =>
  Buffer.from(new Uint8Array(Cbor.encode({content: request})));

class LedgerIdentity extends SignIdentity {
  constructor(publicKey) {
    super();
    this._publicKey = publicKey;
  }

  // Open a fresh WebHID transport for a single operation, then close it so the
  // device stays available for the next interaction (and other tabs/apps).
  static async _withApp(fn) {
    if (!hasWebHID()) {
      throw new Error(
        'Your browser does not support WebHID. Please use Chrome, Edge or Brave to connect a Ledger.',
      );
    }
    const transport = await TransportWebHID.create();
    try {
      return await fn(new LedgerApp(transport));
    } finally {
      await transport.close();
    }
  }

  // Prompt the user to open the IC app on their Ledger and derive the principal.
  static connect() {
    return LedgerIdentity._withApp(async app => {
      const response = await app.getAddressAndPubKey(DERIVATION_PATH);
      assertOk(response);
      return new LedgerIdentity(new Secp256k1PublicKey(response.publicKey));
    });
  }

  getPublicKey() {
    return this._publicKey;
  }

  async sign(blob) {
    return LedgerIdentity._withApp(async app => {
      const response = await app.sign(DERIVATION_PATH, Buffer.from(blob), SIGN_TX_DEFAULT);
      assertOk(response);
      return Buffer.from(response.signatureRS);
    });
  }

  // Override the default transform so the device receives the full request body
  // (the candid transaction) rather than just the pre-hashed request id.
  async transformRequest(request) {
    const {body, ...fields} = request;
    const signature = await this.sign(prepareCborForLedger(body));
    return {
      ...fields,
      body: {
        content: body,
        sender_pubkey: this.getPublicKey().toDer(),
        sender_sig: signature,
      },
    };
  }
}

export {LedgerIdentity, hasWebHID};
