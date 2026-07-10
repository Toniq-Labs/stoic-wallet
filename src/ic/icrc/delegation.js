/* global BigInt */
// ICRC-34 delegation construction.
//
// Turns a Stoic signing identity into a session delegation for a relying party's
// public key, so the dapp can sign its own canister calls with a delegated
// identity (instead of round-tripping every call back to Stoic).
import {DelegationChain} from '@icp-sdk/core/identity';
import {Principal} from '@icp-sdk/core/principal';
import {toU8, bytesFromParam} from './bytes.js';

export {bytesFromParam};

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// Wrap a DER public key (Uint8Array) so DelegationChain.create can call toDer().
const wrapPublicKey = der => ({toDer: () => toU8(der)});

const expirationDate = maxTimeToLive => {
  if (!maxTimeToLive) return new Date(Date.now() + FIFTEEN_MINUTES_MS);
  // maxTimeToLive is in nanoseconds; DelegationChain wants a JS Date (ms).
  const ms = Number(BigInt(maxTimeToLive) / 1000000n);
  return new Date(Date.now() + ms);
};

// Map a @dfinity/identity DelegationChain to the ICRC-34 response shape:
// { publicKey, signerDelegation: [{ delegation: { pubkey, expiration, targets? }, signature }] }
// Blobs are Uint8Array (carried natively by the ICRC-29 postMessage transport);
// expiration is a base-10 nanosecond string and targets are principal text.
const toIcrc34Response = chain => ({
  publicKey: toU8(chain.publicKey),
  signerDelegation: chain.delegations.map(({delegation, signature}) => ({
    delegation: {
      pubkey: toU8(delegation.pubkey),
      expiration: delegation.expiration.toString(),
      ...(delegation.targets ? {targets: delegation.targets.map(p => p.toText())} : {}),
    },
    signature: toU8(signature),
  })),
});

// Build an ICRC-34 delegation.
// - identity: the user's Stoic signing identity (a SignIdentity). Internet
//   Identity accounts are DelegationIdentity instances exposing getDelegation();
//   their existing anchor→session chain is chained onto via `previous` so the
//   resulting root publicKey stays the II anchor key.
// - sessionPublicKeyDer: the relying party's DER public key (icrc34 `publicKey`).
// - targets: optional canister id strings for an account (scoped) delegation.
// - maxTimeToLive: optional nanoseconds; capped by the 15-minute default.
export async function buildDelegation(identity, sessionPublicKeyDer, {targets, maxTimeToLive} = {}) {
  if (!identity || typeof identity.sign !== 'function') {
    throw new Error('This account type cannot issue a delegation');
  }
  const options = {};
  if (targets && targets.length) options.targets = targets.map(t => Principal.fromText(t));
  if (identity._delegation && typeof identity.getDelegation === 'function') {
    options.previous = identity.getDelegation();
  }
  const chain = await DelegationChain.create(
    identity,
    wrapPublicKey(sessionPublicKeyDer),
    expirationDate(maxTimeToLive),
    options,
  );
  return toIcrc34Response(chain);
}
