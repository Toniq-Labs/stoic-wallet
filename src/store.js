import { createStore } from "redux";
import {principalToAccountIdentifier} from './ic/utils.js';

var appData = {
  principals : [],
  addresses : [],
  currentPrincipal : 0,
  currentAccount : 0,
  currentToken : 0,
};
function initDb(){
  var db = localStorage.getItem('_db');
  if (db){
    db = JSON.parse(db);
    
    //db versioning
    var savenow = false;
    savenow = true;
    if (!Array.isArray(db)) {
      db = [[db],[],[0,0,0]];
      console.log("Converting old DB to new");
      savenow = true;
    }
    if (db.length == 2) {
      db[2] = [0,0,0];
      savenow = true;
    }
    db[0].map(principal => {
      var _principal = {
        accounts : [],
        neurons : [],
        identity : principal.identity
      };
      principal.accounts.map((account, subaccount) => {
        //savenow = true;
        //if (subaccount >= 2) return;
        if (account.length == 2) account[2] = [];
        _principal.accounts.push({
          name : account[0],
          address : principalToAccountIdentifier(principal.identity.principal, subaccount),
          tokens : [
            {
              id : "ryjl3-tyaaa-aaaaa-aaaba-cai",
              name : "Internet Computer",
              symbol : "ICP",
              decimals : 8,
            }, 
            ...account[1]
          ],
          nfts : account[2] ?? []
        });    
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
    });
    
    appData.addresses = db[1];
    appData.currentPrincipal = db[2][0];
    appData.currentAccount = db[2][1];
    appData.currentToken = db[2][2];
    
    if (savenow) saveDb(appData);
    return appData;
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
      /*neurons : []*/
    }
  ],[],[0,0,0]];
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
  var updatedDb = [[], newState.addresses, [newState.currentPrincipal, newState.currentAccount, newState.currentToken]];
  
  newState.principals.map(principal => {
    var _p = {
      accounts : [],
      neurons : [],
      identity : principal.identity
    };
    principal.accounts.map(account => {
      var _a = [account.name, [], account.nfts];
      account.tokens.map((b, i) => {
        if (i === 0) return false;
        _a[1].push(b);
        return true;      
      });
      _p.accounts.push(_a);
    });
    /* Do we need to store?
    principal.neurons.map(neuron => {
      _p.neurons.push(neuron.id);
    });*/
    updatedDb[0].push(_p);
  });
  localStorage.setItem('_db', JSON.stringify(updatedDb));
  appData = newState;
  return newState;
}

initDb();
function rootReducer(state = appData, action) {
  switch(action.type){
    case "neuron/add": //TODO
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i == state.currentPrincipal) {
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
    break;
    case "neuron/scan": //TODO
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i == state.currentPrincipal) {
            return {
              ...principal,
              neurons : action.payload.neurons
            }
          } else {
            return principal;
          }
        }),
      });
    break;
    case "removewallet":
      return clearDb();
    break;
    case "createwallet":
      return newDb(action.payload.identity);
    break;
    case "deletewallet":
      return saveDb({
        ...state,
        principals : state.principals.filter((e,i) => i !== action.payload.index)
      });
    break;
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
                    id : "ryjl3-tyaaa-aaaaa-aaaba-cai",
                    name : "Internet Computer",
                    symbol : "ICP",
                    decimals : 8,
                    type : 'fungible',
                  }
                ],
                nfts : []
              }
            ],
            identity : action.payload.identity
          },
        ],
        currentPrincipal : cp
      });
    break;
    case "currentPrincipal":
      return saveDb({
        ...state,
        currentToken : 0,
        currentAccount : 0,
        currentPrincipal : action.payload.index
      });
    break;
    case "currentAccount":
      return saveDb({
        ...state,
        currentToken : 0,
        currentAccount : action.payload.index
      });
    break;
    case "currentToken":
      return saveDb({
        ...state,
        currentToken : action.payload.index
      });
    break;
    case "account/edit":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i == state.currentPrincipal) {
            return {
              ...principal,
              accounts : principal.accounts.map((account,ii) => {
                if (ii == state.currentAccount) {
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
    break;
    case "account/add":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i == state.currentPrincipal) {
            return {
              ...principal,
              accounts : [...principal.accounts, {
                name : "Account " + action.payload.id,
                address : principalToAccountIdentifier(action.payload.principal, action.payload.id),
                tokens : [{
                  name : "Internet Computer",
                  symbol : "ICP",
                  decimals : 8,
                }]
              }]
            }
          } else {
            return principal;
          }
        }),
      });
    break;
    case "account/token/add":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i == state.currentPrincipal) {
            return {
              ...principal,
              accounts : principal.accounts.map((account,ii) => {
                if (ii == state.currentAccount) {
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
    break;
    case "account/nft/add":
      return saveDb({
        ...state,
        principals : state.principals.map((principal,i) => {
          if (i == state.currentPrincipal) {
            return {
              ...principal,
              accounts : principal.accounts.map((account,ii) => {
                if (ii == state.currentAccount) {
                  return {
                    ...account,
                    nfts : [...account.nfts, action.payload.nft]
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
    break;
    case "addresses/add":
      return saveDb({
        ...state,
        addresses: [...state.addresses, action.payload]
      });
    break;
    case "addresses/edit": 
      return saveDb({
        ...state,
        addresses:  state.addresses.map((address,i) => {
          if (i == action.payload.index) {
            return {
              name : action.payload.name,
              address : action.payload.address,
            }
          } else {
            return address;
          }
        })
      });
    break;
    case "addresses/delete":
      return saveDb({
        ...state,
        addresses : state.addresses.filter((e,i) => i !== action.payload)
      });
    break;
  }
  return state;
};
const store = createStore(rootReducer);

export default store;