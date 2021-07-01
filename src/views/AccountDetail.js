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
import extjs from '../ic/extjs.js';
import {validatePrincipal} from '../ic/utils.js';

import { clipboardCopy } from '../utils';


const api = extjs.connect("https://boundary.ic0.app/");
function AccountDetail(props) {
  const currentToken = useSelector(state => state.currentToken)
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const currentAccount = useSelector(state => state.currentAccount)
  const idtype = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity.type : ""));
  const account = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].accounts[currentAccount] : {}));
  const [tokens, setTokens] = React.useState(account.tokens);
  
  const dispatch = useDispatch()
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
  const addToken = (cid) => {
    if (!validatePrincipal(cid)) return error("Please enter a valid canister ID");
    if (account.tokens.findIndex(x => x.id === cid) >= 0) return error("Token has already been added");
    if (account.nfts.findIndex(x => x.id === cid) >= 0) return error("Token has already been added");
    props.loader(true);
    api.token(cid).getMetadata().then(md => {
      if (md.type === 'fungible') {
        md.id = cid;
        dispatch({ type: 'account/token/add', payload: {
          metadata : md
        }});
        props.loader(false);
        dispatch({ type: 'currentToken', payload: {index:account.tokens.length}});
      } else {
        var nft = {
          id : cid,
          metadata : md
        };
        dispatch({ type: 'account/nft/add', payload: {
          nft : nft
        }});
        props.loader(false);
        dispatch({ type: 'currentToken', payload: {index:'nft'}});
      }
    }).finally(() => {
      props.loader(false);
    });
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
          justify="flex-start"
          alignItems="flex-start"
        >
          {tokens.map((token, index) => {
            return (<TokenCard key={account.address + token.symbol} address={account.address} data={token} onClick={() => changeToken(index)} selected={index === currentToken} />)
          })}
          { account.nfts.length > 0 ? <NFTCard address={account.address} onClick={() => changeToken('nft')} selected={currentToken === 'nft'} /> : "" }
          <Grid style={styles.root} item xl={2} lg={3} md={4}>
            <InputForm
              onClick={addToken}
              title="Add token"
              inputLabel="Canister ID"
              content="Enter the Canister ID for the token you wish to add"
              buttonLabel="Add"
            >
              <Tooltip title="Add a new token to this account">
                <Fab color="primary" aria-label="add">
                  <AddIcon />
                </Fab>
              </Tooltip>
            </InputForm>
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
      {currentToken === 'nft' ? <NFTList error={error} confirm={props.confirm} /> : ""}
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

export default AccountDetail;