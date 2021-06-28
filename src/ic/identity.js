/* global BigInt */
import { Principal } from "@dfinity/agent";  
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { AuthClient } from "@dfinity/auth-client";
import { Secp256k1KeyIdentity } from "./secp256k1.js";
import OpenLogin from "@toruslabs/openlogin";
import { 
  mnemonicToId, 
  validatePrincipal, 
  encrypt, 
  decrypt, 
  fromHexString, 
  bip39 } from "./utils.js";
var identities = {};
var openlogin = false;
const oauths = ['google', 'twitter', 'facebook', 'github'];
const loadOpenLogin = async () => {
  if (!openlogin) {
    openlogin = new OpenLogin({
      clientId: "BHGs7-pkZO-KlT_BE6uMGsER2N1PC4-ERfU_c7BKN1szvtUaYFBwZMC2cwk53yIOLhdpaOFz4C55v_NounQBOfU",
      network: "mainnet",
      uxMode : 'redirect',
    });
  }
  await openlogin.init();
  return openlogin;
}
const processId = (id, type) => {
  var p = id.getPrincipal().toString();
  identities[p] = id;
  return {
    principal : p,
    type : type
  }
}
const isLoaded = (p) => {
  return (identities.hasOwnProperty(p));
};
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
            var ems = localStorage.getItem('_em');
            if (!ems) {
              ems = {};
              ems[id.getPrincipal().toString()] = _em;
            } else {
              ems = JSON.parse(ems);
              ems[id.getPrincipal().toString()] = _em;
            }
            localStorage.setItem('_em', JSON.stringify(ems));
            resolve(processId(id, type));        
          });
        break;
        case "pem":
          var id = Secp256k1KeyIdentity.fromPem(optdata.pem);
          resolve(processId(id, type));
        break;
        case "watch":
          resolve({
            principal : optdata.principal,
            type : type
          });   
        break;
      }
        
      if (oauths.indexOf(type) >= 0) {
        const openlogin = await loadOpenLogin();
        if (!openlogin.privKey) {
          await openlogin.login({
            loginProvider: type,
          });
        }
        var id = Ed25519KeyIdentity.generate(new Uint8Array(fromHexString(openlogin.privKey)));
        resolve(processId(id, type));
      }
      
      reject("Cannot setup, invalid type: " + type);
    });
  },
  load : (_id) => {
    return new Promise(async (resolve, reject) => {
      switch(_id.type){
        case "ii":
          var auth = await AuthClient.create();
          var id = await auth.getIdentity();
          if (id.getPrincipal().toString() != _id.principal) reject("Logged in using the incorrect user");
          if (id.getPrincipal().toString() == '2vxsx-fae') reject("Not logged in");
          resolve(processId(id, _id.type)); 
        break;
        case "private":
          if (!isLoaded(_id.principal)) { 
            var t = localStorage.getItem('_m');
            if (!t){
              reject("No seed");
            } else {
              var mnemonic = t;
              var id = mnemonicToId(mnemonic);
              resolve(processId(id, _id.type));
            }
          } else {
            resolve({
              principal : _id.principal,
              type : _id.type
            });
          }
        break;
        case "pem":
          if (!isLoaded(_id.principal)) reject(); 
          resolve({
            principal : _id.principal,
            type : _id.type
          });   
        break;
        case "watch":
          resolve({
            principal : _id.principal,
            type : _id.type
          });   
        break;
      }
      if (oauths.indexOf(_id.type) >= 0) {
        const openlogin = await loadOpenLogin();
        if (!openlogin.privKey || openlogin.privKey.length == 0) {
          reject("Not logged in");
        } else {
          var id = Ed25519KeyIdentity.generate(new Uint8Array(fromHexString(openlogin.privKey)));
          if (id.getPrincipal() != _id.principal) {
            await openlogin.logout();
            reject("Logged in using the incorrect user");
          } else {
            resolve(processId(id, _id.type)); 
          }
        }
      }
      reject();
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
                if (id.getPrincipal() != _id.principal) reject("Logged in using the incorrect user");
                if (id.getPrincipal().toString() == '2vxsx-fae') reject("Not logged in");
                resolve(processId(id, _id.type));
              },
              onError : reject
            });
            break;
          case "private":
            var t = localStorage.getItem('_em');
            if (!t) return reject("No encrypted seed to decrypt");
            var ems = JSON.parse(t);
            var em;
            if (ems.hasOwnProperty("iv") == true) {
              //old format
              //convert to new?
              em = JSON.stringify(ems);
              var nems = {};
              nems[_id.principal] = em;
              localStorage.setItem('_em', JSON.stringify(nems));
            } else {
              if (ems.hasOwnProperty(_id.principal) == false) reject("No encrypted seed to decrypt");
              em = ems[_id.principal];
            }
            decrypt(em, _id.principal, optdata.password).then(mnemonic => {
              localStorage.setItem('_m', mnemonic);
              var id = mnemonicToId(mnemonic);
              resolve(processId(id, _id.type));
            }).catch(reject);
            break;
          case "pem":
            var id = Secp256k1KeyIdentity.fromPem(optdata.pem);
            resolve(processId(id, _id.type));
          break;
        }
        
        if (oauths.indexOf(_id.type) >= 0) {
          try {
            const openlogin = await loadOpenLogin();
            if (!openlogin.privKey) {
              await openlogin.login({
                loginProvider: _id.type,
              });
            }
            var id = Ed25519KeyIdentity.generate(new Uint8Array(fromHexString(openlogin.privKey)));
            if (id.getPrincipal() != _id.principal) {
              await openlogin.logout();
              reject("Logged in using the incorrect user");
            } else {
              resolve(processId(id, _id.type)); 
            }
          } catch (e) {
            reject("Something happened");
          }
        }
        //reject("Invalid login type");
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
      if (oauths.indexOf(_id.type) >= 0) {
        const openlogin = await loadOpenLogin();
        await openlogin.logout();
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
      if (oauths.indexOf(_id.type) >= 0) {
        const openlogin = await loadOpenLogin();
        await openlogin.logout();
      }
      resolve(true);
    });
  },
  change : (_id, type, optdata) => {
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
      if (oauths.indexOf(_id.type) >= 0) {
        const openlogin = await loadOpenLogin();
        await openlogin.logout();
      }
      //setup new
      StoicIdentity.setup(type, optdata).then(resolve).catch(reject);
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
export {StoicIdentity};
