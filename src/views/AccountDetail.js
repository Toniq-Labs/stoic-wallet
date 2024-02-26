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
const knownTokens = {
  "fjbi2-fyaaa-aaaan-qanjq-cai" : "ext",
  "mxzaz-hqaaa-aaaar-qaada-cai" : "icrc",
  "zfcdd-tqaaa-aaaaq-aaaga-cai" : "icrc",
  "2ouva-viaaa-aaaaq-aaamq-cai" : "icrc",
  "7ajy4-sqaaa-aaaaq-aaaqa-cai" : "icrc",
  "73mez-iiaaa-aaaaq-aaasq-cai" : "icrc",
  "6rdgd-kyaaa-aaaaq-aaavq-cai" : "icrc",
  "4q2s2-oqaaa-aaaaq-aaaya-cai" : "icrc",
  "4c4fd-caaaa-aaaaq-aaa3a-cai" : "icrc",
  "5bqmf-wyaaa-aaaaq-aaa5q-cai" : "icrc",
  "wedc6-xiaaa-aaaaq-aabaq-cai" : "icrc",
  "wrett-waaaa-aaaaq-aabda-cai" : "icrc",
  "xsi2v-cyaaa-aaaaq-aabfq-cai" : "icrc",
  "viusj-4iaaa-aaaaq-aabkq-cai" : "icrc",
  "uf2wh-taaaa-aaaaq-aabna-cai" : "icrc",
  "rffwt-piaaa-aaaaq-aabqq-cai" : "icrc",
  "rxdbk-dyaaa-aaaaq-aabtq-cai" : "icrc",
  "qbizb-wiaaa-aaaaq-aabwq-cai" : "icrc",
  "sotaq-jqaaa-aaaaq-aab2a-cai" : "icrc",
  "tn7jw-5iaaa-aaaaq-aab4q-cai" : "icrc",
  "tyyy3-4aaaa-aaaaq-aab7a-cai" : "icrc",
  "emww2-4yaaa-aaaaq-aacbq-cai" : "icrc",
  "f54if-eqaaa-aaaaq-aacea-cai" : "icrc",
  "hvgxa-wqaaa-aaaaq-aacia-cai" : "icrc",
}
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
  const currentToken = useSelector(state => (state.currentToken < 0 ? 0 : state.currentToken >= account.tokens.length ? 0 : state.currentToken));
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
        var id = mnemonicToId(_d.seed);
        extjs
          .connect('https://icp0.io/', id)
          .token(extjs.encodeTokenId(_d.canister, _d.token), 'ext')
          .transfer(id.getPrincipal().toText(), 0, account.address, BigInt(1), BigInt(0), '', false)
          .then(r => {
            dispatch({type: 'currentToken', payload: {index: 'nft'}});
            props.alert('Congratulations!', 'We successfully transferred your NFT!');
          })
          .catch(e => {
            props.alert('There was an error retreiving your NFT!');
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
    ps.push(loadBalances());
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
    await updateTransactions(account.address, principal).then(txs => {
      if (txs[1] !== account.address || txs[2] !== principal) return;
      setTransactions(txs[0]);
    });
  };
  const loadBalances = async () => {
    await updateBalances(account.address, principal).then(balances => {
      if (balances[1] !== account.address || balances[2] !== principal) return;
      const newTokens = balances[0].filter(item1 => !tokens.some(item2 => item1.canisterId === item2.id));
      newTokens.forEach(token => {
        if (knownTokens.hasOwnProperty(token.canisterId)) {
          //addToken(token.canisterId, knownTokens[token.canisterId], true);
        };
      })
    });
  };
  const updateNfts = async (_address, _principal) => {
    let res = await (await fetch('https://us-central1-entrepot-api.cloudfunctions.net/api/nftgeek/user/'+_principal+'/'+_address+'/nfts')).json();
    return [res.nfts, res.collections, _address, _principal];
  };
  const updateTransactions = async (_address, _principal) => {
    let txs = await (await fetch('https://us-central1-entrepot-api.cloudfunctions.net/api/nftgeek/user/'+_principal+'/'+_address+'/transactions')).json();
    return [txs, _address, _principal];
  };
  const updateBalances = async (_address, _principal) => {
    let balances = await (await fetch('https://us-central1-entrepot-api.cloudfunctions.net/api/nftgeek/user/'+_principal+'/'+_address+'/tokens')).json();
    return [balances, _address, _principal];
  };

  const getTransactions = () => {
    if (!transactions) return false;
    if (transactions.hasOwnProperty(account.tokens[currentToken].id)) {
      return transactions[account.tokens[currentToken].id];
    } else {  
      return [];
    }
  }
  const addToken = async (cid, standard, ignoreChange) => {
    //ext,icrc,dip20,drc20,ledger
    if (cid === "ryjl3-tyaaa-aaaaa-aaaba-cai") throw new Error("Can't add ledger canister");
    if (tokens.some(token => token.id === cid)) throw new Error('Token already added');
    if (!validatePrincipal(cid)) throw new Error('Please enter a valid canister ID');
    if (!standard) throw new Error('Please enter a valid token standard');
    //Load metadata
    try{
      let metadata = await api.token(cid, standard).getMetadata();
      dispatch({
        type: 'account/token/add',
        payload: {
          metadata: metadata,
        },
      });
      if (!ignoreChange) dispatch({type: 'currentToken', payload: {index: account.tokens.length}});
      return true;
    } catch(e){
      console.log(e);
      throw new Error('There was a problem adding that token');
    }
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
            <AddTokenForm alert={props.alert} loader={props.loader} onClick={addToken}>
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
        <Transactions transactions={getTransactions()} data={account.tokens[currentToken]} principal={principal} address={account.address} />
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
              refresh={refresh}
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
