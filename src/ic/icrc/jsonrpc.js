// JSON-RPC 2.0 helpers and ICRC-25 error codes for the Stoic signer.
//
// The ICRC signer standards (ICRC-25/27/29/34/49) exchange JSON-RPC 2.0 messages
// between a relying party (dapp) and the signer (Stoic) over a transport
// (ICRC-29 postMessage). This module is pure and transport-agnostic so it can be
// unit-tested without a browser or @dfinity dependencies.

// ICRC-25 standard error codes.
export const ERROR_CODES = {
  GENERIC: 1000, // Generic / unexpected error
  NOT_SUPPORTED: 2000, // Method or standard not supported
  NO_CONSENT_MESSAGE: 2001, // ICRC-49: target canister has no ICRC-21 consent support
  PERMISSION_NOT_GRANTED: 3000, // Relying party lacks the required permission scope
  ACTION_ABORTED: 3001, // User rejected / aborted the request
  NETWORK_ERROR: 4000, // Network failure
  CHANNEL_CLOSED: 4001, // Transport channel closed
};

const DEFAULT_MESSAGES = {
  [ERROR_CODES.GENERIC]: 'Generic error',
  [ERROR_CODES.NOT_SUPPORTED]: 'Not supported',
  [ERROR_CODES.NO_CONSENT_MESSAGE]: 'No consent message',
  [ERROR_CODES.PERMISSION_NOT_GRANTED]: 'Permission not granted',
  [ERROR_CODES.ACTION_ABORTED]: 'Action aborted',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error',
  [ERROR_CODES.CHANNEL_CLOSED]: 'Channel closed',
};

// True when `msg` is a well-formed JSON-RPC 2.0 request (has jsonrpc "2.0", a
// string method, and an id for non-notification requests).
export const isJsonRpcRequest = msg =>
  !!msg &&
  typeof msg === 'object' &&
  msg.jsonrpc === '2.0' &&
  typeof msg.method === 'string';

// Build a JSON-RPC success response echoing the request id.
export const rpcResult = (id, result) => ({jsonrpc: '2.0', id: id ?? null, result});

// Build a JSON-RPC error response. `data` is optional structured detail.
export const rpcError = (id, code, message, data) => {
  const error = {code, message: message ?? DEFAULT_MESSAGES[code] ?? 'Error'};
  if (typeof data !== 'undefined') error.data = data;
  return {jsonrpc: '2.0', id: id ?? null, error};
};

// A rejection carrying an ICRC error code, thrown by method handlers and turned
// into a JSON-RPC error response by the dispatcher.
export class RpcError extends Error {
  constructor(code, message, data) {
    super(message ?? DEFAULT_MESSAGES[code] ?? 'Error');
    this.code = code;
    this.data = data;
  }
}

export const notSupported = method =>
  new RpcError(ERROR_CODES.NOT_SUPPORTED, `Method not supported: ${method}`);
export const permissionNotGranted = method =>
  new RpcError(ERROR_CODES.PERMISSION_NOT_GRANTED, `Permission not granted: ${method}`);
export const actionAborted = () =>
  new RpcError(ERROR_CODES.ACTION_ABORTED, 'The user rejected the request');
