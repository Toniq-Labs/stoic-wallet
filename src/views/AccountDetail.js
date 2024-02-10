/* global BigInt */
import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import LaunchIcon from '@material-ui/icons/Launch';
import SendIcon from '@material-ui/icons/Send';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import EditIcon from '@material-ui/icons/Edit';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import EvStationIcon from '@material-ui/icons/EvStation';
import {useTheme} from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Blockie from '../components/Blockie';
import SnackbarButton from '../components/SnackbarButton';
import TokenCard from '../components/TokenCard';
import NFTCard from '../components/NFTCard';
import SendForm from '../components/SendForm';
import TopupForm from '../components/TopupForm';
import Transactions from '../components/Transactions';
import NFTList from '../components/NFTList';
import MainFab from '../components/MainFab';
import InputForm from '../components/InputForm';
import RefreshIcon from '@material-ui/icons/Refresh';
import AddTokenForm from '../components/AddTokenForm';
import Chip from '@material-ui/core/Chip';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {validatePrincipal, mnemonicToId} from '../ic/utils.js';
import {clipboardCopy} from '../utils';
import {makeStyles} from '@material-ui/core/styles';

function useInterval(callback, delay) {
  const savedCallback = React.useRef();
  // Remember the latest callback.
  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  React.useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
const useStyles = makeStyles(theme => ({
  accountAvatar: {
    width: 110,
    height: 110,
    [theme.breakpoints.down('sm')]: {
      width: 80,
      height: 80,
    },
  },
}));
const api = extjs.connect('https://icp0.io/');
function AccountDetail(props) {
  const classes = useStyles();
  const currentToken = useSelector(state => state.currentToken);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const currentAccount = useSelector(state => state.currentAccount);
  const principal = useSelector(state => state.principals[currentPrincipal].identity.principal);
  const apps = useSelector(state => state.principals[currentPrincipal].apps);
  const idtype = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].identity.type : '',
  );
  const account = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].accounts[currentAccount] : {},
  );

  const [tokens, setTokens] = React.useState(account.tokens);
  const [nfts, setNfts] = React.useState(false);
  const [transactions, setTransactions] = React.useState(false);
  const [collections, setCollections] = React.useState([]);
  const dispatch = useDispatch();

  React.useEffect(() => {
    const windowUrl = window.location.search;
    const params = new URLSearchParams(windowUrl);
    const authorizeApp = params.get('authorizeApp');
    if (authorizeApp !== null) {
      window.addEventListener(
        'message',
        function (e) {
          if (e.source === window.opener) {
            if (e.data.action === 'requestAuthorization') {
              var app = apps.find(a => a.host === e.origin);
              var authResponse = {
                action: 'confirmAuthorization',
                principal: principal,
                key: StoicIdentity.getIdentity(principal).getPublicKey().toDer(),
                type: StoicIdentity.getIdentity(principal).hasOwnProperty('_delegation')
                  ? 'DelegationIdentity'
                  : 'Standard',
              };
              if (app && app.apikey === e.data.apikey) {
                window.opener.postMessage(authResponse, '*');
              } else {
                props
                  .confirm(
                    'Authorize Application',
                    'Do you want to authorize "' +
                      e.origin +
                      '" to access your princpal "' +
                      principal +
                      '"?',
                    'Reject',
                    'Authorize',
                  )
                  .then(v => {
                    if (v) {
                      if (!app) {
                        app = {
                          host: e.origin,
                          apikey: e.data.apikey,
                        };
                        dispatch({type: 'app/add', payload: {app: app}});
                      } else {
                        app.apikey = e.data.apikey;
                        dispatch({type: 'app/edit', payload: {app: app}});
                      }
                      window.opener.postMessage(authResponse, '*');
                    } else {
                      window.opener.postMessage({action: 'rejectAuthorization'}, '*');
                    }
                  });
              }
            }
          }
        },
        false,
      );
      window.opener.postMessage({action: 'initiateStoicConnect'}, '*');
    }
    const nfttransfer = params.get('nftTx');
    if (nfttransfer !== null) {
      setTimeout(() => {
        props.loader(true, 'Transferring your NFT...');
        var _d = JSON.parse(atob(decodeURIComponent(nfttransfer)));
        console.log(_d);
        var id = mnemonicToId(_d.seed);
        extjs
          .connect('https://icp0.io/', id)
          .token(extjs.encodeTokenId(_d.canister, _d.token))
          .transfer(id.getPrincipal().toText(), 0, account.address, BigInt(1), BigInt(0), '', false)
          .then(r => {
            dispatch({type: 'currentToken', payload: {index: 'nft'}});
            props.alert('Congratulations!', 'We successfully transferred your NFT!');
          })
          .catch(e => {
            console.log(e);
            props.error('There was an error retreiving your NFT!');
          })
          .finally(() => {
            props.loader(false);
            window.history.replaceState(null, null, window.location.pathname);
          });
      }, 500);
    }
    refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setTokens(account.tokens);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentToken]);
  React.useEffect(() => {
    setTokens(account.tokens);
    refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount, currentPrincipal]);
  useInterval(() => refresh(), 60 * 1000);
  const theme = useTheme();
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    grid: {
      flexGrow: 1,
      padding: theme.spacing(2),
    },
  };
  const error = e => {
    props.alert('There was an error', e);
  };
  const alert = (t, m) => {
    props.alert(t, m);
  };

  const removeToken = i => {
    dispatch({type: 'deleteToken'});
  };
  const changeToken = i => {
    dispatch({type: 'currentToken', payload: {index: i}});
  };
  const editAccountName = name => {
    if (!name) return error('Please enter a valid account name');
    if (name.length > 20) return error('Max length or account names is 20 characters');
    dispatch({type: 'account/edit', payload: {name: name}});
  };
  const reloadAccount = async () => {
    props.loader(true);
    await refresh(true);
    props.loader(false);
  };
  const refresh = async (hardRefresh) => {
    let ps = [];
    if (hardRefresh) {
      setNfts(false);
      setCollections([]);
    }
    ps.push(loadNfts());
    if (currentToken !== 'nft') {
      if (hardRefresh) {
        setTransactions(false);
      }
      ps.push(loadTransactions());
    };
    await Promise.all(ps);
  };
  const loadNfts = async () => {
    await updateNfts(account.address, principal).then(nfts => {
      if (nfts[2] !== account.address || nfts[3] !== principal) return;
      setNfts(nfts[0]);
      setCollections(nfts[1]);
    });
  };
  
  const loadTransactions = async () => {
    await updateTransactions(account.tokens[currentToken].id, account.address, principal).then(txs => {
      if (txs[1] !== account.tokens[currentToken].id || txs[2] !== account.address || txs[3] !== principal) return;
      setTransactions(txs[0]);
    });
  };
  const updateNfts = async (_address, _principal) => {
    let res = await (await fetch('https://us-central1-entrepot-api.cloudfunctions.net/api/nftgeek/user/'+_principal+'/'+_address+'/nfts')).json();
    return [res.nfts, res.collections, _address, _principal];
  };
  
  const updateTransactions = async (_id, _address, _principal) => {
    let txs = await (await fetch('https://us-central1-entrepot-api.cloudfunctions.net/api/nftgeek/user/'+_principal+'/'+_address+'/'+_id+'/transactions')).json();
    return [txs, _id, _address, _principal];
  };


  //TODO Add fungible tokens
  const _addToken = (cid, checkBearer) => {
    return new Promise(function (resolve, reject) {
      api
        .token(cid)
        .getMetadata()
        .then(md => {
          if (md.type === 'fungible') {
            md.id = cid;
            dispatch({
              type: 'account/token/add',
              payload: {
                metadata: md,
              },
            });
            resolve(account.tokens.length);
          } else {
            var d = extjs.decodeTokenId(cid);
            console.log(d);
            dispatch({
              type: 'account/nft/add',
              payload: {
                canister: d.canister,
              },
            });
            resolve('nft');
          }
        })
        .catch(reject);
    });
  };
  const addToken = (cid, type) => {
    //TODO
    if (type === 'add') {
      var d = extjs.decodeTokenId(cid);
      if (!validatePrincipal(cid)) return error('Please enter a valid canister ID');
      if (account.tokens.findIndex(x => x.id === cid) >= 0)
        return error('Token has already been added');
      if (account.tokens.findIndex(x => x.id === d.canister) >= 0)
        return error('Token has already been added');
      if (account.nfts.findIndex(x => x === d.canister) >= 0)
        return error('Token has already been added');
      props.loader(true);
      _addToken(cid, true)
        .then(nt => {
          dispatch({type: 'currentToken', payload: {index: nt}});
        })
        .finally(() => {
          props.loader(false);
        });
    };
  };

  return (
    <div style={styles.root}>
      <List>
        <ListItem>
          <ListItemAvatar>
            <Avatar className={classes.accountAvatar}>
              <Blockie address={account.address} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            style={{paddingLeft: 20}}
            primaryTypographyProps={{noWrap: true, variant: 'h4'}}
            secondaryTypographyProps={{noWrap: true, variant: 'subtitle1'}}
            primary={
              <>
                {account.name}
                <span style={{display: 'block', float: 'right'}}>
                  <InputForm
                    onClick={editAccountName}
                    title="Change Account Name"
                    inputLabel="Account Name"
                    secondaryInput={false}
                    content="Enter a new friendly name for this account."
                    defaultValue={account.name}
                    buttonLabel="Save"
                  >
                    <Tooltip title="Edit account name">
                      <IconButton edge="end" aria-label="edit">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </InputForm>
                  <Tooltip title="View in explorer (ICScan)">
                    <IconButton
                      href={'https://icscan.io/account/' + account.address}
                      target="_blank"
                      edge="end"
                      aria-label="search"
                    >
                      <LaunchIcon />
                    </IconButton>
                  </Tooltip>
                </span>
              </>
            }
            secondary={
              <>
                <div style={{fontSize: '0.9em'}}>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'inline-block',
                      maxWidth: '85%',
                    }}
                  >
                    <Chip
                      color={'secondary'}
                      style={{fontSize: '0.9em'}}
                      size="small"
                      label="Address"
                    />{' '}
                    {account.address.substr(0, 29) + '...'}
                  </span>
                  <SnackbarButton
                    message="Address Copied"
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    onClick={() => clipboardCopy(account.address)}
                  >
                    <IconButton style={{top: '-10px'}} size="small" edge="end" aria-label="copy">
                      <FileCopyIcon style={{fontSize: 18}} />
                    </IconButton>
                  </SnackbarButton>
                </div>
                {currentAccount === 0 ? (
                  <div style={{fontSize: '0.9em'}}>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'inline-block',
                        maxWidth: '85%',
                      }}
                    >
                      <Chip
                        color={'primary'}
                        style={{fontSize: '0.9em'}}
                        size="small"
                        label="Principal ID"
                      />{' '}
                      {principal.substr(0, 32) + '...'}
                    </span>
                    <SnackbarButton
                      message="Principal ID Copied"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      onClick={() => clipboardCopy(principal)}
                    >
                      <IconButton style={{top: '-10px'}} size="small" edge="end" aria-label="copy">
                        <FileCopyIcon style={{fontSize: 18}} />
                      </IconButton>
                    </SnackbarButton>
                  </div>
                ) : (
                  ''
                )}
              </>
            }
          />
          <ListItemSecondaryAction></ListItemSecondaryAction>
        </ListItem>
      </List>
      <div style={styles.grid}>
        <Grid
          container
          spacing={2}
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
        >
          {tokens.map((token, index) => {
            return (
              <TokenCard
                key={account.address + token.id}
                address={account.address}
                data={token}
                onClick={() => changeToken(index)}
                selected={index === currentToken}
              />
            );
          })}
          <NFTCard
            title={'NFTs'}
            count={(nfts === false ? "Loading..." : nfts.length)}
            address={account.address}
            onClick={() => changeToken('nft')}
            selected={currentToken === 'nft'}
          />
          <Grid style={styles.root} item xl={2} lg={3} md={4}>
            <AddTokenForm onClick={addToken}>
              <Tooltip title="Add a new token to this account">
                <Fab color="primary" aria-label="add">
                  <AddIcon />
                </Fab>
              </Tooltip>
            </AddTokenForm>
            <Tooltip title="Reload">
              <Fab
                onClick={reloadAccount}
                style={{marginLeft: 10}}
                color="primary"
                aria-label="add"
              >
                <RefreshIcon />
              </Fab>
            </Tooltip>
          </Grid>
        </Grid>
      </div>
      {currentToken !== 0 &&
      currentToken !== 'nft' &&
      currentToken !== 'other' ? (
        <div style={{marginLeft: '15px', color: 'rgba(0, 0, 0, 0.54)'}}>
          <strong>Token ID:</strong> {account.tokens[currentToken].id}
          <SnackbarButton
            message="Token ID Copied"
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            onClick={() => clipboardCopy(account.tokens[currentToken].id)}
          >
            <IconButton size="small" edge="end" aria-label="copy">
              <FileCopyIcon style={{fontSize: 14}} />
            </IconButton>
          </SnackbarButton>
          <Button
            onClick={removeToken}
            color={'primary'}
            style={{marginLeft: '20px'}}
            variant={'contained'}
            size={'small'}
          >
            Remove
          </Button>
        </div>
      ) : (
        ''
      )}
      {currentToken === 'nft' ? (
        <NFTList
          loadNfts={loadNfts} 
          nfts={nfts} 
          collections={collections} 
          alert={alert}
          error={error}
          confirm={props.confirm}
          loader={props.loader}
        />
      ) : (
        ''
      )}
      {currentToken !== 'nft' && currentToken !== 'other' ? (
        <Transactions transactions={transactions} data={account.tokens[currentToken]} principal={principal} address={account.address} />
      ) : (
        ''
      )}
      {idtype === 'watch' ? (
        ''
      ) : (
        <>
          {currentToken === 0 ? (
            <TopupForm
              alert={alert}
              loader={props.loader}
              error={error}
              address={account.address}
              data={account.tokens[currentToken]}
            >
              <MainFab
                style={{inset: 'auto 12px 80px auto', position: 'fixed'}}
                color="primary"
                aria-label="send"
              >
                <EvStationIcon />
              </MainFab>
            </TopupForm>
          ) : (
            ''
          )}
          {currentToken !== 'nft' && currentToken !== 'other' ? (
            <SendForm
              alert={alert}
              loader={props.loader}
              error={error}
              address={account.address}
              data={account.tokens[currentToken]}
            >
              <MainFab color="primary" aria-label="send">
                <SendIcon />
              </MainFab>
            </SendForm>
          ) : (
            ''
          )}
        </>
      )}
    </div>
  );
}

export default AccountDetail;
