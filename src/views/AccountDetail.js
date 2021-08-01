import React from 'react';
import { useSelector, useDispatch } from 'react-redux'
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
import { useTheme } from '@material-ui/core/styles';
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
import AddTokenForm from '../components/AddTokenForm';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {validatePrincipal} from '../ic/utils.js';
import { clipboardCopy } from '../utils';


const api = extjs.connect("https://boundary.ic0.app/");
function AccountDetail(props) {
  const currentToken = useSelector(state => state.currentToken);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const currentAccount = useSelector(state => state.currentAccount);
  const principal = useSelector(state => state.principals[currentPrincipal].identity.principal);
  const apps = useSelector(state => state.principals[currentPrincipal].apps);
  const idtype = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity.type : ""));
  const account = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].accounts[currentAccount] : {}));
  const [tokens, setTokens] = React.useState(account.tokens);
  
  const dispatch = useDispatch()
  
  React.useEffect(() => {
    const windowUrl = window.location.search;
    const params = new URLSearchParams(windowUrl);
    const authorizeApp = params.get('authorizeApp');
    if (authorizeApp !== null) {
      window.addEventListener('message', function(e) {
        if (e.source === window.opener) {
          if (e.data.action === 'requestAuthorization') {
            var app = apps.find(a => a.host === e.origin);
            var authResponse = {
              action : "confirmAuthorization", 
              principal : principal, 
              key : StoicIdentity.getIdentity(principal).getPublicKey().toDer(), 
              type : (StoicIdentity.getIdentity(principal).hasOwnProperty('_delegation') ? "DelegationIdentity" : "Standard"),
            }
            if (app && app.apikey === e.data.apikey) {
              window.opener.postMessage(authResponse, "*");              
            } else {
              if (window.confirm("Do you want to authorize \"" + e.origin + "\" to access your princpal \""+principal+"\"?")) {
                if (!app) {
                  app = {
                    host : e.origin,
                    apikey : e.data.apikey
                  };
                  dispatch({ type: 'app/add', payload: {app:app}});
                } else {
                  app.apikey = e.data.apikey;
                  dispatch({ type: 'app/edit', payload: {app:app}});
                }
                window.opener.postMessage(authResponse, "*");
              } else {              
                window.opener.postMessage({action : "rejectAuthorization"}, "*");
              };
            }
          };
        }
      } , false);
      window.opener.postMessage({action : "initiateStoicConnect"}, "*");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    setTokens(account.tokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentToken, currentAccount, currentPrincipal]);
  
  const theme = useTheme();
  const styles = {
    root : {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    grid: {
      flexGrow: 1,
      padding: theme.spacing(2)
    }
  };
  const error = (e) => {
    props.alert("There was an error", e);
  };
  const alert = (t, m) => {
    props.alert(t, m);
  };
  
  const changeToken = (i) => {
    dispatch({ type: 'currentToken', payload: {index:i}});
  }
  const editAccountName = (name) => {
    if (!name) return error("Please enter a valid account name");
    if (name.length > 20) return error("Max length or account names is 20 characters");
    dispatch({ type: 'account/edit', payload: {name:name}});
  };
  const _addToken = (cid, checkBearer) => {
    return new Promise(function(resolve, reject) { 
      api.token(cid).getMetadata().then(md => {
        if (md.type === 'fungible') {
          md.id = cid;
          dispatch({ type: 'account/token/add', payload: {
            metadata : md
          }});
          resolve(account.tokens.length);
        } else {
          var nft = {
            id : cid,
            metadata : md
          };
          if (checkBearer) {
            api.token(cid).getBearer().then(b => {
              if (b === account.address) {
                dispatch({ type: 'account/nft/add', payload: {
                  nft : nft
                }});
                resolve("nft");
              } else {
                reject(error("Sorry, you don't own this NFT"));
              };
            }).catch(reject);
          } else {
          dispatch({ type: 'account/nft/add', payload: {
            nft : nft
          }});
          resolve("nft");
          }
        }
      }).catch(reject);
    });
  };
  const addToken = (cid, type) => {
    if (type === 'add') {
      if (!validatePrincipal(cid)) return error("Please enter a valid canister ID");
      if (account.tokens.findIndex(x => x.id === cid) >= 0) return error("Token has already been added");
      if (account.nfts.findIndex(x => x.id === cid) >= 0) return error("Token has already been added");
      props.loader(true);
      _addToken(cid, true).then(nt => {
        dispatch({ type: 'currentToken', payload: {index:nt}});
      }).finally(() => {
        props.loader(false);
      });
    } else if (type === 'find') {
      if (!validatePrincipal(cid)) return error("Please enter a valid canister ID");
      props.loader(true);
      api.token(cid).getTokens(account.address).then(async tokens => {
        await Promise.all(tokens.filter((ct, i) => (account.tokens.findIndex(x => x.id === ct) < 0 && account.nfts.findIndex(x => x.id === ct) < 0)).map((ct,i) => {
          return _addToken(ct, false);
        }));
        dispatch({ type: 'currentToken', payload: {index:"nft"}});
      }).catch(e => {
        return error("This canister does not support auto-discovery of tokens or you do not have any available");
      }).finally(() => {
        props.loader(false);
      });
    } else if (type === 'search') {
      props.loader(true);
      let trustedCanisters = ["e3izy-jiaaa-aaaah-qacbq-cai", "kxh4l-cyaaa-aaaah-qadaq-cai"];
      var ps = [];
      for(var i = 0; i < trustedCanisters.length; i++) {
        ps.push(api.token(trustedCanisters[i]).getTokens(account.address).then(async tokens => {
          return Promise.all(tokens.filter((ct, i) => (account.tokens.findIndex(x => x.id === ct) < 0 && account.nfts.findIndex(x => x.id === ct) < 0)).map((ct,i) => {
            return _addToken(ct, false);
          }));
        }));
      };
      Promise.all(ps.map(p => p.catch(e => e))).then(() => {
        dispatch({ type: 'currentToken', payload: {index:"nft"}});
      }).finally(() => {
        props.loader(false);
      });
    };
  };
  return (
    <div style={styles.root}>
      <List>
        <ListItem>
          <ListItemAvatar>
            <Avatar style={{width:60, height:60}}>
              <Blockie address={account.address} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText 
            style={{paddingLeft:20}}
            primaryTypographyProps={{noWrap:true, variant:'h4'}} 
            secondaryTypographyProps={{noWrap:true, variant:'subtitle1'}} 
            primary={account.name}
            secondary={
              <div style={{overflow: "hidden", textOverflow: "ellipsis"}}> 
                {account.address.substr(0, 22)+"..."}
                <SnackbarButton
                  message="Address Copied"
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  onClick={() => clipboardCopy(account.address)}
                >
                  <IconButton size="small" edge="end" aria-label="copy">
                    <FileCopyIcon style={{ fontSize: 18 }} />
                  </IconButton>
                </SnackbarButton>
              </div>
            }              />
          <ListItemSecondaryAction>
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
            <Tooltip title="View in explorer (ic.rocks)">
              <IconButton href={"https://ic.rocks/account/"+account.address} target="_blank" edge="end" aria-label="search">
                <LaunchIcon />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
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
            return (<TokenCard key={account.address + token.id} address={account.address} data={token} onClick={() => changeToken(index)} selected={index === currentToken} />)
          })}
          { account.nfts.length > 0 ? <NFTCard address={account.address} onClick={() => changeToken('nft')} selected={currentToken === 'nft'} /> : "" }
          <Grid style={styles.root} item xl={2} lg={3} md={4}>
            <AddTokenForm onClick={addToken}>
              <Tooltip title="Add a new token to this account">
                <Fab color="primary" aria-label="add">
                  <AddIcon />
                </Fab>
              </Tooltip>
            </AddTokenForm>
          </Grid>
        </Grid>
      </div>
      {currentToken !== 0 && currentToken !== 'nft'?
      <div style={{marginLeft:'15px', color:'rgba(0, 0, 0, 0.54)'}}>
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
            <FileCopyIcon style={{ fontSize: 14 }} />
          </IconButton>
        </SnackbarButton>
      </div>: ""}
      {currentToken === 'nft' ? <NFTList alert={alert} error={error} confirm={props.confirm} loader={props.loader} /> : ""}
      {currentToken !== 'nft' ? <Transactions data={account.tokens[currentToken]} address={account.address} /> : ""}
      {idtype === 'watch' ? "" :
        <>
          { currentToken === 0 ?
          <TopupForm alert={alert} loader={props.loader} error={error} address={account.address} data={account.tokens[currentToken]}>
              <MainFab style={{inset: "auto 12px 80px auto",position:"fixed"}} color="primary" aria-label="send"><EvStationIcon /></MainFab>
          </TopupForm> : "" }
          {currentToken !== 'nft' ? 
          <SendForm alert={alert} loader={props.loader} error={error} address={account.address} data={account.tokens[currentToken]}>
            <MainFab color="primary" aria-label="send"><SendIcon /></MainFab>
          </SendForm> : "" }
        </>
      }
    </div>
  );
}

export default  AccountDetail;