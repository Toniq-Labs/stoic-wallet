import { Actor, HttpAgent, Principal } from "@dfinity/agent";  
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { AuthClient } from "@dfinity/auth-client";
import idlFactory from './ledger.did.js';
import { getCrc32 } from '@dfinity/agent/lib/esm/utils/getCrc';
import { sha224 } from '@dfinity/agent/lib/esm/utils/sha224';
import RosettaApi from './util/RosettaApi.js';
const sjcl = require('sjcl')
const bip39 = require('bip39')
const pbkdf2 = require("pbkdf2");
const canisterId = "ryjl3-tyaaa-aaaaa-aaaba-cai";

//Helpers
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
  return Array(28).fill(0).concat(to32bits(s ? s : 0))
};
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
const mnemonicToId = (mnemonic) => {
  var seed = bip39.mnemonicToSeedSync(mnemonic);
  seed = Array.from(seed);
  seed = seed.splice(0, 32);
  seed = new Uint8Array(seed);
  return Ed25519KeyIdentity.generate(seed);
}
const encrypt = (mnemonic, principal, password) => {
  return sjcl.encrypt(pbkdf2.pbkdf2Sync(password, principal, 30000, 512, 'sha512').toString(), btoa(mnemonic));
}
const decrypt = (data, principal, password) => {
  return sjcl.decrypt(pbkdf2.pbkdf2Sync(password, principal, 30000, 512, 'sha512').toString(), data);
}
//Initiates the API
var identity, API, authClient;
const init = async () => {
  authClient = await AuthClient.create();
  var id = await authClient.getIdentity();
  initAPI(id);
}
const initAPI = (id, type) => {
  identity = id;
  API = Actor.createActor(idlFactory, {
    agent: new HttpAgent({
      host: "https://boundary.ic0.app/",
      identity,
    }),
    canisterId,
  });
  return {
    principal : identity.getPrincipal().toString(),
    type : type ?? 'default'
  };
}
const rosettaApi = new RosettaApi();
var ICPLedger = {
  //Identity management
  init : init,
  //When generating a new identity to use with the wallet
  setup : (o) => { //promise
    return new Promise((resolve, reject) => {
      switch(o.type){
        case "ii":
          authClient.login({
            identityProvider: "https://identity.ic0.app/",
            onSuccess: async () => {
              var id = await authClient.getIdentity()
              resolve(initAPI(id, o.type));
            },
          });
          break;
        case "private":
          localStorage.setItem('_m', o.mnemonic);
          var id = mnemonicToId(o.mnemonic);
          var _em = encrypt(o.mnemonic, id.getPrincipal().toString(), o.password);
          localStorage.setItem('_em', _em);
          resolve(initAPI(id, o.type));
          break;
      }
    });
  },
  //Check if a stored identity is currently unlocked and ready to use. This must be called prior to any API calls as the potential user
  load : (o) => {
    switch(o.type){
      case "ii":
        if (identity.getPrincipal().toString() != '2vxsx-fae') {
          return { 
            principal : identity.getPrincipal().toString(),
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
          authClient.login({
            identityProvider: "https://identity.ic0.app/",
            onSuccess: async () => {
              var id = await authClient.getIdentity()
              resolve(initAPI(id, o.type));
            },
          });
          break;
        case "private":
          var t = localStorage.getItem('_em');
          if (!t) return reject("No encrypted data to decrypt");
          
          var mnemonic = atob(decrypt(t, o.principal, o.password));
          localStorage.setItem('_m', mnemonic);
          var id = mnemonicToId(mnemonic);
          resolve(initAPI(id, o.type));
          break;
      }
    });
  },
  //Lock and clear stored identities
  lock : (o) => {
    switch(o.type){
      case "ii":
          authClient.logout();
          initAPI(identity);
        break;
      case "private":
          localStorage.removeItem("_m");
        break;
    }
  },
  clear : (o) => {
    switch(o.type){
      case "ii":
          authClient.logout();
        break;
      case "private":
          localStorage.removeItem("_m");
          localStorage.removeItem("_em");
        break;
    }
  },
  
  //Helpers
  p2aid : principalToAccountIdentifier,
  getIdentity : () => identity,
  validateMnemonic : bip39.validateMnemonic,
  generateMnemonic : bip39.generateMnemonic,
  //Ledger API
  getBalance : (aid) => {
    return new Promise((resolve, reject) => {
      rosettaApi.getAccountBalance(aid).then(b => {        
        resolve(Number(b)/(10**8))
      });
    });
  },
  getTokenBalance : (tid, aid) => {
    //TODO
    return ICPLedger.getBalance(aid);
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
  transfer : async (to_aid, fee, memo, from_sub, amount) => {
    var sargs = {
      "to" : to_aid, 
      "fee" : { "e8s" : fee*100000000 }, 
      "memo" : memo, 
      "from_subaccount" : [getSubAccountArray(from_sub)], 
      "created_at_time" : [], 
      "amount" : { "e8s" : amount*100000000}
    };
    var b = await API.send_dfx(sargs)
    return b;
  },
}
export {ICPLedger};