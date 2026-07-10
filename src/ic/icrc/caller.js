// ICRC-49 call_canister: submit an update call on the user's behalf and return
// the raw contentMap + certificate so the relying party can verify the reply.
//
// HttpAgent.call() hides the request content map it builds (with an internal
// ingress_expiry), so we construct and submit the request ourselves — mirroring
// the agent's own call() — to capture the exact contentMap the certificate
// certifies. The read_state poll reuses the agent for certificate verification.
import {
  HttpAgent,
  Expiry,
  requestIdOf,
  Cbor,
  Certificate,
  SubmitRequestType,
  RequestStatusResponseStatus,
} from '@icp-sdk/core/agent';
import {Principal} from '@icp-sdk/core/principal';
const blobFromText = s => new TextEncoder().encode(s); // was @dfinity/candid blobFromText (removed)
import {toU8} from './bytes.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function callCanister(identity, {canisterId, method, arg, nonce}, host = 'https://icp0.io/') {
  const agent = new HttpAgent({identity, host});
  const canister = Principal.fromText(canisterId);

  const submit = {
    request_type: SubmitRequestType.Call,
    canister_id: canister,
    method_name: method,
    arg: toU8(arg),
    sender: identity.getPrincipal(),
    ingress_expiry: new Expiry(5 * 60 * 1000),
  };
  if (nonce) submit.nonce = toU8(nonce);
  const requestId = requestIdOf(submit);

  // Sign the envelope exactly as HttpAgent.call() does, then submit it.
  const transformed = await identity.transformRequest({
    request: {method: 'POST', headers: {'Content-Type': 'application/cbor'}},
    endpoint: 'call',
    body: submit,
  });
  const res = await fetch(new URL(`/api/v2/canister/${canister.toText()}/call`, host).toString(), {
    ...transformed.request,
    body: Cbor.encode(transformed.body),
  });
  if (!res.ok) {
    throw new Error(`Call submission failed: ${res.status} ${res.statusText}`);
  }

  // Poll read_state until the request reaches a terminal state, returning the
  // exact contentMap and the verified certificate.
  const path = [blobFromText('request_status'), requestId];
  const deadline = Date.now() + 60 * 1000;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const state = await agent.readState(canister, {paths: [path]});
    const cert = new Certificate(state, agent);
    if (!(await cert.verify())) throw new Error('Certificate verification failed');
    const statusBuf = cert.lookup([...path, blobFromText('status')]);
    const status = statusBuf ? statusBuf.toString() : RequestStatusResponseStatus.Unknown;
    if (status === RequestStatusResponseStatus.Replied) {
      return {
        contentMap: new Uint8Array(Cbor.encode(submit)),
        certificate: toU8(state.certificate),
      };
    }
    if (status === RequestStatusResponseStatus.Rejected) {
      const msg = cert.lookup([...path, blobFromText('reject_message')]);
      throw new Error('Call rejected: ' + (msg ? msg.toString() : 'unknown'));
    }
    if (Date.now() > deadline) throw new Error('Timed out waiting for the call to complete');
    await sleep(1000);
  }
}
