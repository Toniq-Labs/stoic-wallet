/* global BigInt */
import React from 'react';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import NeuronForm from '../components/NeuronForm';
import MainFab from '../components/MainFab';
import Neuron from '../components/Neuron';
import extjs from '../ic/extjs.js';
import NeuronManager from '../ic/neuron.js';
import {StoicIdentity} from '../ic/identity.js';
import { useSelector, useDispatch } from 'react-redux'

function Neurons(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const currentAccount = useSelector(state => state.currentAccount)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const neurons = useSelector(state => state.principals[currentPrincipal].neurons);
  const theme = useTheme();
  const dispatch = useDispatch()
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
    grid: {
      flexGrow: 1,
      padding: theme.spacing(2)
    },

    largeIcon: {
      width: 60,
      height: 60,
    },
  };
  React.useEffect(() => {
    if (neurons.length == 0) scanNeurons();
  }, []);
  
  const scanNeurons = () => {
    props.loader(true);
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    NeuronManager.scan(id).then(ns => {
      var _neurons = [];
      ns.map(e => {
        console.log(e);
        _neurons.push({
          id : e.neuronid.toString(),
          data : e.data
        });
      });
      dispatch({ type: 'neuron/scan', payload : {neurons : _neurons}});
    }).finally(() => {
      props.loader(false);
    });
  }
  const error = (e) => {
    props.alert("There was an error", e);
  };

  return (
    <div style={styles.root}>
      {neurons.length == 0 ? 
        <div style={styles.empty}>
          <Typography paragraph align="center">
            <AllInclusiveIcon style={styles.largeIcon} />
          </Typography>
          <Typography paragraph style={{fontWeight:"bold"}} align="center">
            No neurons available
          </Typography>
        </div> 
      : 
        <>
          <div style={styles.empty}>
            <Typography paragraph align="center">
              <AllInclusiveIcon style={styles.largeIcon} />
            </Typography>
          </div>
          <div style={styles.grid}>
            <Grid
              container
              spacing={2}
              direction="row"
              justify="flex-start"
              alignItems="flex-start"
            >
            {neurons.map(n => {
              return (<Neuron key={n.id} id={n.id} />)})}
            </Grid>
          </div>
        </>
      }
        <NeuronForm alert={alert} loader={props.loader} error={error}>
          <MainFab color="primary" aria-label="send"><AddIcon /></MainFab>
        </NeuronForm> 
    </div>
  );
}

export default Neurons;