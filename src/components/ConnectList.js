import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/Add';
import GetAppIcon from '@material-ui/icons/GetApp';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import UsbIcon from '@material-ui/icons/Usb';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
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
          primary={props.add ? "Add a new Wallet" : "Create a new Wallet" }
          secondary={props.add ? "I want to add a new wallet by generating a random seed phrase" : "I want to create a new wallet by generating a random seed phrase" }
        />
        
      </ListItem>
      <ListItem button onClick={() => handleClick('import') }>
        <ListItemIcon>
          <GetAppIcon />
        </ListItemIcon>
        <ListItemText 
          primary={props.add ? "Add an existing Wallet" : "Import an existing Wallet" }
          secondary={props.add ? "I want to recover and add an existing wallet using a seed phrase, or as a read-only wallet" : "I want to recover an existing wallet using a seed phrase"}
        />
      </ListItem>
      <ListItem button onClick={() => handleClick('link') }>
        <ListItemIcon>
          <AllInclusiveIcon />
        </ListItemIcon>
        <ListItemText 
          primary={props.add ? "Link your Internet Identitiy" : "Link your Internet Identitiy" }
          secondary={props.add ? "I want to link another Wallet using an Internet Identity" : "I want to link a Wallet using an Internet Identity" }
        />
      </ListItem>
      <ListItem button onClick={() => handleClick('3party') }>
        <ListItemIcon>
          <ExitToAppIcon />
        </ListItemIcon>
        <ListItemText 
          primary={"Login using a trusted 3rd party via tor.us"}
          secondary={"I want to login using a Google, Github, Facebook or Twitter account"}
        />
      </ListItem>
      <ListItem button onClick={() => handleClick('connect') }>
        <ListItemIcon>
          <UsbIcon />
        </ListItemIcon>
        <ListItemText 
          primary={props.add ? "Connect Hardware Wallet" : "Connect Hardware Wallet" }
          secondary={props.add ? "I want to import another Wallet from my Ledger or Trezor device" : "I want to import a wallet from my Ledger or Trezor device" }
        />
      </ListItem>
    </List>
  );
}