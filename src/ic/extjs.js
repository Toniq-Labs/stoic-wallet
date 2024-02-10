/* global BigInt */
import {Actor, HttpAgent} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
import {
  LEDGER_CANISTER_ID,
  GOVERNANCE_CANISTER_ID,
  NNS_CANISTER_ID,
  CYCLES_MINTING_CANISTER_ID,
  getCyclesTopupSubAccount,
  rosettaApi,
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
import hzldIDL from './candid/hzld.did.js'; //hardcode to hzld...
import icpunksIDL from './candid/icpunks.did.js'; //hardcode to icpunks...
import extIDL from './candid/ext.did.js';
import advancedIDL from './candid/advanced.did.js';
import wrapperIDL from './candid/wrapper.did.js';
import logIDL from './candid/log.did.js';
import icdripIDL from './candid/icdrip.did.js';
//import cronicsIDL from './candid/cronics.did.js';

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
//TODO add standards here
const _preloadedIdls = {
  governance: governanceIDL,
  ledger: ledgerIDL,
  hzld: hzldIDL,
  icpunks: icpunksIDL,
  nns: nnsIDL,
  ext: extIDL,
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
      name: 'ICP',
      symbol: 'ICP',
      decimals: 8,
      type: 'fungible',
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
    }
    var api = this.canister(tokenObj.canister, idl);
    return {
      call: api,
      fee: () => {
        return new Promise((resolve, reject) => {
          switch (this._standard) {
            case "ledger":
              resolve(10000);
              break;
            default:
              //TODO compute fees
              resolve(0);
              break;
          }
        });
      },
      getMetadata: () => {
        switch (this._standard) {
          //TODO maybe inject this?
          case 'icpunks':
            return new Promise((resolve, reject) => {
              api.data_of(tokenObj.index).then(r => {
                resolve({
                  metadata: [
                    [],
                    {
                      name: r.name,
                      desc: r.desc,
                      properties: r.properties,
                      url: r.url,
                    },
                  ],
                  type: 'nonfungible',
                });
              });
            });
          case "ext":
            return new Promise((resolve, reject) => {
              if (this._metadata.hasOwnProperty(tokenObj.canister)) {
                resolve(this._metadata[tokenObj.canister]);
              } else {
                switch (tokenObj.canister) {
                  default:
                    api
                      .metadata(tokenObj.token)
                      .then(r => {
                        if (typeof r.ok != 'undefined') {
                          if (typeof r.ok.fungible != 'undefined') {
                            resolve({
                              name: r.ok.fungible.name,
                              symbol: r.ok.fungible.symbol,
                              decimals: r.ok.fungible.decimals,
                              metadata: r.ok.fungible.metadata,
                              type: 'fungible',
                            });
                          } else {
                            var md = r.ok.nonfungible.metadata[0] ?? [];
                            if (md.length > 256) md = md.slice(0, 256);
                            resolve({
                              metadata: [md],
                              type: 'nonfungible',
                            });
                          }
                        } else if (typeof r.err != 'undefined') reject(r.err);
                        else reject(r);
                      })
                      .catch(reject);
                    break;
                }
              }
            });
          default:
            return new Promise((resolve, reject) => {
              reject('Not supported');
            });
        }
      },
      getBalance: (address, princpal) => {
        return new Promise((resolve, reject) => {
          var args;
          switch (this._standard) {
            case "ledger":
              // rosettaApi.getAccountBalance(address).then(b => {
              //   resolve(b)
              // });
              const Http = new XMLHttpRequest();
              const url = 'https://ledger-api.internetcomputer.org/accounts/' + address;
              Http.open('GET', url);
              Http.send();
              Http.onreadystatechange = e => {
                if (Http.responseText.length > 0) {
                  try {
                    if (Http.responseText == 'An error occurred while retrieving the account.') {
                      resolve(0);
                    } else {
                      let r = JSON.parse(Http.responseText);
                      resolve(r.balance);
                    }
                  } catch (e) {
                    reject(e);
                  }
                }
              };
              break;
            case "ext":
              args = {
                user: constructUser(address),
                token: tokenObj.token,
              };
              api
                .balance(args)
                .then(r => {
                  if (typeof r.ok != 'undefined') resolve(r.ok);
                  else if (typeof r.err != 'undefined') reject(r.err);
                  else reject(r);
                })
                .catch(reject);
              break;
            default:
              reject('Not supported');
              break;
          }
        });
      },
      transfer: (from_principal, from_sa, to_user, amount, fee, memo, notify) => {
        return new Promise((resolve, reject) => {
          var args;
          switch (this._standard) {
            case "ledger":
              var toAddress = to_user;
              var toPrincpal;
              if (notify) {
                if (!validatePrincipal(toAddress))
                  reject('You can only use notify when specifying a Principal as the To address');
                toPrincpal = toAddress;
                toAddress = principalToAccountIdentifier(toPrincpal, 0);
              } else {
                if (validatePrincipal(toAddress))
                  toAddress = principalToAccountIdentifier(toAddress, 0);
              }
              args = {
                from_subaccount: [getSubAccountArray(from_sa ?? 0)],
                to: toAddress, //Should be an address
                amount: {e8s: amount},
                fee: {e8s: fee},
                memo: memo ? Number(BigInt(memo)) : 0,
                created_at_time: [],
              };
              api
                .send_dfx(args)
                .then(bh => {
                  if (notify) {
                    var args = {
                      block_height: bh,
                      max_fee: {e8s: fee},
                      from_subaccount: [getSubAccountArray(from_sa ?? 0)],
                      to_subaccount: [getSubAccountArray(0)],
                      to_canister: Principal.fromText(toPrincpal),
                    };
                    api.notify_dfx(args).then(resolve).catch(reject);
                  } else {
                    resolve(true);
                  }
                })
                .catch(reject);
              //Notify here
              break;
            //TODO: maybe inject this?
            case 'icpunks':
              if (!validatePrincipal(to_user))
                reject('ICPunks does not support traditional addresses, you must use a Principal');
              api
                .transfer_to(Principal.fromText(to_user), tokenObj.index)
                .then(b => {
                  if (b) {
                    resolve(true);
                  } else {
                    reject('Something went wrong');
                  }
                })
                .catch(reject);
              break;
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
              api
                .transfer(args)
                .then(b => {
                  if (typeof b.ok != 'undefined') {
                    resolve(b.ok);
                  } else {
                    reject(JSON.stringify(b.err));
                  }
                })
                .catch(reject);
              break;
            default:
              reject('Not supported');
              break;
          }
        });
      },
      mintCycles: (from_principal, from_sa, canister, amount, fee) => {
        return new Promise((resolve, reject) => {
          switch (this._standard) {
            case "ledger":
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
              api
                .send_dfx(args)
                .then(block => {
                  var args = {
                    block_height: block,
                    max_fee: {e8s: fee},
                    from_subaccount: [getSubAccountArray(from_sa ?? 0)],
                    to_subaccount: [getSubAccountArray(_to_sub)],
                    to_canister: Principal.fromText(CYCLES_MINTING_CANISTER_ID),
                  };
                  api.notify_dfx(args).then(resolve).catch(reject);
                })
                .catch(reject);
              break;
            default:
              reject('Cycle topup is not supported by this token');
              break;
          }
        });
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
