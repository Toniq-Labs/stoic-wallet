import { createStore } from "redux";
import {principalToAccountIdentifier, LEDGER_CANISTER_ID} from './ic/utils.js';
const DBVERSION = 1;
var appData = {
  principals : [],
  addresses : [],
  currentPrincipal : 0,
  currentAccount : 0,
  currentToken : 0,
};
function initDb(_db){
  var db = _db ?? localStorage.getItem('_db');
  if (db){
    db = JSON.parse(db);
    //db versioning
    var savenow = false;
    var clearnfts = false;
    if (!Array.isArray(db)) {
      db = [[db],[]];
      console.log("Converting old DB to new");
      savenow = true;
    }
    if (db.length === 2) {
      db.push([0,0,0]);
      console.log("Converting old DB to new");
      savenow = true;
    }
    if (db.length === 3) {
      db.push(DBVERSION);
      console.log("Converting old DB to new");
      clearnfts = true;
      savenow = true;
    }
    var loadedPrincipals = [];
    appData = {
      principals : [],
      addresses : [],
      currentPrincipal : 0,
      currentAccount : 0,
      currentToken : 0,
    };
    db[0].forEach(principal => {
      if (loadedPrincipals.indexOf(principal.identity.principal) >= 0) return false;
      loadedPrincipals.push(principal.identity.principal);
      var _principal = {
        accounts : [],
        neurons : [],
        apps : [],
        identity : principal.identity
      };
      principal.accounts.forEach((account, subaccount) => {
        //savenow = true;
        //if (subaccount >= 2) return;
        if (account.length === 2) account[2] = [];
        if (clearnfts) account[2] = [];
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
          nfts : account[2] ?? []
        });    
        return true;
      });
      if (!principal.hasOwnProperty('apps')) principal.apps = [];
      principal.apps.map(app => {
        _principal.apps.push(app);
        return true;
      });
      /* Do we need to store neruons?
      if (!principal.hasOwnProperty('neurons')) principal.neurons = [];
      principal.neurons.map(neuronId => {
        _principal.neurons.push({
          id : neuronId,
          data : false
        });
      });*/
      appData.principals.push(_principal);
      return true;
    });
    appData.addresses = db[1];
    appData.currentPrincipal = db[2][0] ?? 0;
    appData.currentAccount = db[2][1] ?? 0;
    appData.currentToken = db[2][2] ?? 0;
    
    if (savenow) saveDb(appData);
    return appData;
  } else {
    return {
      principals : [],
      addresses : [],
      currentPrincipal : 0,
      currentAccount : 0,
      currentToken : 0,
      freshInstall : true,
    };
  }
}
function newDb(identity){
  var tc = [[
    {
      accounts : [
        ["Main", 
          [], []
        ]
      ],
      identity : identity,
      neurons : [],
      apps : []
    }
  ],[],[0,0,0], DBVERSION];
  localStorage.setItem('_db', JSON.stringify(tc));
  return initDb();
}
function clearDb(){
  localStorage.removeItem('_db');
  var clearState = {
    principals : [],
    addresses : [],
    currentPrincipal : 0,
    currentAccount : 0,
    currentToken : 0,
  };
  appData = clearState;
  return clearState;
}
function saveDb(newState){
  var updatedDb = [[], newState.addresses, [newState.currentPrincipal, newState.currentAccount, newState.currentToken], DBVERSION];
  var loadedPrincipals = [];
  newState.principals.forEach(principal => {
    if (loadedPrincipals.indexOf(principal.identity.principal) >= 0) return false;
    loadedPrincipals.push(principal.identity.principal);
    var _p = {
      accounts : [],
      neurons : [],
      apps : [],
      identity : principal.identity
    };
    principal.accounts.forEach(account => {
      var _a = [account.name, [], account.nfts];
      account.tokens.map((b, i) => {
        if (i === 0) return false;
        _a[1].push(b);
        return true;      
      });
      _p.accounts.push(_a);
      return true;
    });
    principal.apps.forEach(app => {
      _p.apps.push(app);
      return true;
    });
    /* Do we need to store?
    principal.neurons.map(neuron => {
      _p.neurons.push(neuron.id);
    });*/
    updatedDb[0].push(_p);
    return true;
  });
  localStorage.setItem('_db', JSON.stringify(updatedDb));
  appData = newState;
  return newState;
}
function rootReducer(state = initDb(), action) {
  switch(action.type){
    case "refresh":
      console.log("Detected storage update");
      return initDb(action.payload);
    case "app/edit":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              apps : principal.apps.map((app) => {
                if (app.host === action.payload.app.host) {
                  return {
                    ...app,
                    apikey : action.payload.app.apikey
                  }
                } else {
                  return app;
                }
              }),
            }
          } else {
            return principal;
          }
        }),
      });
    case "app/add": //TODO
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              apps : [
                ...principal.apps,
                action.payload.app
              ]
            }
          } else {
            return principal;
          }
        }),
      });
    case "app/remove": //TODO
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              apps : principal.apps.filter(e => (e && e.host !== action.payload.host))
            }
          } else {
            return principal;
          }
        }),
      });
    case "neuron/add": //TODO
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              neurons : [
                ...principal.neurons,
                action.payload.neuron
              ]
            }
          } else {
            return principal;
          }
        }),
      });
    case "neuron/scan": //TODO
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              neurons : action.payload.neurons
            }
          } else {
            return principal;
          }
        }),
      });
    case "account/nft/remove":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              accounts : principal.accounts.map((account,ii) => {
                if (ii === state.currentAccount) {
                  return {
                    ...account,
                    nfts : account.nfts.filter(e => (e && e.id !== action.payload.id)),
                  }
                } else {
                  return account;
                }
              }),
            }
          } else {
            return principal;
          }
        }),
      });
    case "removewallet":
      return clearDb();
    case "createwallet":
      return newDb(action.payload.identity);
    case "deletewallet":
      return saveDb({
        ...state,
        currentPrincipal : (state.currentPrincipal > action.payload.index ? state.currentPrincipal - 1 : state.currentPrincipal),
        principals : state.principals.filter((e,i) => i !== action.payload.index)
      });
    case "deleteToken":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              accounts : principal.accounts.map((account,ii) => {
                if (ii === state.currentAccount) {
                  return {
                    ...account,
                    tokens : account.tokens.filter((e, i) => (e && i !== state.currentToken)),
                  }
                } else {
                  return account;
                }
              }),
            }
          } else {
            return principal;
          }
        }),
        currentToken : state.currentToken-1
      });
    case "addwallet": //TODO
      var cp = state.principals.length;
      return saveDb({
        ...state,
        principals : [
          ...state.principals,
          {
            accounts : [
              {
                name : "Main",
                address : principalToAccountIdentifier(action.payload.identity.principal, 0),
                tokens : [
                  {
                    id : LEDGER_CANISTER_ID,
                    name : "Internet Computer",
                    symbol : "ICP",
                    decimals : 8,
                    type : 'fungible',
                  }
                ],
                nfts : []
              }
            ],
            identity : action.payload.identity,
            neurons : [],
            apps : [],
          },
        ],
        currentPrincipal : cp
      });
    case "currentPrincipal":
      return saveDb({
        ...state,
        currentToken : 0,
        currentAccount : 0,
        currentPrincipal : action.payload.index
      });
    case "currentAccount":
      return saveDb({
        ...state,
        currentToken : 0,
        currentAccount : action.payload.index
      });
    case "currentToken":
      return saveDb({
        ...state,
        currentToken : action.payload.index ?? 0
      });
    case "account/edit":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              accounts : principal.accounts.map((account,ii) => {
                if (ii === state.currentAccount) {
                  return {
                    ...account,
                    name : action.payload.name
                  }
                } else {
                  return account;
                }
              }),
            }
          } else {
            return principal;
          }
        }),
      });
    case "account/add":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              accounts : [...principal.accounts, {
                name : "Account " + action.payload.id,
                address : principalToAccountIdentifier(action.payload.principal, action.payload.id),
                tokens : [{
                  name : "Internet Computer",
                  symbol : "ICP",
                  decimals : 8,
                }],
                nfts : []
              }]
            }
          } else {
            return principal;
          }
        }),
      });
    case "account/token/add":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              accounts : principal.accounts.map((account,ii) => {
                if (ii === state.currentAccount) {
                  return {
                    ...account,
                    tokens : [...account.tokens, action.payload.metadata]
                  }
                } else {
                  return account;
                }
              }),
            }
          } else {
            return principal;
          }
        }),
      });
    case "account/nft/add":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === state.currentPrincipal) {
            return {
              ...principal,
              accounts : principal.accounts.map((account,ii) => {
                if (ii === state.currentAccount) {
                  if (account.nfts.findIndex(x => x === action.payload.canister) >= 0) return account;
                  if (!action.payload.canister) return account;
                  return {
                    ...account,
                    nfts : [...account.nfts, action.payload.canister]
                  }
                } else {
                  return account;
                }
              }),
            }
          } else {
            return principal;
          }
        }),
      });
      
    case "account/nft/addToAccount":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i === action.payload.principal) {
            return {
              ...principal,
              accounts : principal.accounts.map((account,ii) => {
                if (ii === action.payload.account) {
                  if (account.nfts.find(nft => nft.id === action.payload.nft.id)) {
                    return {
                      ...account,
                      nfts : account.nfts
                    }
                  } else {                    
                    return {
                      ...account,
                      nfts : [...account.nfts, action.payload.nft]
                    }
                  }
                } else {
                  return account;
                }
              }),
            }
          } else {
            return principal;
          }
        }),
      });
    case "addresses/add":
      return saveDb({
        ...state,
        addresses: [...state.addresses, action.payload]
      });
    case "addresses/edit": 
      return saveDb({
        ...state,
        addresses:  state.addresses.map((address,i) => {
          if (i === action.payload.index) {
            return {
              name : action.payload.name,
              address : action.payload.address,
            }
          } else {
            return address;
          }
        })
      });
    case "addresses/delete":
      return saveDb({
        ...state,
        addresses : state.addresses.filter((e,i) => i !== action.payload)
      });
    default: break;
  }
  return state;
};
const store = createStore(rootReducer);
window.addEventListener('storage', (e) => {
  if (e.key === "_db" && e.url !== "https://www.stoicwallet.com/?stoicTunnel") {
    store.dispatch({
      type: "refresh",
      payload : e.newValue
    });
  }
});
export default store;