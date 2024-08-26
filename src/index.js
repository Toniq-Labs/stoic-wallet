import React from 'react';
import ReactDOM from 'react-dom';
import AppInitializer from './AppInitializer';
import {StoicIdentity} from './ic/identity.js';
import {principalToAccountIdentifier, LEDGER_CANISTER_ID} from './ic/utils.js';
import '@fontsource/roboto';

const params = new URLSearchParams(window.location.search);
if (params.get('stoicTunnel') !== null) {
  const hex2buf = (hex) => {
    const view = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      view[i / 2] = parseInt(hex.substring(i, i + 2), 16)
    }
    return view;
  };
  function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }
  const sendMessageToExtension = (e, success, data) => {
    window.parent.postMessage({
      action : e.data.action,
      listener : e.data.listener,
      target : "STOIC-EXT",
      success : success,
      data : data
    }, '*')
  }
  const verify = async (data, apikey, sig) => {
    var enc = new TextEncoder();
    var encdata = enc.encode(data);
    var pubk = await window.crypto.subtle.importKey(
      "spki",
      hex2buf(apikey),
      {
        name: "ECDSA",
        namedCurve: "P-384"
      },
      true,
      ["verify"]
    );
    return await window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: {name: "SHA-384"},
      },
      pubk,
      hex2buf(sig),
      encdata
    );
  };
  const loadDbFast = () => {
    var db = localStorage.getItem('_db');
    if (db){
      var appData = {
        principals : [],
        addresses : [],
        currentPrincipal : 0,
        currentAccount : 0,
        currentToken : 0,
      };
      db = JSON.parse(db);
      //db versioning
      if (!Array.isArray(db)) {
        db = [[db],[],[0,0,0]];
        console.log("Converting old DB to new");
      }
      if (db.length === 2) {
        db[2] = [0,0,0];
      }
      db[0].map(principal => {
        var _principal = {
          accounts : [],
          neurons : [],
          apps : [],
          identity : principal.identity
        };
        principal.accounts.map((account, subaccount) => {
          if (account.length === 2) account[2] = [];
          _principal.accounts.push({
            name : account[0],
            address : principalToAccountIdentifier(principal.identity.principal, subaccount),
            tokens : [
              {
                id : LEDGER_CANISTER_ID,
                name : "Internet Computer",
                symbol : "ICP",
                decimals : 8,
              }, 
              ...account[1]
            ],
          });    
          return true;
        });
        if (!principal.hasOwnProperty('apps')) principal.apps = [];
        principal.apps.map(app => {
          _principal.apps.push(app);
          return true;
        });
        appData.principals.push(_principal);
        return true;
      });
      appData.addresses = db[1];
      appData.currentPrincipal = db[2][0];
      appData.currentAccount = db[2][1];
      appData.currentToken = db[2][2];
      return appData;
    } else return false;
  }
  window.addEventListener("message", async function(e){
    if (e && e.data && e.data.target === 'STOIC-IFRAME') {
      const state = loadDbFast();
      if (!state) {
        sendMessageToExtension(e, false, "There was an error - please ensure you have Cookies Enabled (known issue for Brave users)");
      } else {
        const principal = state.principals[state.currentPrincipal];
        if (principal.identity.principal === e.data.principal) {
          if (principal.apps.filter(a => a.apikey === e.data.apikey).length > 0) {
            StoicIdentity.load(principal.identity).then(async () => {
              var id = StoicIdentity.getIdentity(e.data.principal);
              if (id) {
                var verified = await verify(e.data.payload, e.data.apikey, e.data.sig);
                if (verified) {
                  switch (e.data.action) {
                    case 'sign':
                      var response = {
                        signed : buf2hex(await id.sign(hex2buf(e.data.payload)))
                      };
                      if (id.hasOwnProperty('_delegation') ) {
                        response.chain = id.getDelegation().toJSON();
                      }
                      sendMessageToExtension(e, true, JSON.stringify(response));
                    break;
                    case 'accounts':
                      var accs = [];
                      for(var i = 0; i < principal.accounts.length; i++){
                        accs.push({
                          name : principal.accounts[i].name,
                          address : principal.accounts[i].address,
                        });
                      }
                      sendMessageToExtension(e, true, JSON.stringify(accs));
                    break;
                    default:
                      sendMessageToExtension(e, false, "Error - nothing to do");
                    break;
                  }
                } else {            
                  sendMessageToExtension(e, false, "Invalid signature for payload");
                }
              } else {        
                sendMessageToExtension(e, false, "The principal is not unlocked, please go to StoicWallet and unlocl your wallet");
              }
            }).catch(err => {            
              sendMessageToExtension(e, false, err);
            });
          } else {
            sendMessageToExtension(e, false, "API key is not valid for this principal, please logout and login again.");
          }
        } else {
          sendMessageToExtension(e, false, "Incorrect Principal is logged in, please go to StoicWallet and ensure the correct Principal is active");
        }
      }
    }
  }, false);
} else {
  ReactDOM.render(
    <AppInitializer />,
    document.getElementById('root')
  );  
}