// ICRC-29 browser postMessage transport for the Stoic signer.
//
// Installs a window "message" listener that:
//  - answers icrc29_status handshakes/heartbeats with { result: "ready" },
//  - establishes the relying party's origin + window on first contact and only
//    accepts subsequent requests from that same origin AND window,
//  - hands real JSON-RPC requests to `onRequest(request, origin)` and posts the
//    result (or an ICRC error) back to the relying party.
//
// Only well-formed JSON-RPC 2.0 messages are touched, so this coexists with the
// legacy stoic-connect postMessage protocol (which uses {action,target} shapes).
import {isJsonRpcRequest, rpcResult, rpcError, ERROR_CODES} from './jsonrpc.js';

// Build the "message" event handler. Exposed separately from window binding so
// the channel logic can be unit-tested with plain event objects.
export function makeMessageListener(onRequest) {
  let establishedOrigin = null;
  let establishedSource = null;

  return async event => {
    const data = event.data;
    if (!isJsonRpcRequest(data)) return;
    if (!event.origin || event.origin === 'null') return; // ignore opaque origins

    const respond = msg => {
      try {
        if (event.source) event.source.postMessage(msg, event.origin);
      } catch (e) {
        /* window may have closed */
      }
    };

    // ICRC-29 status handshake + heartbeat. The first status message establishes
    // the channel; later ones (from the same origin/window) are answered "ready".
    if (data.method === 'icrc29_status') {
      if (!establishedOrigin) {
        establishedOrigin = event.origin;
        establishedSource = event.source;
      }
      if (event.origin === establishedOrigin && event.source === establishedSource) {
        respond(rpcResult(data.id, 'ready'));
      }
      return;
    }

    // Every other method requires an established, matching channel.
    if (event.origin !== establishedOrigin || event.source !== establishedSource) return;

    try {
      const result = await onRequest(data, event.origin);
      respond(rpcResult(data.id, result));
    } catch (e) {
      const code = e && e.code ? e.code : ERROR_CODES.GENERIC;
      respond(rpcError(data.id, code, e && e.message, e && e.data));
    }
  };
}

// Install the transport on the global window. Returns an uninstall function.
export function installSignerTransport(onRequest) {
  const listener = makeMessageListener(onRequest);
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
