import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { useSelector } from 'react-redux'
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ListItemText from '@material-ui/core/ListItemText';
import Blockie from '../components/Blockie';
import extjs from '../ic/extjs.js';
import { principalToAccountIdentifier} from '../ic/utils.js';
const api = extjs.connect("https://boundary.ic0.app/");
export default function ListingBuyForm(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const accounts = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].accounts : []))
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [amount, setAmount] = React.useState(10);
  const [step, setStep] = React.useState(0);
  const [subaccount, setSubaccount] = React.useState(0);
  const [balance, setBalance] = React.useState(false);
  
  React.useEffect(() => {
    if (subaccount !== false) {
      api.token().getBalance(principalToAccountIdentifier(identity.principal, subaccount), identity.principal).then(b => {
        setBalance(Number(b)/(10**8));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subaccount, props.open]);

  return (
    <>
      <Dialog open={props.open} onClose={props.onClose}  maxWidth={'xs'} fullWidth >
        {step === 0 ?
          <>
            <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Choose an account to stake from</DialogTitle>
            <DialogContent>
              <List>
                {accounts.map((account, index) => {
                  return (
                      <ListItem key={index} button onClick={() => { setSubaccount(index); setStep(1); }}>
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
        : "" }
        {step === 1 ?
          <>
            <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Set the amount you want to stake</DialogTitle>
            <DialogContent>
              <DialogContentText style={{textAlign:'center',fontWeight:'bold'}}>You can add more ICP to this neuron, or change neuron settings later.</DialogContentText>
            
              <TextField
                fullWidth
                margin="dense"
                label={"Amount of ICP to Stake"}
                value={amount}
                InputLabelProps={{
                  shrink: true,
                }}
                onChange={(e) => setAmount(e.target.value)}
                type="text"
              />
              <DialogContentText style={{fontSize:'small',textAlign:'center', marginTop:"20px"}}>
                { balance !== false ? "Balance: "+balance+" ICP ": ""}
               Fee: 0.0001
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={props.onClose} color="primary">
                Cancel
              </Button>
              <Button onClick={() => props.onSubmit([subaccount, amount])} color="primary">Top-up Neuron</Button>
            </DialogActions>
          </>
        : "" }
      </Dialog>
    </>
  );
}
