import React from 'react';
import { useSelector, useDispatch } from 'react-redux'
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
import { clipboardCopy, identityTypes } from '../utils';
import {StoicIdentity} from '../ic/identity.js';
import Blockie from '../components/Blockie';
import SnackbarButton from '../components/SnackbarButton';
import ConnectList from '../components/ConnectList';
import WalletDialog from '../components/WalletDialog';

function Settings(props) {
  const [assets, setAssets] = React.useState([]);
  const [initialRoute, setInitialRoute] = React.useState('');
  const dispatch = useDispatch()
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const accounts = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].accounts : []));
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const principals = useSelector(state => state.principals);
  const error = (e) => {
    props.alert("There was an error", e);
  }
  const connectList = (t) => {  
    switch(t) {
      case "create":
        setInitialRoute('tips');
      break;
      case "import":
        setInitialRoute('import');
      break;
      case "link":
        props.loader(true);
        StoicIdentity.change(identity, "ii").then(identity => {
          dispatch({ type: 'addwallet', payload : {identity : identity}});
          props.loader(false);
        }).catch(e => {
          props.loader(false);
        })
      break;
      case "3party":
        setInitialRoute('3party');
      break;
      case "connect":
        //Show error
        error("Hardware wallet support is coming soon!")
      break;
      default: break;
    }
  }
  const changePrincipal = (p) => {
    props.confirm("Please confirm", "You are about to lock your current Principal and switch to another one. Are you sure you want to continue?").then(v => {
      if (v) {
        StoicIdentity.lock(principals[currentPrincipal].identity).then(r => {      
          dispatch({ type: 'currentPrincipal', payload : {index : p}});
        });
      }
    });
  }
  const submit = (type, optdata) => {
    props.loader(true);
    StoicIdentity.change(identity, type, optdata).then(identity => {
      dispatch({ type: 'addwallet', payload : {identity : identity}});
    }).catch(e => {
    }).finally(() => {      
      props.loader(false);
      setInitialRoute('');
    });
  };
  const cancel = (t) => {
    setInitialRoute('');
  };
  const deletePrincipal = (i) => {
    props.confirm("Please confirm", "You are about to remove this Principal, which will remove all data regarding this wallet from this device. Are you sure you want to continue?").then(v => {
      if (v) {
        dispatch({ type: 'deletewallet', payload : {index : i}});
      }
    });
  };
  const clearWallet = () => {
    props.confirm("Please confirm", "You are about to clear your wallet, which will remove ALL data from this device. Are you sure you want to continue?").then(v => {
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
    }
    makeAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrincipal]);
  return (
    <>
      <List
        component="nav"
        aria-labelledby="settings-list"
        subheader={
          <ListSubheader id="nested-list-subheader">
            Active Principal
          </ListSubheader>
        }
      >
        <ListItem>
          <ListItemAvatar>
            <Avatar style={{width:60, height:60}}>
              <Blockie address={identity.principal ?? ''} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText 
            style={{paddingLeft:20}}
            primaryTypographyProps={{noWrap:true}} 
            primary={
              <>
                {identity.principal}
                <SnackbarButton
                  message="Principal Copied"
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  onClick={() => clipboardCopy(identity.principal)}
                >
                  <IconButton size="small" edge="end" aria-label="edit">
                    <FileCopyIcon  style={{ fontSize: 18 }} />
                  </IconButton>
                </SnackbarButton>
              </>
            }
            secondary={
              <>
                <>{identityTypes[identity.type]}<br />{accounts.length + (accounts.length === 1 ? " Account" : " Accounts")} containing {assets.join(", ")}</>
              </>
            } />
          <ListItemSecondaryAction>
            <IconButton href={"https://ic.rocks/principal/"+identity.principal} target="_blank" edge="end" aria-label="search">
              <LaunchIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      <Divider />
      {principals.length > 1 ?
        <><List
          component="nav"
          aria-labelledby="settings-list"
          subheader={
            <ListSubheader id="nested-list-subheader">
              Other Principals
            </ListSubheader>
          }
        >
          {principals.map((principal, i) => {
            if (i === currentPrincipal) return "";
            return (
            <ListItem key={principal.identity.principal} button onClick={() => changePrincipal(i)}>
              <ListItemAvatar>
                <Avatar>
                  <Blockie address={principal.identity.principal ?? ''} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primaryTypographyProps={{noWrap:true}} 
                primary={
                  <>
                    {principal.identity.principal}
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
                secondary={
                  <>
                    <>{identityTypes[principal.identity.type]}</>
                  </>
                } 
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => clipboardCopy(principal.identity.principal)} edge="end">
                  <FileCopyIcon />
                </IconButton>
                <IconButton href={"https://ic.rocks/principal/"+principal.identity.principal} target="_blank" edge="end" aria-label="search">
                  <LaunchIcon />
                </IconButton>
                { principals.length > 1 ?
                <IconButton onClick={() => deletePrincipal(i)} edge="end" aria-label="search">
                  <DeleteIcon />
                </IconButton> : "" }
              </ListItemSecondaryAction>
            </ListItem>) 
          })}
        </List>
        <Divider /> </>: "" }
        
      <ConnectList add handler={connectList} />
      <Divider />
      
      <List
        component="nav"
        aria-labelledby="settings-list"
        subheader={
          <ListSubheader id="nested-list-subheader">
            Advanced Settings
          </ListSubheader>
        }
      >
        <ListItem button onClick={clearWallet}>
          <ListItemText 
            primaryTypographyProps={{noWrap:true, color : "error"}} 
            primary="Remove all wallets from this device"/>
        </ListItem>
      </List>
      <WalletDialog alert={props.alert} initialRoute={initialRoute} cancel={cancel} submit={submit} />
    </>
  );
}

export default Settings;