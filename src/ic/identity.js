/* global BigInt */
import { Principal } from "@dfinity/agent";  
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { AuthClient } from "@dfinity/auth-client";
import { 
  mnemonicToId, 
  validatePrincipal, 
  encrypt, 
  decrypt, 
  bip39 } from "./utils.js";

var identities = {};
const processId = (id, type) => {
  var p = id.getPrincipal().toString();
  identities[p] = id;
  return {
    principal : p,
    type : type
  }
}
const StoicIdentity = {
  getIdentity : (principal) => {
    if (!identities.hasOwnProperty(principal)) return false;
    return identities[principal];
  },
  setup : (type, optdata) => {
    return new Promise(async (resolve, reject) => {
      switch(type){
        case "ii":
          var auth = await AuthClient.create();
          auth.login({
            identityProvider: "https://identity.ic0.app/",
            onSuccess: async () => {
              var id = await auth.getIdentity()
              resolve(processId(id, type));
            },
            onError : reject
          });
        break;
        case "private":
          localStorage.setItem('_m', optdata.mnemonic);
          var id = mnemonicToId(optdata.mnemonic);
          encrypt(optdata.mnemonic, id.getPrincipal().toString(), optdata.password).then(_em => {
            localStorage.setItem('_em', _em);
            resolve(processId(id, type));        
          });
        break;
        case "watch":
          resolve({
            principal : optdata.principal,
            type : type
          });   
        break;
      }
    });
  },
  load : (_id) => {
    return new Promise(async (resolve, reject) => {
      switch(_id.type){
        case "ii":
          var auth = await AuthClient.create();
          var id = await auth.getIdentity();
          if (id.getPrincipal().toString() != '2vxsx-fae') {
            resolve(processId(id, _id.type)); 
          } else reject("Not logged in");
        break;
        case "private":
          var t = localStorage.getItem('_m');
          if (!t){
            reject("No seed");
          } else {
            var mnemonic = t;
            var id = mnemonicToId(mnemonic);
            resolve(processId(id, _id.type));
          }
        break;
        case "watch":
          resolve({
            principal : _id.principal,
            type : _id.type
          });   
        break;
      }
    });
  },
  unlock : (_id, optdata) => {
    return new Promise(async (resolve, reject) => {
      StoicIdentity.load(_id).then(resolve).catch(async e => {
        //Yup we should be here :-(
        switch(_id.type){
          case "ii":
            var auth = await AuthClient.create();
            auth.login({
              identityProvider: "https://identity.ic0.app/",
              onSuccess: async () => {
                var id = await auth.getIdentity()
                resolve(processId(id, _id.type));
              },
              onError : reject
            });
            break;
          case "private":
            var t = localStorage.getItem('_em');
            if (!t) return reject("No encrypted data to decrypt");
            decrypt(t, _id.principal, optdata.password).then(mnemonic => {
              localStorage.setItem('_m', mnemonic);
              var id = mnemonicToId(mnemonic);
              resolve(processId(id, _id.type));
            }).catch(reject);
            break;
        }
      });
    });
  },
  lock : (_id) => {
    return new Promise(async (resolve, reject) => {
      switch(_id.type){
        case "ii":
            var auth = await AuthClient.create();
            auth.logout();
          break;
        case "private":
            localStorage.removeItem("_m");
          break;
      }
      resolve(true);
    });
  },
  clear : (_id) => {
    return new Promise(async (resolve, reject) => {
      switch(_id.type){
        case "ii":
            var auth = await AuthClient.create();
            auth.logout();
          break;
        case "private":
            localStorage.removeItem("_m");
            localStorage.removeItem("_em");
          break;
      }
      resolve(true);
    });
  },
  validatePrincipal : validatePrincipal,
  validateMnemonic : bip39.validateMnemonic,
  generateMnemonic : bip39.generateMnemonic,
  validatePassword : (p) => {
    var re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
    return re.test(p);
  }
}
window.StoicIdentity = StoicIdentity;
export {StoicIdentity};