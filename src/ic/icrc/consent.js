// ICRC-21: fetch a human-readable consent message for a canister call, shown to
// the user before an ICRC-49 call is approved.
import {Actor, HttpAgent} from '@dfinity/agent';
import icrc21IDL from './candid/icrc21.did.js';
import {toU8} from './bytes.js';

// Turn an ICRC-21 consent_message variant into a display string.
export const formatConsentMessage = cm => {
  if (!cm) return null;
  if (typeof cm.GenericDisplayMessage !== 'undefined') return cm.GenericDisplayMessage;
  if (typeof cm.LineDisplayMessage !== 'undefined') {
    return cm.LineDisplayMessage.pages.map(p => p.lines.join('\n')).join('\n\n');
  }
  return null;
};

// Returns the consent message string, or null if the canister does not support
// ICRC-21 (or returns an error) — the caller then decides whether to warn and
// allow blind approval.
export async function fetchConsentMessage({canisterId, method, arg}, host = 'https://icp0.io/') {
  try {
    const actor = Actor.createActor(icrc21IDL, {agent: new HttpAgent({host}), canisterId});
    const res = await actor.icrc21_canister_call_consent_message({
      method,
      arg: toU8(arg),
      user_preferences: {
        metadata: {language: 'en', utc_offset_minutes: []},
        device_spec: [],
      },
    });
    if (res && res.Ok) return formatConsentMessage(res.Ok.consent_message);
    return null;
  } catch (e) {
    console.error('icrc21 consent message unavailable', e);
    return null;
  }
}
