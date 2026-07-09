import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import IconButton from '@material-ui/core/IconButton';
import LaunchIcon from '@material-ui/icons/Launch';
import DeleteIcon from '@material-ui/icons/Delete';
import {clipboardCopy, identityTypes} from '../utils';
import {StoicIdentity} from '../ic/identity.js';
import Blockie from '../components/Blockie';
import SnackbarButton from '../components/SnackbarButton';
import ConnectList from '../components/ConnectList';
import WalletDialog from '../components/WalletDialog';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputForm from '../components/InputForm';
import EditIcon from '@material-ui/icons/Edit';
import extjs from '../ic/extjs.js';
import {LEDGER_CANISTER_ID} from '../ic/utils.js';
const sjcl = require('sjcl');

function Settings(props) {
  const [assets, setAssets] = React.useState([]);
  const [initialRoute, setInitialRoute] = React.useState('');
  const dispatch = useDispatch();
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const accounts = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].accounts : [],
  );
  const identity = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].identity : {},
  );
  const principals = useSelector(state => state.principals);
  const [balances, setBalances] = React.useState({});
  React.useEffect(() => {
    let cancelled = false;
    const api = extjs.connect('https://icp0.io/');
    principals.forEach(async (principal, i) => {
      let sum = 0;
      await Promise.all(
        principal.accounts.map(async acc => {
          try {
            const b = await api
              .token(LEDGER_CANISTER_ID, 'ledger')
              .getBalance(acc.address, principal.identity.principal);
            sum += Number(b);
          } catch (e) {}
        }),
      );
      if (!cancelled) setBalances(prev => ({...prev, [i]: sum / 1e8}));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [principals.length]);
  const renamePrincipal = (index, name) => {
    dispatch({type: 'principal/edit', payload: {index: index, name: (name || '').trim()}});
  };
  const error = e => {
    props.alert('There was an error', e);
  };
  const connectList = t => {
    switch (t) {
      case 'create':
        setInitialRoute('tips');
        break;
      case 'import':
        setInitialRoute('import');
        break;
      case 'link':
        props.loader(true);
        StoicIdentity.change(identity, 'ii')
          .then(identity => {
            dispatch({type: 'addwallet', payload: {identity: identity}});
            props.loader(false);
          })
          .catch(e => {
            props.loader(false);
            error(e.message || String(e));
          });
        break;
      case '3party':
        setInitialRoute('3party');
        break;
      case 'connect':
        //Show error
        error('Hardware wallet support is coming soon!');
        break;
      default:
        break;
    }
  };
  const changePrincipal = p => {
    props
      .confirm(
        'Please confirm',
        'You are about to lock your current Principal and switch to another one. Are you sure you want to continue?',
      )
      .then(v => {
        if (v) {
          StoicIdentity.lock(principals[currentPrincipal].identity).then(r => {
            dispatch({type: 'currentPrincipal', payload: {index: p}});
          });
        }
      });
  };
  const submit = (type, optdata) => {
    props.loader(true);
    StoicIdentity.change(identity, type, optdata)
      .then(identity => {
        if (principals.some(p => p.identity.principal === identity.principal))
          return error('This Principal is already added to your wallet');
        dispatch({type: 'addwallet', payload: {identity: identity}});
      })
      .catch(e => {
        error(e.message || String(e));
      })
      .finally(() => {
        props.loader(false);
        setInitialRoute('');
      });
  };
  const cancel = t => {
    setInitialRoute('');
  };
  const deletePrincipal = i => {
    props
      .confirm(
        'Please confirm',
        'You are about to remove this Principal, which will remove all data regarding this wallet from this device. Are you sure you want to continue?',
      )
      .then(v => {
        if (v) {
          dispatch({type: 'deletewallet', payload: {index: i}});
        }
      });
  };
  const restoreInput = React.useRef(null);
  const [restorePassword, setRestorePassword] = React.useState('');
  const backupWallet = password => {
    if (!password) return error('Please enter a password to encrypt your backup.');
    try {
      const payload = localStorage.getItem('_db');
      if (!payload) return error('There is no wallet data to back up yet.');
      const encrypted = sjcl.encrypt(password, payload);
      const blob = new Blob([encrypted], {type: 'application/octet-stream'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'stoic-' + new Date().toISOString().slice(0, 10) + '.stoic-backup';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      error(e.message || String(e));
    }
  };
  const startRestore = password => {
    if (!password) return error('Please enter the password used to encrypt your backup.');
    setRestorePassword(password);
    if (restoreInput.current) {
      restoreInput.current.value = '';
      restoreInput.current.click();
    }
  };
  const restoreWallet = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let decrypted;
      try {
        decrypted = sjcl.decrypt(restorePassword, reader.result);
      } catch (e) {
        return error('Incorrect password, or this is not a valid backup file.');
      }
      let imported;
      try {
        imported = JSON.parse(decrypted);
      } catch (e) {
        return error('This backup file is corrupt and could not be read.');
      }
      try {
        let existing = null;
        try {
          const raw = localStorage.getItem('_db');
          existing = raw ? JSON.parse(raw) : null;
        } catch (e) {}
        let merged;
        if (existing && Array.isArray(existing) && Array.isArray(imported)) {
          const principals = [...(existing[0] || [])];
          const seen = new Set(principals.map(p => p.identity.principal));
          (imported[0] || []).forEach(p => {
            if (p && p.identity && !seen.has(p.identity.principal)) {
              seen.add(p.identity.principal);
              principals.push(p);
            }
          });
          const addresses = [...(existing[1] || [])];
          const seenAddr = new Set(addresses.map(a => a.address));
          (imported[1] || []).forEach(a => {
            if (a && !seenAddr.has(a.address)) {
              seenAddr.add(a.address);
              addresses.push(a);
            }
          });
          merged = [principals, addresses, existing[2], existing[3]];
        } else {
          merged = imported;
        }
        const mergedStr = JSON.stringify(merged);
        localStorage.setItem('_db', mergedStr);
        dispatch({type: 'refresh', payload: mergedStr});
        props.alert('Restore complete', 'Your wallet data has been restored successfully.');
      } catch (e) {
        error(e.message || String(e));
      }
    };
    reader.readAsText(file);
  };
  const clearWallet = () => {
    props
      .confirm(
        'Please confirm',
        'You are about to clear your wallet, which will remove ALL data from this device. Are you sure you want to continue?',
      )
      .then(v => {
        if (v) props.clearWallet();
      });
  };
  React.useEffect(() => {
    const makeAssets = () => {
      var assets = ['ICP'];
      accounts.map(account => {
        account.tokens.map(token => {
          if (assets.indexOf(token.symbol) < 0) assets.push(token.symbol);
          return true;
        });
        return true;
      });
      setAssets(assets);
    };
    makeAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrincipal]);
  const [autoLock, setAutoLock] = React.useState(() => {
    try {
      return parseInt(localStorage.getItem('stoic-autolock') || '15', 10);
    } catch (e) {
      return 15;
    }
  });
  return (
    <>
      <List
        component="nav"
        aria-labelledby="settings-list"
        subheader={<ListSubheader id="nested-list-subheader">Active Principal</ListSubheader>}
      >
        <ListItem>
          <ListItemAvatar>
            <Avatar style={{width: 60, height: 60}}>
              <Blockie address={identity.principal ?? ''} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            style={{paddingLeft: 20}}
            primaryTypographyProps={{noWrap: true}}
            primary={
              <>
                {principals[currentPrincipal] && principals[currentPrincipal].name
                  ? principals[currentPrincipal].name
                  : identity.principal}
                <SnackbarButton
                  message="Principal Copied"
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  onClick={() => clipboardCopy(identity.principal)}
                >
                  <IconButton size="small" edge="end" aria-label="edit">
                    <FileCopyIcon style={{fontSize: 18}} />
                  </IconButton>
                </SnackbarButton>
              </>
            }
            secondary={
              <>
                <>
                  {identityTypes[identity.type]}
                  <br />
                  {accounts.length +
                    (accounts.length === 1 ? ' Account' : ' Accounts')} containing{' '}
                  {assets.join(', ')}
                </>
              </>
            }
          />
          <ListItemSecondaryAction>
            <InputForm
              title="Name this principal"
              content="Give this principal a memorable name to tell it apart."
              inputLabel="Principal name"
              buttonLabel="Save"
              defaultValue={
                (principals[currentPrincipal] && principals[currentPrincipal].name) || ''
              }
              onClick={name => renamePrincipal(currentPrincipal, name)}
            >
              <IconButton edge="end" aria-label="Name this principal">
                <EditIcon />
              </IconButton>
            </InputForm>
            <IconButton
              href={'https://icscan.io/principal/' + identity.principal}
              target="_blank"
              rel="noopener noreferrer"
              edge="end"
              aria-label="search"
            >
              <LaunchIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      <Divider />
      {principals.length > 1 ? (
        <>
          <List
            component="nav"
            aria-labelledby="settings-list"
            subheader={<ListSubheader id="nested-list-subheader">Other Principals</ListSubheader>}
          >
            {principals.map((principal, i) => {
              if (i === currentPrincipal) return '';
              return (
                <ListItem
                  key={principal.identity.principal}
                  button
                  onClick={() => changePrincipal(i)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <Blockie
                        address={
                          principal.accounts[0]
                            ? principal.accounts[0].address
                            : (principal.identity.principal ?? '')
                        }
                      />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primaryTypographyProps={{noWrap: true}}
                    primary={
                      <>
                        {principal.name ? principal.name : principal.identity.principal}
                        {/*<SnackbarButton
                      message="Principal Copied"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      onClick={() => clipboardCopy(principal.identity.principal)}
                    >
                      <IconButton size="small" edge="end" aria-label="edit">
                        <FileCopyIcon  style={{ fontSize: 18 }} />
                      </IconButton>
                      </SnackbarButton>*/}
                      </>
                    }
                    secondaryTypographyProps={{component: 'span'}}
                    secondary={
                      <>
                        {identityTypes[principal.identity.type]} · {principal.accounts.length}{' '}
                        account{principal.accounts.length === 1 ? '' : 's'}
                        {principal.accounts[0] ? (
                          <>
                            <br />
                            {principal.accounts[0].address.substr(0, 24) + '…'}
                          </>
                        ) : (
                          ''
                        )}
                        <br />
                        {balances[i] === undefined
                          ? 'Loading balance…'
                          : '≈ ' + balances[i].toFixed(4) + ' ICP'}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <InputForm
                      title="Name this principal"
                      content="Give this principal a memorable name to tell it apart."
                      inputLabel="Principal name"
                      buttonLabel="Save"
                      defaultValue={principal.name || ''}
                      onClick={name => renamePrincipal(i, name)}
                    >
                      <IconButton edge="end" aria-label="Name this principal">
                        <EditIcon />
                      </IconButton>
                    </InputForm>
                    <IconButton
                      aria-label="Copy principal"
                      onClick={() => clipboardCopy(principal.identity.principal)}
                      edge="end"
                    >
                      <FileCopyIcon />
                    </IconButton>
                    <IconButton
                      href={'https://icscan.io/principal/' + principal.identity.principal}
                      target="_blank"
                      rel="noopener noreferrer"
                      edge="end"
                      aria-label="search"
                    >
                      <LaunchIcon />
                    </IconButton>
                    {principals.length > 1 ? (
                      <IconButton onClick={() => deletePrincipal(i)} edge="end" aria-label="search">
                        <DeleteIcon />
                      </IconButton>
                    ) : (
                      ''
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
          <Divider />{' '}
        </>
      ) : (
        ''
      )}

      <List component="nav" subheader={<ListSubheader>Preferences</ListSubheader>}>
        <ListItem>
          <ListItemText
            primary="Auto-lock"
            secondary="Lock the wallet after this much inactivity"
          />
          <ListItemSecondaryAction>
            <FormControl size="small" variant="outlined" style={{minWidth: 130}}>
              <Select
                value={autoLock}
                onChange={e => {
                  setAutoLock(e.target.value);
                  try {
                    localStorage.setItem('stoic-autolock', String(e.target.value));
                  } catch (err) {}
                }}
                inputProps={{'aria-label': 'Auto-lock timeout'}}
              >
                <MenuItem value={0}>Never</MenuItem>
                <MenuItem value={1}>1 minute</MenuItem>
                <MenuItem value={5}>5 minutes</MenuItem>
                <MenuItem value={15}>15 minutes</MenuItem>
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={60}>1 hour</MenuItem>
              </Select>
            </FormControl>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      <Divider />
      <ConnectList add handler={connectList} />
      <Divider />

      <List
        component="nav"
        aria-labelledby="settings-list"
        subheader={<ListSubheader id="nested-list-subheader">Advanced Settings</ListSubheader>}
      >
        <InputForm
          title="Backup wallet"
          content="Export an encrypted backup of your accounts, tokens, address book and settings. Choose a password — you'll need it to restore this backup later."
          inputLabel="Backup password"
          buttonLabel="Backup"
          onClick={password => backupWallet(password)}
        >
          <ListItem button>
            <ListItemText
              primary="Backup wallet"
              secondary="Download an encrypted backup of your wallet data"
            />
          </ListItem>
        </InputForm>
        <InputForm
          title="Restore wallet"
          content="Restore an encrypted backup. Enter the password used when the backup was created, then choose your .stoic-backup file."
          inputLabel="Backup password"
          buttonLabel="Choose file"
          onClick={password => startRestore(password)}
        >
          <ListItem button>
            <ListItemText
              primary="Restore wallet"
              secondary="Import wallet data from an encrypted backup file"
            />
          </ListItem>
        </InputForm>
        <input
          type="file"
          accept=".stoic-backup"
          ref={restoreInput}
          style={{display: 'none'}}
          onChange={e => restoreWallet(e.target.files[0])}
        />
        <ListItem button onClick={clearWallet}>
          <ListItemText
            primaryTypographyProps={{noWrap: true, color: 'error'}}
            primary="Remove all wallets from this device"
          />
        </ListItem>
      </List>
      <Divider />
      <List component="nav" subheader={<ListSubheader>About</ListSubheader>}>
        <ListItem>
          <ListItemText primary="Stoic Wallet" secondary="Version 2.0.0 · Connected to Mainnet" />
        </ListItem>
        <ListItem
          button
          component="a"
          href="https://github.com/Toniq-Labs/stoic-wallet"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ListItemText primary="Source code" secondary="github.com/Toniq-Labs/stoic-wallet" />
          <LaunchIcon style={{color: '#00b894'}} />
        </ListItem>
        <ListItem button component="a" href="mailto:support@toniqlabs.com">
          <ListItemText primary="Support" secondary="support@toniqlabs.com" />
        </ListItem>
      </List>
      <WalletDialog
        alert={props.alert}
        initialRoute={initialRoute}
        cancel={cancel}
        submit={submit}
      />
    </>
  );
}

export default Settings;
