/* global BigInt */
import {Actor, HttpAgent} from '@icp-sdk/core/agent';
import {Principal} from '@icp-sdk/core/principal';
import {
  LEDGER_CANISTER_ID,
  GOVERNANCE_CANISTER_ID,
  NNS_CANISTER_ID,
  CYCLES_MINTING_CANISTER_ID,
  getCyclesTopupSubAccount,
  principalToAccountIdentifier,
  toHexString,
  from32bits,
  to32bits,
  isHex,
  getSubAccountArray,
  fromHexString,
  validatePrincipal,
} from './utils.js';

import ledgerIDL from './candid/ledger.did.js';
import governanceIDL from './candid/governance.did.js';
import nnsIDL from './candid/nns.did.js';
import cyclesIDL from './candid/cycles.did.js';
import icpunksIDL from './candid/icpunks.did.js'; //hardcode to icpunks...
import extIDL from './candid/ext.did.js';
import advancedIDL from './candid/advanced.did.js';
import wrapperIDL from './candid/wrapper.did.js';
import logIDL from './candid/log.did.js';
import icdripIDL from './candid/icdrip.did.js';
import icrcIDL from './candid/icrc.did.js';
import dip20IDL from './candid/dip20.did.js';
import drc20IDL from './candid/drc20.did.js'; //TODO
import odinIDL from './candid/odin.did.js';

// Odin is a single ICRC ledger that holds many tokens, addressed by a per-token
// 32-byte "pointer" carried in the subaccount field (ICRC-80). A wallet "odin"
// token is registered by its text token id (e.g. "btc", "hjsu") rather than a
// canister id; every odin token routes to this one ledger canister.
// NOTE: this is Odin's dev ledger — swap in the production canister id on launch.
const ODIN_LEDGER_CANISTER_ID = 'w5cxm-6iaaa-aaaaj-az4jq-cai';
// BTC and Odin-launched tokens both use 11 decimals (msats scale, 1e11).
const ODIN_DECIMALS = 11;
// Flat fee for any ledger op: 100,000 msats (100 sats), always paid in BTC.
const ODIN_FEE = 100000;

const constructUser = u => {
  if (isHex(u) && u.length === 64) {
    return {
      address: u,
    };
  } else {
    return {
      principal: Principal.fromText(u),
    };
  }
};
const tokenIdentifier = (principal, index) => {
  const padding = Buffer.from('\x0Atid');
  const array = new Uint8Array([
    ...padding,
    ...Principal.fromText(principal).toUint8Array(),
    ...to32bits(index),
  ]);
  return Principal.fromUint8Array(array).toText();
};
const decodeTokenId = tid => {
  var p = [...Principal.fromText(tid).toUint8Array()];
  var padding = p.splice(0, 4);
  if (toHexString(padding) !== toHexString(Buffer.from('\x0Atid'))) {
    return {
      index: 0,
      canister: tid,
      token: tokenIdentifier(tid, 0),
    };
  } else {
    return {
      index: from32bits(p.splice(-4)),
      canister: Principal.fromUint8Array(p).toText(),
      token: tid,
    };
  }
};

//Preload IDLS against a common name
const _preloadedIdls = {
  governance: governanceIDL,
  ledger: ledgerIDL,
  icpunks: icpunksIDL,
  nns: nnsIDL,
  ext: extIDL,
  icrc: icrcIDL,
  dip20: dip20IDL,
  drc20: drc20IDL,
  odin: odinIDL,
  default: extIDL,
  wrapper: wrapperIDL,
};

