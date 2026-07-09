import {
  ERROR_CODES,
  isJsonRpcRequest,
  rpcResult,
  rpcError,
  RpcError,
  notSupported,
  permissionNotGranted,
} from './jsonrpc.js';
import {
  SUPPORTED_STANDARDS,
  SCOPED_METHODS,
  OPEN_METHODS,
  isScopedMethod,
  isKnownMethod,
} from './standards.js';

describe('icrc jsonrpc helpers', () => {
  it('recognises well-formed JSON-RPC 2.0 requests', () => {
    expect(isJsonRpcRequest({jsonrpc: '2.0', id: 1, method: 'icrc29_status'})).toBe(true);
    expect(isJsonRpcRequest({jsonrpc: '1.0', id: 1, method: 'x'})).toBe(false);
    expect(isJsonRpcRequest({jsonrpc: '2.0', id: 1})).toBe(false);
    expect(isJsonRpcRequest(null)).toBe(false);
    expect(isJsonRpcRequest('nope')).toBe(false);
  });

  it('builds success responses echoing the id', () => {
    expect(rpcResult(7, {ok: true})).toEqual({jsonrpc: '2.0', id: 7, result: {ok: true}});
    expect(rpcResult(undefined, 1).id).toBeNull();
  });

  it('builds error responses with default messages and optional data', () => {
    const e = rpcError(3, ERROR_CODES.PERMISSION_NOT_GRANTED);
    expect(e).toEqual({
      jsonrpc: '2.0',
      id: 3,
      error: {code: 3000, message: 'Permission not granted'},
    });
    expect(rpcError(1, ERROR_CODES.GENERIC, 'boom', {x: 1}).error).toEqual({
      code: 1000,
      message: 'boom',
      data: {x: 1},
    });
  });

  it('RpcError carries its code and helper factories set the right codes', () => {
    expect(new RpcError(ERROR_CODES.GENERIC).code).toBe(1000);
    expect(notSupported('foo').code).toBe(ERROR_CODES.NOT_SUPPORTED);
    expect(permissionNotGranted('icrc27_accounts').code).toBe(ERROR_CODES.PERMISSION_NOT_GRANTED);
  });
});

describe('icrc standards registry', () => {
  it('advertises at least ICRC-25/27/29/34', () => {
    const names = SUPPORTED_STANDARDS.map(s => s.name);
    ['ICRC-25', 'ICRC-27', 'ICRC-29', 'ICRC-34'].forEach(n => expect(names).toContain(n));
    SUPPORTED_STANDARDS.forEach(s => expect(s.url).toMatch(/^https:\/\//));
  });

  it('gates the right methods and leaves negotiation methods open', () => {
    expect(isScopedMethod('icrc27_accounts')).toBe(true);
    expect(isScopedMethod('icrc34_delegation')).toBe(true);
    expect(isScopedMethod('icrc29_status')).toBe(false);
    expect(isScopedMethod('icrc25_permissions')).toBe(false);
    OPEN_METHODS.forEach(m => expect(isScopedMethod(m)).toBe(false));
  });

  it('knows its methods and rejects unknown ones', () => {
    expect(isKnownMethod('icrc49_call_canister')).toBe(true);
    expect(isKnownMethod('totally_made_up')).toBe(false);
    SCOPED_METHODS.forEach(m => expect(isKnownMethod(m)).toBe(true));
  });
});
