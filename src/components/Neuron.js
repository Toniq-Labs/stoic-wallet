/* global BigInt */
import React from 'react';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import LockIcon from '@material-ui/icons/Lock';
import LockOpen from '@material-ui/icons/LockOpen';
import {StoicIdentity} from '../ic/identity.js';
import LaunchIcon from '@material-ui/icons/Launch';
import { useSelector } from 'react-redux'
import CardHeader from '@material-ui/core/CardHeader';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';

export default function Neuron(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const _formatDateHelper = (d, t) => {
    return d + " " + t + (d !== 1 ? "s" : "");
  };
  const error = props.error;
  const action = async (t) => {
    closeMenu();
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    switch(t){
      case 0: //Start dissolve
        props.loader(true);
        await props.neuron.startDissolving();
        await props.neuron.update();
        props.loader(false);
      break;
      case 1: //Stop dissolve
        props.loader(true);
        await props.neuron.stopDissolving();
        await props.neuron.update();
        props.loader(false);
      break;
      case 2: //Disburse
        props.loader(true);
        await props.neuron.disburse();
        await props.neuron.update();
        props.loader(false);
      break;
      case 3: //Spawn rewards
        props.loader(true);
        await props.neuron.spawn();
        await props.neuron.update();
        props.loader(false);
      break;
      case 4: //Increase delay
        var currentDelay = Number(props.neuron.data.dissolve_delay);
        var increasedDelay = await props.showNeuronDelayForm(currentDelay);
        props.loader(true);
        await props.neuron.increaseDissolveDelay(increasedDelay);
        await props.neuron.update();
        props.loader(false);
      break;
      case 5: //Topup neuron
        var [subaccount, topupamount] = await props.showNeuronTopupForm();
        props.loader(true);
        await props.neuron.topup(subaccount, topupamount);
        await props.neuron.update();
        props.loader(false);
      break;
      default: break;
    }
    
  }
  const showMenu = (e) => {
    setAnchorEl(e.currentTarget);
    
  };
  const closeMenu = () => {
    setAnchorEl(null);
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
  return (
    <Grid style={{height:'100%'}} item xl={3} lg={4} md={6} sm={12}>
        <Card>
          <CardHeader
          action={
            <>
              <IconButton onClick={showMenu} aria-label="settings">
                <MoreVertIcon />
              </IconButton>
              <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={closeMenu}
              >
                {props.neuron.data.state === 1 ? <MenuItem onClick={() => action(0)}>Start Dissolving</MenuItem> : ""}
                {props.neuron.data.state === 2 ? <MenuItem onClick={() => action(1)}>Stop Dissolving</MenuItem> : ""}
                {props.neuron.data.state === 3 && props.neuron.data.stake > 0n  ? <MenuItem onClick={() => action(2)}>Disburse</MenuItem> : ""}
                {props.neuron.data.maturity > 0n ? <MenuItem onClick={() => action(3)}>Spawn Rewards Neuron</MenuItem> : ""}
                
                <MenuItem onClick={() => action(4)}>Increase Dissolve Delay</MenuItem>
                <MenuItem onClick={() => action(5)}>Top-up Neuron</MenuItem>
              </Menu>
            </>
          }
          title={
            <Typography style={{fontSize: 14}} color={"secondary"}>
              {props.neuron.data.state === 1 ? <>Delay set to {formatDate(Number(props.neuron.data.dissolve_delay))}</> : ""}
              {props.neuron.data.state === 2 ? <>Unlocking in {formatDate(Number(props.neuron.data.dissolve_delay))}</> : ""}
              {props.neuron.data.state === 3 && props.neuron.data.stake === 0n ? <>Neuron is empty</> : ""}
              {props.neuron.data.state === 3 && props.neuron.data.stake > 0n ? <>Ready to disburse</> : ""}
            </Typography>
          }
          subheader={
            <Typography style={{fontSize: 14}} color={"primary"}>
              {"#"+props.neuron.id}
              <IconButton href={"https://icscan.io/neuron/"+props.neuron.id} target="_blank" size="small" edge="end" aria-label="copy">
                <LaunchIcon style={{ fontSize: 18 }} />
              </IconButton>
            </Typography>}
        />
            <CardContent>
                <>
                  <Grid container spacing={2} direction="row" justify="flex-start" alignItems="flex-start" >
                    <Grid style={{height:'100%'}} item md={8}>
                      <Typography variant="h5" >
                      {Number(props.neuron.data.stake/BigInt(10**6))/(10**2)} ICP
                      </Typography>
                      <Typography style={{fontSize: 14}} color={"inherit"} gutterBottom>
                        Rewards: {Number(props.neuron.data.maturity/BigInt(10**6))/(10**2)} ICP
                      </Typography>
                    </Grid>
                    <Grid style={{height:'100%', textAlign:'center'}} item md={4}>
                      {props.neuron.data.state === 1  ? <LockIcon style={{fontSize: 52}} />: ""}
                      {props.neuron.data.state === 2 ? <CircularProgress style={{fontSize: 52}} />: ""}
                      {props.neuron.data.state === 3 && props.neuron.data.stake === 0n ? <LockOpen style={{fontSize: 52}} />: ""}
                      {props.neuron.data.state === 3 && props.neuron.data.stake > 0n ? <AllInclusiveIcon style={{fontSize: 52}} />: ""}
                    </Grid>
                  </Grid>
                </>
            </CardContent>
        </Card>
    </Grid>
  );
}

