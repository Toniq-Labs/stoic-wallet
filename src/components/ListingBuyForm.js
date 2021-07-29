import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useSelector } from 'react-redux'
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ListItemText from '@material-ui/core/ListItemText';
import Blockie from '../components/Blockie';
export default function ListingBuyForm(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const accounts = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].accounts : []))
  
  return (
    <>
      <Dialog open={props.open} onClose={props.onClose}  maxWidth={'xs'} fullWidth >
          <>
            <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Choose an account</DialogTitle>
            <DialogContent>
              <List>
                {accounts.map((account, index) => {
                  return (
                      <ListItem key={index} button onClick={() => { props.onSubmit(index); }}>
                        <ListItemAvatar>
                          <Avatar>
                            <Blockie address={account.address} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primaryTypographyProps={{noWrap:true}} 
                          secondaryTypographyProps={{noWrap:true}} 
                          primary={account.name}
                          secondary={account.address} />
                      </ListItem>
                  )
                })}
              </List>
            </DialogContent> 
          </>
      </Dialog>
    </>
  );
}