class ExtConnection {
  //map known canisters to preloaded IDLs
  _mapIdls = {
    [LEDGER_CANISTER_ID]: _preloadedIdls['ledger'],
    [GOVERNANCE_CANISTER_ID]: _preloadedIdls['governance'],
    [NNS_CANISTER_ID]: _preloadedIdls['nns'],
    'rkp4c-7iaaa-aaaaa-aaaca-cai': cyclesIDL,
    'qcg3w-tyaaa-aaaah-qakea-cai': _preloadedIdls['icpunks'],
    'jzg5e-giaaa-aaaah-qaqda-cai': _preloadedIdls['icpunks'],
    'xkbqi-2qaaa-aaaah-qbpqq-cai': _preloadedIdls['icpunks'],
    'q6hjz-kyaaa-aaaah-qcama-cai': _preloadedIdls['wrapper'],
    'bxdf4-baaaa-aaaah-qaruq-cai': _preloadedIdls['wrapper'],
    '3db6u-aiaaa-aaaah-qbjbq-cai': _preloadedIdls['wrapper'],
    'kxh4l-cyaaa-aaaah-qadaq-cai': advancedIDL,
    'qgsqp-byaaa-aaaah-qbi4q-cai': logIDL,
    'd3ttm-qaaaa-aaaai-qam4a-cai': icdripIDL,
  };
  _metadata = {
    [LEDGER_CANISTER_ID]: {
      id: LEDGER_CANISTER_ID,
      name: 'Internet Computer',
      symbol: 'ICP',
      standard: 'ledger',
      fee: 10000,
      type: 'fungible',
      decimals: 8,
    },
  };
  _identity = false; //new AnonymousIdentity();
  _host = false;
  _agent = false;
  _canisters = {};
  _standard = '';

