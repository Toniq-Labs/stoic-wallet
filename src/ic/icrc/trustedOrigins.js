// ICRC-28 trusted-origins validation.
//
// Before Stoic issues an ICRC-34 delegation scoped to specific canisters
// (`targets`), it must confirm the relying party's origin is listed in EVERY
// target canister's icrc28_trusted_origins. This prevents a malicious front-end
// from obtaining a delegation that can act on a canister the user trusts.
import {Actor, HttpAgent} from '@dfinity/agent';
import icrc28IDL from './candid/icrc28.did.js';

// Returns true only if `origin` is a trusted origin of all `targets`.
// A relying-party delegation (no targets) needs no check and returns true.
// Any canister that can't be verified fails closed (returns false).
export async function validateTrustedOrigins(origin, targets, host = 'https://icp0.io/') {
  if (!targets || targets.length === 0) return true;
  const agent = HttpAgent.createSync({host});
  for (const canisterId of targets) {
    let trusted = [];
    try {
      const actor = Actor.createActor(icrc28IDL, {agent, canisterId});
      const res = await actor.icrc28_trusted_origins();
      trusted = res.trusted_origins || [];
    } catch (e) {
      console.error('icrc28_trusted_origins failed for', canisterId, e);
      return false;
    }
    if (!trusted.includes(origin)) return false;
  }
  return true;
}
