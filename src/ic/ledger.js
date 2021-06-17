/* global BigInt */
import { Actor, HttpAgent, Principal } from "@dfinity/agent";  
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { AuthClient } from "@dfinity/auth-client";
import ledgerIDL from './ledger.did.js';
import hzldIDL from './hzld.did.js'; //hardcode to hzld...
import extIDL from './ext.did.js';
import { getCrc32 } from '@dfinity/agent/lib/esm/utils/getCrc';
import { sha224 } from '@dfinity/agent/lib/esm/utils/sha224';
import RosettaApi from '../util/RosettaApi.js';
//Helpers
const sjcl = require('sjcl')
const bip39 = require('bip39')
const pbkdf2 = require("pbkdf2");
const LEDGERCANISTER = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const CMINTINGCANISTER = "rkp4c-7iaaa-aaaaa-aaaca-cai";
const principalToAccountIdentifier = (p, s) => {
  const padding = Buffer("\x0Aaccount-id");
  const array = new Uint8Array([
      ...padding,
      ...Principal.fromText(p).toBlob(),
      ...getSubAccountArray(s)
  ]);
  const hash = sha224(array);
  const checksum = to32bits(getCrc32(hash));
  const array2 = new Uint8Array([
      ...checksum,
      ...hash
  ]);
  return toHexString(array2);
};

const getSubAccountArray = (s) => {
  if (Array.isArray(s)){
    return s.concat(Array(32-s.length).fill(0));
  } else {
    //32 bit number only
    return Array(28).fill(0).concat(to32bits(s ? s : 0))
  }
};
const from32bits = ba => {
  var value;
  for (var i = 0; i < 4; i++) {
    value = (value << 8) | ba[i];
  }
  return value;
}
const to32bits = num => {
  let b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
}
const toHexString = (byteArray)  =>{
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}
const fromHexString = (hex) => {
  if (hex.substr(0,2) == "0x") hex = hex.substr(2);
  for (var bytes = [], c = 0; c < hex.length; c += 2)
  bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}
const mnemonicToId = (mnemonic) => {
  var seed = bip39.mnemonicToSeedSync(mnemonic);
  seed = Array.from(seed);
  seed = seed.splice(0, 32);
  seed = new Uint8Array(seed);
  return Ed25519KeyIdentity.generate(seed);
}
const encrypt = (mnemonic, principal, password) => {
  return new Promise((resolve, reject) => {
    pbkdf2.pbkdf2(password, principal, 30000, 512, 'sha512', (e, d) => {
      if (e) return reject(e);
      resolve(sjcl.encrypt(d.toString(), btoa(mnemonic)));
    });
  });
}
const decrypt = (data, principal, password) => {
  return new Promise((resolve, reject) => {
    pbkdf2.pbkdf2(password, principal, 30000, 512, 'sha512', (e, d) => {
      if (e) return reject(e);
      resolve(atob(sjcl.decrypt(d.toString(), data)));
    });
  });
}
const tokenIdentifier = (principal, index) => {
  const padding = Buffer("\x0Atid");
  const array = new Uint8Array([
      ...padding,
      ...Principal.fromText(principal).toBlob(),
      ...to32bits(index),
  ]);
  return Principal.fromBlob(array).toText();
};
const decodeTokenId = (tid) => {
  var p = [...Principal.fromText(tid).toBlob()];
  var padding = p.splice(0, 4);
  if (toHexString(padding) != toHexString(Buffer("\x0Atid"))) {
    return {
      canister : tid
    };
  } else {
    return {
      index : from32bits(p.splice(-4)), 
      canister : Principal.fromBlob(p).toText()
    };
  }
};
const getCyclesTopupAddress = (canisterId) => {
  return principalToAccountIdentifier(CMINTINGCANISTER, getCyclesTopupSubAccount(canisterId));
}
const getCyclesTopupSubAccount = (canisterId) => {
  var pb = Array.from(Principal.fromText(canisterId).toBlob());
  return [pb.length, ...pb];
}
const constructUser = (u) => {
  if (isHex(u) && u.length == 64) {
    return { 'address' : u };
  } else {
    return { 'principal' : Principal.fromText(u) };
  };
};
const isHex = (h) => {
  var regexp = /^[0-9a-fA-F]+$/;
  return regexp.test(h);
};
//Initiates the API
var IDENTITY, API, AUTH, AGENT;
const init = async () => {
  AUTH = await AuthClient.create();
  var id = await AUTH.getIdentity();
  initAPI(id);
}
const initAPI = (id, type) => {
  IDENTITY = id;
  AGENT = new HttpAgent({
    host: "https://boundary.ic0.app/",
    identity : IDENTITY,
  });
  //Ledger API
  window.API = API;
  API = Actor.createActor(ledgerIDL, {agent : AGENT, canisterId : LEDGERCANISTER});
  return {
    principal : IDENTITY.getPrincipal().toString(),
    type : type ?? 'default'
  };
}
//temp for hzld support - main support is for ext
//could create something to support non-ext standards
const HZLD_CID = 'qz7gu-giaaa-aaaaf-qaaka-cai';
const _getTokenBalance_hzld = (aid, decimals) => {
  //ignore decimals with hzld..
  return new Promise((resolve, reject) => {
    var _api = Actor.createActor(hzldIDL, {agent : AGENT, canisterId : HZLD_CID});
    var args = {
      "user" : IDENTITY.getPrincipal()
    };
    _api.getBalanceInsecure(args).then(b => {
      var bal = b.length == 0 ? 0 : b[0];
      resolve(Number(bal));
    }).catch(reject);
  });
};
const _transferTokens_hzld = (to, amount, memo, decimals) => {
  //ignore decimals with hzld..
  return new Promise((resolve, reject) => {
    var _api = Actor.createActor(hzldIDL, {agent : AGENT, canisterId : HZLD_CID});
    var args = {
      "to" : Principal.fromText(to), 
      "metadata" : [],  //memo here maybe
      "from" : IDENTITY.getPrincipal(),
      "amount" : amount
    };
    _api.transfer(args).then(b => {
      if (typeof b.ok != 'undefined') {          
        resolve();
      } else {
        reject(b.err);
      }
    }).catch(reject);
  });
};


