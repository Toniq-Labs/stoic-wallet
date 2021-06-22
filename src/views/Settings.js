import React from 'react';
import { useSelector, useDispatch } from 'react-redux'
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import InboxIcon from '@material-ui/icons/Inbox';
import DraftsIcon from '@material-ui/icons/Drafts';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ImageIcon from '@material-ui/icons/Image';
import AddIcon from '@material-ui/icons/Add';
import GetAppIcon from '@material-ui/icons/GetApp';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import UsbIcon from '@material-ui/icons/Usb';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import IconButton from '@material-ui/core/IconButton';
import LaunchIcon from '@material-ui/icons/Launch';
import DeleteIcon from '@material-ui/icons/Delete';
import { clipboardCopy, identityTypes } from '../utils';

import Blockie from '../components/Blockie';
import SnackbarButton from '../components/SnackbarButton';

function Settings(props) {
  const [assets, setAssets] = React.useState([]);
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const accounts = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].accounts : []));
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const principals = useSelector(state => state.principals);
  const makeAssets = () => {  
    var assets = ['ICP'];
    accounts.map(account => {
      account.tokens.map(token => {
        if (assets.indexOf(token.symbol) < 0) assets.push(token.symbol);
      });
    });
    setAssets(assets);
  }
  const clearWallet = () => {
    props.confirm("Please confirm", "You are about to clear your wallet, which will remove all data from this device. Are you sure you want to continue?").then(v => {
      if (v) props.clearWallet();
    });
  };
  React.useEffect(() => {
    makeAssets();
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
            { principals.length > 1 ?
            <IconButton edge="end" aria-label="search">
              <DeleteIcon />
            </IconButton> : "" }
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
            if (i == currentPrincipal) return;
            return (
            <ListItem button>
              <ListItemAvatar>
                <Avatar>
                  <Blockie address={principal.identity.principal ?? ''} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primaryTypographyProps={{noWrap:true}} 
                primary={principal.identity.principal}
                secondary={
                  <>
                    <>{identityTypes[principal.identity.type]}</>
                  </>
                } />
            </ListItem>) 
          })}
        </List>
        <Divider /> </>: "" }
        {/*
      <List component="nav" aria-label="secondary add principal">
        <ListItem button>
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Create Principal" 
            secondary="I want to create a new account by generating a random seed phrase" 
          />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <GetAppIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Import Principal" 
            secondary="I want to add an existing account using a seed phrase, or as a 'read-only' account" 
          />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <AllInclusiveIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Link Internet Identitiy" 
            secondary="I want to link create an account using an Internet Identity" 
          />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <UsbIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Connect Hardware Wallet" 
            secondary="I want to import an account from my Ledger or Trezor device" 
          />
        </ListItem>
      </List>
      <Divider />
      */}
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
            primary="Remove this wallet from this device"/>
        </ListItem>
      </List>
    </>
  );
}

export default Settings;