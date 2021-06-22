import React from 'react';
import { useTheme } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import DeleteIcon from '@material-ui/icons/Delete';
import ImageIcon from '@material-ui/icons/Image';
import AddIcon from '@material-ui/icons/Add';
import MainFab from '../components/MainFab';
import InputForm from '../components/InputForm';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import EditIcon from '@material-ui/icons/Edit';
import Typography from '@material-ui/core/Typography';
import PeopleIcon from '@material-ui/icons/People';
import { useSelector, useDispatch } from 'react-redux'
import SnackbarButton from '../components/SnackbarButton';
import Blockie from '../components/Blockie';
import { clipboardCopy } from '../utils';
import {validatePrincipal, validateAddress} from '../ic/utils.js';
function AddressBook(props) {
  const addresses = useSelector(state => state.addresses)
  const dispatch = useDispatch()
  
  const editAddress = (name, address, index) => {
    dispatch({ type: 'addresses/edit', payload: {
      index : index,
      name : name,
      address : address,
    }});
  };
  const error = (e) => {
    props.alert("There was an error", e);
  };
  const addAddress = (name, address) => {
    if (!name) return error("Please enter a valid contact name");
    if (name.length > 30) return error("Max length or contact names is 30 characters");
    if (!validateAddress(address) && !validatePrincipal(address)) return error("Please enter a valid address or principal");
    var a = dispatch({ type: 'addresses/add', payload: {
      name : name,
      address : address,
    }});
  };
  const deleteAddress = (id) => {
    dispatch({ type: 'addresses/delete', payload: id});
  };
  
  const theme = useTheme();
  const styles = {
    root : {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    empty : {
      maxWidth:400,
      margin : "0 auto",
      paddingTop : 30
    },

    largeIcon: {
      width: 60,
      height: 60,
    },
  };

  return (
    <>
      { addresses.length > 0 ?
        <List>
          {addresses.map((contact, index) => {
            return (
              <ListItem key={index}>
                <ListItemAvatar>
                  <Avatar>
                    <Blockie address={contact.address} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primaryTypographyProps={{noWrap:true}} 
                  secondaryTypographyProps={{noWrap:true}} 
                  primary={contact.name}
                  secondary={
                    <>
                      {contact.address}
                      <SnackbarButton
                        message="Address Copied"
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left',
                        }}
                        onClick={() => clipboardCopy(contact.address)}
                      >
                        <IconButton size="small" edge="end" aria-label="copy">
                          <FileCopyIcon style={{ fontSize: 18 }} />
                        </IconButton>
                      </SnackbarButton>
                    </>
                  } />
                <ListItemSecondaryAction>
                  <InputForm
                    onClick={(name, address) => editAddress(name, address, index)}
                    title="Edit contact from address book"
                    inputLabel="Contact Name"
                    secondaryInput="Contact Address"
                    content="Update the details of a saved contact"
                    buttonLabel="Save"
                    defaultValue={contact.name} 
                    defaultSecondaryValue={contact.address} 
                  >
                    <IconButton edge="end" aria-label="edit">
                      <EditIcon />
                    </IconButton>
                  </InputForm>
                  <IconButton onClick={() => deleteAddress(index)} edge="end" aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )
          })}
        </List> :
        <div style={styles.empty}>
          <Typography paragraph align="center">
            <PeopleIcon style={styles.largeIcon} />
          </Typography>
          <Typography paragraph style={{fontWeight:"bold"}} align="center">
            Your address book is empty
          </Typography>
          <Typography paragraph align="center">
            You can create contacts in your address book to associate addresses with easy to read names.
          </Typography>
        </div>
      }
      <InputForm
        onClick={addAddress}
        title="Add contact to address book"
        inputLabel="Contact Name"
        secondaryInput="Contact Address"
        content="Save names and addresses of common people and services."
        buttonLabel="Save"
      >
        <MainFab color="primary" aria-label="add"><AddIcon /></MainFab>
      </InputForm>
    </>
  );
}

export default AddressBook;