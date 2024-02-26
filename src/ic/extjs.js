/* global BigInt */
import {Actor, HttpAgent} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
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
import drc20IDL from './candid/drc20.did.js';//TODO

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
  const padding = Buffer('\x0Atid');
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
  if (toHexString(padding) !== toHexString(Buffer('\x0Atid'))) {
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
      id : LEDGER_CANISTER_ID,
      name : "Internet Computer",
      symbol: 'ICP',
      standard : 'ledger',
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
      standard = "ledger";
    }//defaults to ledger
    switch(standard) {
      case 'icpswap':
      case 'yumi':
        standard = 'ext';
        break;
      default:;
    }
    var tokenObj = decodeTokenId(tid);
    let idl = this._standard;
    if (!standard) {
      if (this._mapIdls.hasOwnProperty(tokenObj.canister)) {
        idl = this._mapIdls[tokenObj.canister];
        this._standard = "custom";
      } else {
        idl = _preloadedIdls['ext']; //ext is our token default...
        this._standard = "ext";
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
        if (this._metadata.hasOwnProperty(tokenObj.canister)) {
          return this._metadata[tokenObj.canister];
        }
        switch (this._standard) {
          case "icrc":
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
          case "ext":
            try {
              const r = await api.metadata(tokenObj.token);
              let fee = 0;
              try {
                let res = await api.getFee();
                if (res) fee = Number(res.ok);
              } catch(e){};
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
          case "dip20":
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
                metadata: JSON.stringify(r)
              };
            } catch (e) {
              console.error(e);
              throw e; // or handle error as appropriate
            }
          case "drc20":
            try {
              const r = await Promise.all([
                api.drc20_name(),
                api.drc20_symbol(),
                api.drc20_fee(),
                api.drc20_decimals(),
              ])
              return {
                id: tid,
                name: r[0],
                symbol: r[1],
                fee: Number(r[2]),
                decimals: Number(r[3]),
                standard: this._standard,
                type: 'fungible',
                metadata: JSON.stringify(r)
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
          case "ledger":
            let res;
            while(true){
              try {
                res = await api.account_balance_dfx({
                  account: address,
                });
                break;
              } catch(e) {
                console.error(e, "trying again in 1000ms");
                await new Promise(r => setTimeout(r, 2000));
              }
            }
            return res.e8s;
          case "ext":
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
          
          case "icrc":
            try {
              return await api.icrc1_balance_of({
                owner: Principal.fromText(principal),
                subaccount: [],
              });
            } catch (e) {
              throw e; // or handle error as appropriate
            }
          case "dip20":
            try {
              return await api.balanceOf({
                who: Principal.fromText(principal),
              });
            } catch (e) {
              throw e; // or handle error as appropriate
            }
          case "drc20":
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
          case "ledger":
            try {
              var toAddress = to_user;
              if (notify) {
                if (!validatePrincipal(toAddress))
                  throw new Error('You can only use notify when specifying a Principal as the To address');
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
                memo: memo ? Number(BigInt(memo)) : 0,
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
              return true; // Success
            } catch (e) {
              console.error(e);
              throw e; // or handle error as appropriate
            }
            
          case "ext":
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
          case "icrc":
            if (!validatePrincipal(to_user))  throw new Error('Current you can only send to principals');
            args = {
              to : {
                owner : Principal.fromText(to_user),
                subaccount : [],
              },
              fee: [fee],
              memo: [],
              from_subaccount : [getSubAccountArray(from_sa ?? 0)],
              created_at_time : [],
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
          case "dip20":
            if (!validatePrincipal(to_user))  throw new Error('Current you can only send to principals');
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
          case "drc20":
            try {
              const b = await api.drc20_transfer(to_user, amount, [], [getSubAccountArray(from_sa ?? 0)], []);
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
          case "ledger":
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
              args = {
                block_height: block,
                max_fee: {e8s: fee},
                from_subaccount: [getSubAccountArray(from_sa ?? 0)],
                to_subaccount: [getSubAccountArray(_to_sub)],
                to_canister: Principal.fromText(CYCLES_MINTING_CANISTER_ID),
              };
              await api.notify_dfx(args);
              return true; // Success
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
