import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
export default function NeuronDelayForm(props) {
  const [delay, setDelay] = React.useState(false);
  const [amount, setAmount] = React.useState(10);
  const [period, setPeriod] = React.useState(60);
  const _formatDateHelper = (d, t) => {
    return d + " " + t + (d !== 1 ? "s" : "");
  };
  const formatDate = (d) => {
    if (d < 2) return "now";
    if (d < 60) return d + " seconds";
    if (d < 3600) return _formatDateHelper(Math.round(d/60), "minute");
    if (d < 3600 * 24) return _formatDateHelper(Math.round(d/3600), "hour");
    if (d < 3600 * 24 * 7) return _formatDateHelper(Math.round(d/3600 / 24), "day");
    if (d < 3600 * 24 * 7 * 52/12) return _formatDateHelper(Math.round(d/3600 / 24 / 7), "week");
    if (d < 3600 * 24 * 7 * 52) return _formatDateHelper(Math.round(d/3600 / 24 / 7 / (52/12)), "month");
    if (d < 3600 * 24 * 7 * 52 * 8) return _formatDateHelper(Math.round(d/3600 / 24 / 7 / 52 * 10)/10, "year");
    return "8 years";//max
  };
  React.useEffect(() => {
    if ((amount * period) + props.currentDelay > (3600 * 24 * 7 * 52 * 8)) {
      setDelay((3600 * 24 * 7 * 52 * 8) - props.currentDelay);
      setAmount(Math.floor((3600 * 24 * 7 * 52 * 8)/period*100)/100);
    } else {      
      setDelay(amount * period);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, period]);
  return (
    <>
      <Dialog open={props.open} onClose={props.onClose}  maxWidth={'xs'} fullWidth >
        <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Increase Dissolve Delay</DialogTitle>
        <DialogContent>
          <DialogContentText style={{textAlign:'center'}}>
            Please enter the amount you want to <strong>increase your Dissolve Delay</strong> - this is the length of time it takes for the ICP contained within this neuron to become available once it is set to dissolve.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Delay"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="text"
            style={{width:'49%', marginRight:'2%'}}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <FormControl style={{width:'49%',top:5}}>
            <InputLabel shrink id="demo-simple-select-helper-label">Period</InputLabel>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value={60}>Minutes</MenuItem>
              <MenuItem value={60*60}>Hours</MenuItem>
              <MenuItem value={60*60*24}>Days</MenuItem>
              <MenuItem value={60*60*24*7}>Weeks</MenuItem>
              <MenuItem value={60*60*24*7*52/12}>Months</MenuItem>
              <MenuItem value={60*60*24*365}>Years</MenuItem>
            </Select>
          </FormControl>
          <DialogContentText style={{fontSize:'small',textAlign:'center', marginTop:"20px"}}>
            Current Dissolve Delay: {formatDate(props.currentDelay)} <br />
              {delay ? <strong>New Dissolve Delay: {formatDate(props.currentDelay + delay)}< /strong> : "" }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} color="primary">
            Cancel
          </Button>
          <Button onClick={() => props.onSubmit(delay)} color="primary">Confirm Change</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
