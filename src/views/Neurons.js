import React from 'react';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import NeuronForm from '../components/NeuronForm';
import MainFab from '../components/MainFab';
import Neuron from '../components/Neuron';
import NeuronManager from '../ic/neuron.js';
import NeuronDelayForm from '../components/NeuronDelayForm';
import TopupNeuronForm from '../components/TopupNeuronForm';
import {StoicIdentity} from '../ic/identity.js';
import { useSelector, useDispatch } from 'react-redux'

var cb = null;
function Neurons(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const neurons = useSelector(state => state.principals[currentPrincipal].neurons);
  const theme = useTheme();
  const dispatch = useDispatch()
  const [neuronDelayOpen, setNeuronDelayOpen] = React.useState(false);
  const [neuronTopupOpen, setNeuronTopupOpen] = React.useState(false);
  const [neuronCurrentDelay, setNeuronCurrentDelay] = React.useState(0);
  
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
    if (neurons.length === 0) scanNeurons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const scanNeurons = () => {
    props.loader(true);
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    NeuronManager.scan(id).then(ns => {
      dispatch({ type: 'neuron/scan', payload : {neurons : ns}});
    }).finally(() => {
      props.loader(false);
    });
  }
  const error = (e) => {
    props.alert("There was an error", e);
  };
  
  const neuronDelaySubmit = (d) => {
    neuronDelayClose();
    cb(d);
    cb = null;
  }  
  const neuronDelayClose = () => {    
    setNeuronCurrentDelay(null);
    setNeuronDelayOpen(false);
  };
  const showNeuronDelayForm = (currentDelay) => {
    setNeuronDelayOpen(true);
    setNeuronCurrentDelay(currentDelay);
    return new Promise((resolve, reject) => {
      cb = resolve;
    });
  };
  const neuronTopupSubmit = (d) => {
    neuronTopupClose();
    cb(d);
    cb = null;
  }  
  const neuronTopupClose = () => {    
    setNeuronTopupOpen(false);
  };
  const showNeuronTopupForm = () => {
    setNeuronTopupOpen(true);
    return new Promise((resolve, reject) => {
      cb = resolve;
    });
  };

  return (
    <div style={styles.root}>
      {neurons.length === 0 ? 
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
          <div style={styles.grid}>
            <Grid
              container
              spacing={2}
              direction="row"
              justify="flex-start"
              alignItems="flex-start"
            >
            {neurons.map(n => {
            return (<Neuron showNeuronTopupForm={showNeuronTopupForm} showNeuronDelayForm={showNeuronDelayForm} loader={props.loader} error={error} key={n.id} neuron={n} />)})}
            </Grid>
          </div>
        </>
      }
        <NeuronForm alert={alert} loader={props.loader} error={error}>
          <MainFab color="primary" aria-label="send"><AddIcon /></MainFab>
        </NeuronForm> 
        
        <NeuronDelayForm open={neuronDelayOpen} onSubmit={neuronDelaySubmit} onClose={neuronDelayClose} currentDelay={neuronCurrentDelay} />
        <TopupNeuronForm open={neuronTopupOpen} onSubmit={neuronTopupSubmit} onClose={neuronTopupClose} />
    </div>
  );
}

export default Neurons;