/* global BigInt */
import React from 'react';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import Timestamp from 'react-timestamp';
import LockIcon from '@material-ui/icons/Lock';
import Button from '@material-ui/core/Button';
import LockOpen from '@material-ui/icons/LockOpen';
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied';
import {StoicIdentity} from '../ic/identity.js';
import { useSelector, useDispatch } from 'react-redux'
import extjs from '../ic/extjs.js';
import NeuronManager from '../ic/neuron.js';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import CardHeader from '@material-ui/core/CardHeader';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
export default function Neuron(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const neuron = useSelector(state => state.principals[currentPrincipal].neurons.find(n => n.id == props.id));
  
  const _formatDateHelper = (d, t) => {
    return d + " " + t + (d !== 1 ? "s" : "");
  };
  const formatDate = (d) => {
    if (d < 2) return "now";
    if (d < 60) return d + " seconds";
    if (d < 3600) return _formatDateHelper(Math.round(d/60), "minute");
    if (d < 3600 * 24) return _formatDateHelper(Math.round(d/3600), "hour");
    if (d < 3600 * 24 * 7) return _formatDateHelper(Math.round(d/3600 / 24), "day");
    if (d < 3600 * 24 * 7 * 4) return _formatDateHelper(Math.round(d/3600 / 24 / 7), "week");
    if (d < 3600 * 24 * 7 * 4 * 12) return _formatDateHelper(Math.round(d/3600 / 24 / 7 / 4), "month");
    if (d < 3600 * 24 * 7 * 4 * 13 * 8) return _formatDateHelper(Math.round(d/3600 / 24 / 7 / 4 / 13 * 10)/10, "year");
    return "8 years";//max
  };
  return (
    <Grid style={{height:'100%'}} item xl={3} lg={4} md={6} sm={12}>
      {neuron.data !== false ?
        <Card>
          <CardHeader
          action={
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          }
          title={
            <Typography style={{fontSize: 14}} color={"secondary"}>
              {neuron.data.state == 1 ? <>Delay set to {formatDate(Number(neuron.data.dissolve_delay))}</> : ""}
              {neuron.data.state == 2 ? <>Unlocking in {formatDate(Number(neuron.data.dissolve_delay))}</> : ""}
              {neuron.data.state == 3 && neuron.data.stake == 0n ? <>Neuron is empty</> : ""}
              {neuron.data.state == 3 && neuron.data.stake > 0n ? <>Ready to disburse</> : ""}
            </Typography>
          }
          subheader={<Typography style={{fontSize: 14}} color={"primary"}>{"#"+props.id}</Typography>}
        />
            <CardContent>
                <>
                  <Grid container spacing={2} direction="row" justify="flex-start" alignItems="flex-start" >
                    <Grid style={{height:'100%'}} item md={8}>
                      <Typography variant="h5" >
                      {Number(neuron.data.stake/BigInt(10**6))/(10**2)} ICP
                      </Typography>
                      <Typography style={{fontSize: 14}} color={"inherit"} gutterBottom>
                        Maturity: {Number(neuron.data.maturity/BigInt(10**6))/(10**2)} ICP
                      </Typography>
                    </Grid>
                    <Grid style={{height:'100%', textAlign:'center'}} item md={4}>
                      {neuron.data.stake == 0n ? <SentimentVeryDissatisfiedIcon style={{fontSize: 52}} />: ""}
                      {neuron.data.stake > 0n && neuron.data.dissolve_delay == 0n ? <AllInclusiveIcon style={{fontSize: 52}} />: ""}
                      {neuron.data.stake > 0n && neuron.data.dissolve_delay > 0n && neuron.data.state == 2 ? <HourglassEmptyIcon style={{fontSize: 52}} />: ""}
                      {neuron.data.stake > 0n && neuron.data.dissolve_delay > 0n && neuron.data.state == 1 ? <LockIcon style={{fontSize: 52}} />: ""}
                    </Grid>
                  </Grid>
                </>
            </CardContent>
        </Card>
      : "LOADING" }
    </Grid>
  );
}

