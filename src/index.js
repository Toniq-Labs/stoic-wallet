import React from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import App from './App';
import { Provider } from 'react-redux'
import store from './store'
import {StoicIdentity} from './ic/identity.js';
import theme from './theme';
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
  window.addEventListener("message", async function(e){
    if (e && e.data && e.data.target === 'STOIC-IFRAME') {
      const state = store.getState();
      const principal = state.principals[state.currentPrincipal];
      if (principal.identity.principal === e.data.principal) {
        if (principal.apps.filter(a => a.apikey === e.data.apikey).length > 0) {
          StoicIdentity.load(principal.identity).then(async () => {
            var id = StoicIdentity.getIdentity(e.data.principal);
            if (id) {
              var verified = await verify(e.data.payload, e.data.apikey, e.data.sig);
              if (verified) {
                var response = {
                  signed : buf2hex(await id.sign(hex2buf(e.data.payload)))
                };
                if (id.constructor.name === "DelegationIdentity") {
                  response.chain = id.getDelegation().toJSON();
                }
                sendMessageToExtension(e, true, JSON.stringify(response));
                switch (e.data.action) {
                  case 'sign':
                  break;
                  default:
                  break;
                }
              } else {            
                sendMessageToExtension(e, false, "Invalid signature for payload");
              }
            } else {        
              sendMessageToExtension(e, false, "The principal is not unlocked");
            }
          }).catch(err => {            
            sendMessageToExtension(e, false, err);
          });
        } else {
          sendMessageToExtension(e, false, "API key is not valid for this principal");
        }
      } else {
        sendMessageToExtension(e, false, "Incorrect Principal is logged in");
      }
    }
  }, false);
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