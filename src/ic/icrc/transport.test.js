import {makeMessageListener} from './transport.js';

// A fake relying-party window that records what the signer posts back.
const makeSource = () => {
  const sent = [];
  return {postMessage: (msg, origin) => sent.push({msg, origin}), sent};
};
const ev = (data, origin, source) => ({data, origin, source});
const flush = () => new Promise(r => setTimeout(r, 0));

const ORIGIN = 'https://dapp.example.com';

describe('ICRC-29 transport', () => {
  it('answers icrc29_status with ready and establishes the channel', async () => {
    const listener = makeMessageListener(async () => ({ok: true}));
    const src = makeSource();
    await listener(ev({jsonrpc: '2.0', id: 1, method: 'icrc29_status'}, ORIGIN, src));
    expect(src.sent[0].msg).toEqual({jsonrpc: '2.0', id: 1, result: 'ready'});
    expect(src.sent[0].origin).toBe(ORIGIN);
  });

  it('routes established requests to onRequest and returns the result', async () => {
    const onRequest = jest.fn(async () => ({accounts: []}));
    const listener = makeMessageListener(onRequest);
    const src = makeSource();
    await listener(ev({jsonrpc: '2.0', id: 1, method: 'icrc29_status'}, ORIGIN, src));
    await listener(ev({jsonrpc: '2.0', id: 2, method: 'icrc27_accounts'}, ORIGIN, src));
    await flush();
    expect(onRequest).toHaveBeenCalledWith(
      expect.objectContaining({method: 'icrc27_accounts'}),
      ORIGIN,
    );
    expect(src.sent[1].msg).toEqual({jsonrpc: '2.0', id: 2, result: {accounts: []}});
  });

  it('turns handler errors into JSON-RPC error responses with the ICRC code', async () => {
    const err = Object.assign(new Error('nope'), {code: 3000});
    const listener = makeMessageListener(async () => {
      throw err;
    });
    const src = makeSource();
    await listener(ev({jsonrpc: '2.0', id: 1, method: 'icrc29_status'}, ORIGIN, src));
    await listener(ev({jsonrpc: '2.0', id: 5, method: 'icrc27_accounts'}, ORIGIN, src));
    await flush();
    expect(src.sent[1].msg.error).toEqual({code: 3000, message: 'nope'});
  });

  it('ignores requests from a different origin than the established one', async () => {
    const onRequest = jest.fn(async () => ({}));
    const listener = makeMessageListener(onRequest);
    const src = makeSource();
    await listener(ev({jsonrpc: '2.0', id: 1, method: 'icrc29_status'}, ORIGIN, src));
    // Same window object, but a spoofed origin -> ignored.
    await listener(ev({jsonrpc: '2.0', id: 2, method: 'icrc27_accounts'}, 'https://evil.com', src));
    await flush();
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('ignores non JSON-RPC and opaque-origin messages', async () => {
    const onRequest = jest.fn(async () => ({}));
    const listener = makeMessageListener(onRequest);
    const src = makeSource();
    await listener(ev({action: 'legacyStoicThing'}, ORIGIN, src)); // legacy protocol msg
    await listener(ev({jsonrpc: '2.0', id: 1, method: 'icrc29_status'}, 'null', src)); // opaque
    await flush();
    expect(onRequest).not.toHaveBeenCalled();
    expect(src.sent).toHaveLength(0);
  });
});
