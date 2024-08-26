import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import {initDb, configureStore} from './store'
import theme from './theme';
import App from './App';

const AppInitializer = () => {
  const [store, setStore] = useState(null);

  useEffect(() => {
    const initializeStore = async () => {
      const initialState = await initDb(); // Your initDb logic here
      const store = configureStore(initialState);
      window.addEventListener('storage', (e) => {
        if (e.key === "_db" && e.url !== "https://www.stoicwallet.com/?stoicTunnel") {
          store.dispatch({
            type: "refresh",
            payload : e.newValue
          });
        }
      });
      setStore(store);
    };

    initializeStore();
  }, []);

  if (!store) {
    return (
      <Backdrop open={true} style={{ zIndex: 9999 }}>
        <CircularProgress color="inherit" />
        <h2 style={{ position: 'absolute', marginTop: '120px' }}>{'Initializing...'}</h2>
      </Backdrop>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  );
};

export default AppInitializer;
