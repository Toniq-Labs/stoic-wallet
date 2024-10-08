import React from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import App from './App';
import { Provider } from 'react-redux'
import store from './store'
import {StoicIdentity} from './ic/identity.js';
import {principalToAccountIdentifier, LEDGER_CANISTER_ID} from './ic/utils.js';
import theme from './theme';
import '@fontsource/roboto';
function injectPopupStyles() {
  if (!document.getElementById("popup-styles")) {
    const style = document.createElement("style");
    style.id = "popup-styles";
    style.textContent = `
      .popup-overlay, .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.3); /* Slightly darker background */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .popup-content {
        background: white;
        padding: 20px;
        border-radius: 4px;
        box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2); /* Light shadow */
        width: 400px;
        font-family: 'Roboto', sans-serif; /* Material Design look */
      }

      .popup-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 20px;
        text-align: left;
      }

      .popup-message {
        font-size: 14px;
        color: #333;
        margin-bottom: 30px;
      }

      .popup-buttons {
        display: flex;
        justify-content: flex-end;
      }

      .popup-buttons button {
        padding: 10px 20px;
        border: none;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        margin-left: 10px;
      }

      .popup-approve {
        background-color: #1a73e8; /* Material blue */
        color: white;
      }

      .popup-reject {
        background-color: transparent;
        color: #1a73e8;
        border: 1px solid #1a73e8; /* Outline style for reject */
      }

      .popup-reject:hover,
      .popup-approve:hover {
        opacity: 0.8;
      }

      .loading-message {
        font-size: 18px;
        color: white;
        font-family: 'Roboto', sans-serif;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }
}

function showLoadingMessage() {
  removeLoadingMessage(); // Ensure any existing message is removed first

  const loadingOverlay = document.createElement("div");
  loadingOverlay.classList.add("loading-overlay");

  const loadingMessage = document.createElement("div");
  loadingMessage.classList.add("loading-message");
  loadingMessage.textContent = "Loading...please don't close this window.";

  loadingOverlay.appendChild(loadingMessage);
  document.body.appendChild(loadingOverlay);
}

function removeLoadingMessage() {
  const existingOverlay = document.querySelector(".loading-overlay");
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
  }
}

function jspopup(message, approveText = "Authorize", rejectText = "Reject") {
  return new Promise((resolve) => {
    injectPopupStyles();
    removeLoadingMessage(); // Remove loading message if it's showing

    const overlay = document.createElement("div");
    overlay.classList.add("popup-overlay");

    const popup = document.createElement("div");
    popup.classList.add("popup-content");

    const title = document.createElement("div");
    title.classList.add("popup-title");
    title.textContent = "Authorize Application";
    popup.appendChild(title);

    const msg = document.createElement("div");
    msg.classList.add("popup-message");
    msg.textContent = message;
    popup.appendChild(msg);

    const buttons = document.createElement("div");
    buttons.classList.add("popup-buttons");
    const approveButton = document.createElement("button");
    approveButton.classList.add("popup-approve");
    approveButton.textContent = approveText;
    approveButton.addEventListener("click", () => {
      showLoadingMessage(); // Show the loading message when approve is clicked
      resolve(true);
      closePopup();
    });

    const rejectButton = document.createElement("button");
    rejectButton.classList.add("popup-reject");
    rejectButton.textContent = rejectText;
    rejectButton.addEventListener("click", () => {
      resolve(false);
      closePopup();
    });

    buttons.appendChild(rejectButton);
    buttons.appendChild(approveButton);
    popup.appendChild(buttons);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    function closePopup() {
      document.body.removeChild(overlay);
    }
  });
}
const params = new URLSearchParams(window.location.search);
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
  let response = {
    action : e.data.action,
    listener : e.data.listener,
    target : "STOIC-EXT",
    success : success,
    message: e.data,
    data : data,
    complete: true,
  };
  if (e.data.target == "STOIC-POPUP") {
    if (e.data.endpoint === 'call') {
      response.complete = false;
    }
    window.opener.postMessage(response, '*');
  } else {
    window.parent.postMessage(response, '*');
  }
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
if (params.get('stoicTunnel') !== null) {
  window.addEventListener("message", async function(e){
    if (e && e.data && (e.data.target === 'STOIC-IFRAME' || e.data.target === 'STOIC-POPUP')) {
      const state = loadDbFast();
      if (!state) {
        sendMessageToExtension(e, false, "There was an error - please ensure you have Cookies Enabled (known issue for Brave users)");
      } else {
        const principal = state.principals[state.currentPrincipal];
        if (principal.identity.principal === e.data.principal) {
          if (principal.apps.filter(a => a.apikey === e.data.apikey).length > 0) {
            let app = principal.apps.filter(a => a.apikey === e.data.apikey)[0];
            StoicIdentity.load(principal.identity).then(async () => {
              var id = StoicIdentity.getIdentity(e.data.principal);
              if (id) {
                var verified = await verify(e.data.payload, e.data.apikey, e.data.sig);
                if (verified) {
                  switch (e.data.action) {
                    case 'sign':
                      let requiresConfirmation = false;
                      if (e.data.target == "STOIC-POPUP" && e.data.endpoint == 'call') {
                        requiresConfirmation = true;
                      }
                      if (requiresConfirmation) {
                        console.log(e);
                        jspopup("Are you sure you want to sign this message from "+app.host+"?", "Sign", "Reject")
                          .then(async (result) => {
                            if (result) {
                              var response = {
                                signed : buf2hex(await id.sign(hex2buf(e.data.payload)))
                              };
                              if (id.hasOwnProperty('_delegation') ) {
                                response.chain = id.getDelegation().toJSON();
                              }
                              sendMessageToExtension(e, true, JSON.stringify(response));
                            } else {
                              sendMessageToExtension(e, false, "User rejected");
                            }
                          });
                      } else {
                        var response = {
                          signed : buf2hex(await id.sign(hex2buf(e.data.payload)))
                        };
                        if (id.hasOwnProperty('_delegation') ) {
                          response.chain = id.getDelegation().toJSON();
                        }
                        sendMessageToExtension(e, true, JSON.stringify(response));
                      }
                    break;
                    case 'accounts':
                      var accs = [];
                      for(var i = 0; i < principal.accounts.length; i++){
                        accs.push({
                          name : principal.accounts[i].name,
                          address : principal.accounts[i].address,
                        });
                      }
                      if (e.data.target == "STOIC-POPUP") {
                        jspopup("Are you sure you want to share your account details with "+app.host+"?", "Continue", "Reject")
                          .then((result) => {
                            if (result) {
                              sendMessageToExtension(e, true, JSON.stringify(accs));
                            } else {
                              sendMessageToExtension(e, false, "User rejected");
                            }
                          });
                      } else {
                        sendMessageToExtension(e, true, JSON.stringify(accs));
                      }
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

  
  if (params.get('transport') !== null && params.get('transport') == "popup" && params.get('lid') !== null) {
    console.log("TESTING");
    window.onload= () => {
      window.opener.postMessage({
        action : "stoicPopupLoad",
        listener : params.get('lid'),
      }, '*');
    }
  }
} else {
  ReactDOM.render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>,
    document.querySelector('#root'),
  );      
}