const rosettaApi = new RosettaApi();
const ICPLedger = {
  init : init,
  //When generating a new identity to use with the wallet
  setup : (o) => { //promise
    return new Promise((resolve, reject) => {
      switch(o.type){
        case "ii":
          AUTH.login({
            identityProvider: "https://identity.ic0.app/",
            onSuccess: async () => {
              var id = await AUTH.getIdentity()
              resolve(initAPI(id, o.type));
            },
          });
          break;
        case "private":
          localStorage.setItem('_m', o.mnemonic);
          var id = mnemonicToId(o.mnemonic);
          encrypt(o.mnemonic, id.getPrincipal().toString(), o.password).then(_em => {
            localStorage.setItem('_em', _em);
            resolve(initAPI(id, o.type));            
          });
      }
    });
  },
  //Check if a stored identity is currently unlocked and ready to use. This must be called prior to any API calls as the potential user
  load : (o) => {
    switch(o.type){
      case "ii":
        if (IDENTITY.getPrincipal().toString() != '2vxsx-fae') {
          return { 
            principal : IDENTITY.getPrincipal().toString(),
            type : o.type
          }
        } else return false;
        break;
      case "private":
        var t = localStorage.getItem('_m');
        if (!t) return false;
        var mnemonic = t;
        var id = mnemonicToId(mnemonic);
        return initAPI(id, o.type);
        break;
    }
  },
  
  //Unlocked a stored identity that is currently locked
  unlock : (o) => { //promise
    return new Promise((resolve, reject) => {
      var tl = ICPLedger.load(o);
      if (tl) return resolve(tl);
      switch(o.type){
        case "ii":
          AUTH.login({
            identityProvider: "https://identity.ic0.app/",
            onSuccess: async () => {
              var id = await AUTH.getIdentity()
              resolve(initAPI(id, o.type));
            },
          });
          break;
        case "private":
          var t = localStorage.getItem('_em');
          if (!t) return reject("No encrypted data to decrypt");
          decrypt(t, o.principal, o.password).then(mnemonic => {
            localStorage.setItem('_m', mnemonic);
            var id = mnemonicToId(mnemonic);
            resolve(initAPI(id, o.type));
          });
          break;
      }
    });
  },
  //Lock and clear stored identities
  lock : (o) => {
    switch(o.type){
      case "ii":
          AUTH.logout();
          initAPI(IDENTITY);
        break;
      case "private":
          localStorage.removeItem("_m");
        break;
    }
  },
  clear : (o) => {
    switch(o.type){
      case "ii":
          AUTH.logout();
        break;
      case "private":
          localStorage.removeItem("_m");
          localStorage.removeItem("_em");
        break;
    }
  },
  
  //Helpers
  p2aid : principalToAccountIdentifier,
  getIdentity : () => IDENTITY,
  isAuthenticated : (o) => {
    switch(o.type){
      case "ii":
          return AUTH.isAuthenticated()
        break;
      case "private":
          return new Promise((resolve, reject) => {
            resolve(localStorage.getItem("_m") != null);
          });
        break;
    }
  },
  validateMnemonic : bip39.validateMnemonic,
  generateMnemonic : bip39.generateMnemonic,
  //Ledger API
  getBalance : (aid, decimals) => {
    return new Promise((resolve, reject) => {
      rosettaApi.getAccountBalance(aid).then(b => {        
        resolve(Number(b)/(10**decimals))
      });
    });
  },
  getTokenBalance : (cid, aid, decimals) => {
    if (cid == HZLD_CID) return _getTokenBalance_hzld(aid, decimals);
    return new Promise((resolve, reject) => {
      var tdec = decodeTokenId(cid);
      var _api = Actor.createActor(extIDL, {agent : AGENT, canisterId : tdec.canister});
      var args = {
        "user" : constructUser(aid),
        'token' : cid
      };
      _api.balance(args).then(r => {
        if (typeof r.ok != 'undefined') resolve(Number(r.ok)/10**decimals)
        else if (typeof r.err != 'undefined') reject(r.err)
        else reject(r);
      }).catch(e => {
        reject(e);
      });
    });
  },
  getTokenMetadata : (cid) => {
    return new Promise((resolve, reject) => {
      var tdec = decodeTokenId(cid);
      var _api = Actor.createActor(extIDL, {agent : AGENT, canisterId : tdec.canister});
      _api.metadata(cid).then(r => {
        if (typeof r.ok != 'undefined') resolve(r.ok) //we want fungible in most cases....
        else if (typeof r.err != 'undefined') reject(r.err)
        else reject(r);
      }).catch(e => {
        reject(e);
      });
    });
  },
  getTransactions : (aid, i) => {
    return new Promise((resolve, reject) => {
      rosettaApi.getTransactionsByAccount(aid).then(ts => {    
        if (!Array.isArray(ts)) return;
        var _ts = [];
        ts.map(_t => {
          if (_t.type != "TRANSACTION") return;
          if (_t.status != "COMPLETED") return;
          _ts.push({
            from : _t.account1Address,
            to :  _t.account2Address,
            amount : Number(_t.amount)/(10**8),
            fee : Number(_t.fee)/(10**8),
            hash : _t.hash,
            timestamp : _t.timestamp,
          });
        });
        resolve(_ts);
      });
    });
  },
  transfer : async (to, fee, memo, from_sub, amount) => {
    var args = {
      "to" : to, 
      "fee" : { "e8s" : BigInt(fee*100000000) }, 
      "memo" : memo ? BigInt(memo) : 0n, 
      "from_subaccount" : [getSubAccountArray(from_sub)], 
      "created_at_time" : [], 
      "amount" : { "e8s" : BigInt(amount*100000000) }
    };
    var b = await API.send_dfx(args)
    return b;
  },
  notify : async (block, fee, from_sub, p, to_sub) => {
    var args = {
      "block_height" : block,
      "max_fee": {e8s: fee*100000000},
      "from_subaccount": [getSubAccountArray(from_sub)],
      "to_subaccount": [getSubAccountArray(to_sub)],
      "to_canister": Principal.fromText(p)
    };
    await API.notify_dfx(args)
  },
  transferAndNotify : async (p, to_sub, fee, memo, from_sub, amount) => {
    var b = await ICPLedger.transfer(principalToAccountIdentifier(p, to_sub), fee, memo, from_sub, amount);
    console.log("New block added", b);
    await ICPLedger.notify(b, fee, from_sub, p, to_sub);
  },
  transferTokens : async (cid, to, fee, memo, from_sub, amount, decimals) => {
    if (cid == HZLD_CID) return _transferTokens_hzld(to, amount, memo, decimals);
    return new Promise((resolve, reject) => {
      var tdec = decodeTokenId(cid);
      var _api = Actor.createActor(extIDL, {agent : AGENT, canisterId : tdec.canister});
      var args = {
        'to' : constructUser(to),
        'fee' : BigInt(fee * (10**decimals)),
        'token' : cid,
        'notify' : false, //hard coded for now
        'from' : { 'address' : principalToAccountIdentifier(IDENTITY.getPrincipal().toText(), from_sub) },
        'memo' : fromHexString(memo),
        'subaccount' : [getSubAccountArray(from_sub)],
        'amount' : BigInt(amount * (10**decimals))
      };
      console.log(args);
      _api.transfer(args).then(b => {
        if (typeof b.ok != 'undefined') {          
          resolve();
        } else {
          console.log(b.err);
          console.log(JSON.stringify(b.err));
          reject(JSON.stringify(b.err));
        }
      }).catch(reject);
    });
  },
  convertCycles : async (cid, fee, from_sub, amount) => {
    return await ICPLedger.transferAndNotify(CMINTINGCANISTER, getCyclesTopupSubAccount(cid), fee, "0x50555054", from_sub, amount);
  },
  notifyCycles : async (blockHeight, cid, fee, from_sub) => {
    await ICPLedger.notify(blockHeight, fee, from_sub, CMINTINGCANISTER, getCyclesTopupSubAccount(cid));
  }
}
window.ICPLedger = ICPLedger;
export {ICPLedger};