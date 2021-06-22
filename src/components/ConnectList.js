import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/Add';
import GetAppIcon from '@material-ui/icons/GetApp';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import UsbIcon from '@material-ui/icons/Usb';

export default function ConnectList(props) {
  const handleClick = (t) => {
    props.handler(t);
  };
  return (
    <List component="nav" aria-label="secondary add principal">
      <ListItem button onClick={() => handleClick('create') }>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
        <ListItemText 
          primary="Create a new Wallet" 
          secondary="I want to create a new wallet by generating a random seed phrase" 
        />
        
      </ListItem>
      <ListItem button onClick={() => handleClick('import') }>
        <ListItemIcon>
          <GetAppIcon />
        </ListItemIcon>
        <ListItemText 
          primary="Import an existing Wallet" 
          secondary="I want to recover an existing wallet using a seed phrase"
        />
      </ListItem>
      <ListItem button onClick={() => handleClick('link') }>
        <ListItemIcon>
          <AllInclusiveIcon />
        </ListItemIcon>
        <ListItemText 
          primary="Link your Internet Identitiy" 
          secondary="I want to link create a wallet using an Internet Identity" 
        />
      </ListItem>
      <ListItem button onClick={() => handleClick('connect') }>
        <ListItemIcon>
          <UsbIcon />
        </ListItemIcon>
        <ListItemText 
          primary="Connect Hardware Wallet" 
          secondary="I want to import a wallet from my Ledger or Trezor device" 
        />
      </ListItem>
    </List>
  );
}