  constructor(host, identity) {
    if (identity) this._identity = identity;
    if (host) this._host = host;
    this._makeAgent();
  }
  idl(canister, idl) {
    //Map a canister to a preloaded idl
    this._mapIdls[canister] = idl;
  }
  setIdentity(identity) {
    if (identity) this._identity = identity;
    else this._identity = false;
    this._makeAgent();
    return this;
  }
  setHost(host) {
    if (host) this._host = host;
    else this._host = false;
    this._makeAgent();
    return this;
  }
  canister(cid, idl) {
    if (!idl) {
      if (this._mapIdls.hasOwnProperty(cid)) {
        idl = this._mapIdls[cid];
      } else {
        idl = _preloadedIdls['default'];
      }
    } else if (typeof idl == 'string') {
      if (_preloadedIdls.hasOwnProperty(idl)) {
        idl = _preloadedIdls[idl];
      } else {
        throw new Error(idl + ' is not a preloaded IDL');
      }
    }
    if (!this._canisters.hasOwnProperty(cid)) {
      this._canisters[cid] = Actor.createActor(idl, {agent: this._agent, canisterId: cid});
    }
    return this._canisters[cid];
  }
  token(tid, standard) {
    if (!tid) {
      tid = LEDGER_CANISTER_ID;
      standard = 'ledger';
    } //defaults to ledger
    switch (standard) {
      case 'icpswap':
      case 'yumi':
        standard = 'ext';
        break;
      default:
    }
    // Odin tokens are registered by text token id (not a canister principal),
    // so skip canister-id decoding and pin them to the Odin ledger canister.
    // tokenObj.token carries the Odin token id (e.g. "btc", "hjsu").
    var tokenObj =
      standard === 'odin'
        ? {index: 0, canister: ODIN_LEDGER_CANISTER_ID, token: tid}
        : decodeTokenId(tid);
    let idl = this._standard;
    if (!standard) {
      if (this._mapIdls.hasOwnProperty(tokenObj.canister)) {
        idl = this._mapIdls[tokenObj.canister];
        this._standard = 'custom';
      } else {
        idl = _preloadedIdls['ext']; //ext is our token default...
        this._standard = 'ext';
      }
    } else {
      this._standard = standard;
      if (_preloadedIdls.hasOwnProperty(standard)) {
        idl = _preloadedIdls[standard];
      } else {
        throw new Error(standard + ' is not valid standard');
      }
    }
    var api = this.canister(tokenObj.canister, idl);
    return {
      call: api,
      getMetadata: async () => {
        // The metadata cache is keyed by canister id; every odin token shares
        // one ledger canister, so never serve it from that cache.
        if (this._standard !== 'odin' && this._metadata.hasOwnProperty(tokenObj.canister)) {
          return this._metadata[tokenObj.canister];
        }
        switch (this._standard) {
          case 'odin':
            try {
              const odinId = tokenObj.token;
              // BTC is the ledger's primary asset; tokens carry their text id as
              // the display name (Odin's ledger Token record has no name/ticker
              // — richer metadata would come from Odin's off-chain API).
              if (odinId === 'btc') {
                return {
                  id: tid,
                  standard: 'odin',
                  type: 'fungible',
                  name: 'Bitcoin',
                  symbol: 'BTC',
                  decimals: ODIN_DECIMALS,
                  fee: ODIN_FEE,
                };
              }
              // Resolve the pointer so an invalid token id fails fast on add.
              await api.odin_token_pointer(odinId);
              return {
                id: tid,
                standard: 'odin',
                type: 'fungible',
                name: odinId,
                symbol: odinId.toUpperCase(),
                decimals: ODIN_DECIMALS,
                // Fee is charged in BTC, not in this token, so the token itself
                // carries a 0 fee for display/validation purposes.
                fee: 0,
              };
            } catch (e) {
              throw e;
            }
          case 'icrc':
            try {
              let data = await api.icrc1_metadata();
              let ret = {};
              data.forEach(item => {
                const key = item[0].split(':')[1];
                const value = item[1].Text || Number(item[1].Nat);
                if (key === 'name' || key === 'symbol' || key === 'fee' || key === 'decimals') {
                  ret[key] = value;
                }
              });
              return {
                id: tid,
                standard: this._standard,
                type: 'fungible',
                ...ret,
              };
            } catch (e) {
              throw e; // or handle error as appropriate
            }
          case 'ext':
            try {
              const r = await api.metadata(tokenObj.token);
              let fee = 0;
              try {
                let res = await api.getFee();
                if (res) fee = Number(res.ok);
              } catch (e) {}
              if (typeof r.ok != 'undefined') {
                if (typeof r.ok.fungible != 'undefined') {
                  return {
                    id: tid,
                    name: r.ok.fungible.name,
                    symbol: r.ok.fungible.symbol,
                    standard: this._standard,
                    fee: fee,
                    type: 'fungible',
                    decimals: r.ok.fungible.decimals,
                    metadata: r.ok.fungible.metadata,
                  };
                } else {
                  var md = r.ok.nonfungible.metadata[0] ?? [];
                  if (md.length > 256) md = md.slice(0, 256);
                  return {
                    metadata: [md],
                    type: 'nonfungible',
                  };
                }
              } else if (typeof r.err != 'undefined') throw r.err;
            } catch (e) {
              throw e; // or handle error as appropriate
            }
            break;
          case 'dip20':
            try {
              const r = await api.getMetadata(tokenObj.token);
              return {
                id: tid,
                name: r.name,
                symbol: r.symbol,
                fee: Number(r.fee),
                decimals: Number(r.decimals),
                standard: this._standard,
                type: 'fungible',
                metadata: JSON.stringify(r),
              };
            } catch (e) {
              console.error(e);
              throw e; // or handle error as appropriate
            }
          case 'drc20':
            try {
              const r = await Promise.all([
                api.drc20_name(),
                api.drc20_symbol(),
                api.drc20_fee(),
                api.drc20_decimals(),
              ]);
              return {
                id: tid,
                name: r[0],
                symbol: r[1],
                fee: Number(r[2]),
                decimals: Number(r[3]),
                standard: this._standard,
                type: 'fungible',
                metadata: JSON.stringify(r),
              };
            } catch (e) {
              console.error(e);
              throw e; // or handle error as appropriate
            }
          default:
            throw new Error('Not supported');
        }
      },
      getBalance: async (address, principal, subaccount) => {
        switch (this._standard) {
          case 'ledger':
            let res;
            let attempts = 0;
            while (true) {
              try {
                res = await api.account_balance_dfx({
                  account: address,
                });
                break;
              } catch (e) {
                if (++attempts >= 5) throw e;
                console.error(e, 'retrying ledger balance in 2000ms (' + attempts + '/5)');
                await new Promise(r => setTimeout(r, 2000));
              }
            }
            return res.e8s;
          case 'ext':
            try {
              const args = {
                user: constructUser(address),
                token: tokenObj.token,
              };
              const r = await api.balance(args);
              if (typeof r.ok != 'undefined') return r.ok;
              else if (typeof r.err != 'undefined') throw r.err;
            } catch (e) {
              console.error(e);
              throw e; // or handle error as appropriate
            }
            break;

          case 'odin':
            try {
              // BTC = null subaccount; any other token = its 32-byte pointer.
              const subaccount =
                tokenObj.token === 'btc'
                  ? []
                  : [Array.from(await api.odin_token_pointer(tokenObj.token))];
              return await api.icrc1_balance_of({
                owner: Principal.fromText(principal),
                subaccount: subaccount,
              });
            } catch (e) {
              throw e;
            }
          case 'icrc':
            try {
              return await api.icrc1_balance_of({
                owner: Principal.fromText(principal),
                subaccount: [],
              });
            } catch (e) {
              throw e; // or handle error as appropriate
            }
          case 'dip20':
            try {
              return await api.balanceOf({
                who: Principal.fromText(principal),
              });
            } catch (e) {
              throw e; // or handle error as appropriate
            }
          case 'drc20':
            try {
              return await api.drc20_balanceOf(address);
            } catch (e) {
              throw e; // or handle error as appropriate
            }
          default:
            throw new Error('Not supported');
        }
      },
      transfer: async (from_principal, from_sa, to_user, amount, fee, memo, notify) => {
        var args;
        switch (this._standard) {
          case 'ledger':
            try {
              var toAddress = to_user;
              if (notify) {
                if (!validatePrincipal(toAddress))
                  throw new Error(
                    'You can only use notify when specifying a Principal as the To address',
                  );
                toAddress = principalToAccountIdentifier(toAddress, 0);
              } else {
                if (validatePrincipal(toAddress))
                  toAddress = principalToAccountIdentifier(toAddress, 0);
              }
              args = {
                from_subaccount: [getSubAccountArray(from_sa ?? 0)],
                to: toAddress,
                amount: {e8s: amount},
                fee: {e8s: fee},
                memo: memo ? BigInt(memo) : 0,
                created_at_time: [],
              };
              const bh = await api.send_dfx(args);
              if (notify) {
                args = {
                  block_height: bh,
                  max_fee: {e8s: fee},
                  from_subaccount: [getSubAccountArray(from_sa ?? 0)],
                  to_subaccount: [getSubAccountArray(0)],
                  to_canister: Principal.fromText(to_user),
                };
                await api.notify_dfx(args);
              }
              return bh; // Success - returns the ledger block height (truthy)
            } catch (e) {
              console.error(e);
              throw e; // or handle error as appropriate
            }

          case 'ext':
            args = {
              token: tid,
              from: {address: principalToAccountIdentifier(from_principal, from_sa ?? 0)},
              subaccount: [getSubAccountArray(from_sa ?? 0)],
              to: constructUser(to_user),
              amount: amount,
              fee: fee,
              memo: fromHexString(memo),
              notify: notify,
            };
            try {
              const b = await api.transfer(args);
              if (typeof b.ok != 'undefined') {
                return b.ok;
              } else {
                throw new Error(JSON.stringify(b.err));
              }
            } catch (e) {
              console.error(e);
              throw e;
            }
          case 'odin':
            if (!validatePrincipal(to_user))
              throw new Error('Odin transfers must be sent to a principal');
            try {
              // ICRC-80: from_subaccount and to.subaccount must be the SAME
              // token pointer (null for BTC). The fee is fixed and paid in BTC
              // by the ledger, so fee/memo/created_at_time must be null.
              const sub =
                tokenObj.token === 'btc'
                  ? []
                  : [Array.from(await api.odin_token_pointer(tokenObj.token))];
              args = {
                to: {owner: Principal.fromText(to_user), subaccount: sub},
                fee: [],
                memo: [],
                from_subaccount: sub,
                created_at_time: [],
                amount: amount,
              };
              const b = await api.icrc1_transfer(args);
              if (typeof b.Ok != 'undefined') {
                return b.Ok;
              } else if (typeof b.ok != 'undefined') {
                return b.ok;
              } else {
                const err = b.Err ?? b.err;
                if (err && err.GenericError) throw new Error(err.GenericError.message);
                throw new Error(JSON.stringify(err));
              }
            } catch (e) {
              console.error(e);
              throw e;
            }
          case 'icrc':
            if (!validatePrincipal(to_user))
              throw new Error('Current you can only send to principals');
            args = {
              to: {
                owner: Principal.fromText(to_user),
                subaccount: [],
              },
              fee: [fee],
              memo: [],
              from_subaccount: [getSubAccountArray(from_sa ?? 0)],
              created_at_time: [],
              amount: amount,
            };
            try {
              const b = await api.icrc1_transfer(args);
              if (typeof b.Ok != 'undefined') {
                return b.Ok;
              } else if (typeof b.ok != 'undefined') {
                return b.ok;
              } else if (typeof b.Err != 'undefined') {
                throw new Error(JSON.stringify(b.Err));
              } else {
                throw new Error(JSON.stringify(b.err));
              }
            } catch (e) {
              console.error(e);
              throw e;
            }
          case 'dip20':
            if (!validatePrincipal(to_user))
              throw new Error('Current you can only send to principals');
            try {
              const b = await api.transfer(Principal.fromText(to_user), amount);
              if (typeof b.ok != 'undefined') {
                return b.ok;
              } else {
                throw new Error(JSON.stringify(b.err));
              }
            } catch (e) {
              throw e;
            }
          case 'drc20':
            try {
              const b = await api.drc20_transfer(
                to_user,
                amount,
                [],
                [getSubAccountArray(from_sa ?? 0)],
                [],
              );
              if (typeof b.ok != 'undefined') {
                return b.ok;
              } else {
                throw new Error(JSON.stringify(b.err));
              }
            } catch (e) {
              console.error(e);
              throw e;
            }
          default:
            throw new Error('Not supported');
        }
      },
      mintCycles: async (from_principal, from_sa, canister, amount, fee) => {
        switch (this._standard) {
          case 'ledger':
            try {
              var _to_sub = getCyclesTopupSubAccount(canister);
              var _to = principalToAccountIdentifier(CYCLES_MINTING_CANISTER_ID, _to_sub);
              var args = {
                from_subaccount: [getSubAccountArray(from_sa ?? 0)],
                to: _to,
                fee: {e8s: fee},
                memo: Number(BigInt('0x50555054')),
                created_at_time: [],
                amount: {e8s: amount},
              };
              const block = await api.send_dfx(args);
              // New cmc_notify flow: notify the Cycles Minting Canister directly via
              // notify_top_up, replacing the deprecated ledger notify_dfx ->
              // transaction_notification push. See:
              // https://forum.dfinity.org/t/deprecating-the-ledger-notify-flow-for-minting-cycles-in-favor-of-cmc-notify/42502
              const cmc = this.canister(CYCLES_MINTING_CANISTER_ID, cyclesIDL);
              const notifyRes = await cmc.notify_top_up({
                block_index: BigInt(block),
                canister_id: Principal.fromText(canister),
              });
              if (notifyRes.Err !== undefined) {
                throw new Error(
                  'Cycles top-up notification failed: ' +
                    JSON.stringify(notifyRes.Err, (k, v) =>
                      typeof v === 'bigint' ? v.toString() : v,
                    ),
                );
              }
              return true; // notifyRes.Ok holds the cycles minted
            } catch (e) {
              throw e; // or handle error as appropriate
            }
          default:
            throw new Error('Cycle topup is not supported by this token');
        }
      },
    };
  }

  _makeAgent() {
    var args = {};
    if (this._identity) args['identity'] = this._identity;
    if (this._host) args['host'] = this._host;
    this._agent = new HttpAgent(args);
  }
}

const extjs = {
  connect: (host, identity) => new ExtConnection(host ?? 'https://icp0.io/', identity),
  decodeTokenId: decodeTokenId,
  encodeTokenId: tokenIdentifier,
  toSubaccount: getSubAccountArray,
  toAddress: principalToAccountIdentifier,
  fromHexString: fromHexString,
};
export default extjs;
window.extjs = extjs;
