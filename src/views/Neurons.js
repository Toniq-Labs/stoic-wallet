/* global BigInt */
import React from 'react';
import Grid from '@material-ui/core/Grid';
import {useTheme} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import LinearProgress from '@material-ui/core/LinearProgress';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import IconButton from '@material-ui/core/IconButton';
import LaunchIcon from '@material-ui/icons/Launch';
import HowToVoteIcon from '@material-ui/icons/HowToVote';
import AddIcon from '@material-ui/icons/Add';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import NeuronForm from '../components/NeuronForm';
import MainFab from '../components/MainFab';
import Neuron from '../components/Neuron';
import NeuronManager from '../ic/neuron.js';
import NeuronDelayForm from '../components/NeuronDelayForm';
import TopupNeuronForm from '../components/TopupNeuronForm';
import {StoicIdentity} from '../ic/identity.js';
import {useSelector, useDispatch} from 'react-redux';

//Vote codes: 1 = Yes, 2 = No, 0 = Abstain (Unspecified)
const e8sToIcp = v => Math.round(Number(v / BigInt(10 ** 6)) / 10 ** 2);

function Proposals(props) {
  const neurons = props.neurons;
  const identity = props.identity;
  const [proposals, setProposals] = React.useState([]);
  const [selected, setSelected] = React.useState({});

  const load = React.useCallback(() => {
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return props.error('Something wrong with your wallet, try logging in again');
    props.loader(true);
    NeuronManager.listProposals(id)
      .then(ps => setProposals(ps))
      .catch(() => props.error('Unable to load proposals'))
      .finally(() => props.loader(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.principal]);

  React.useEffect(() => {
    load();
  }, [load]);

  const proposalId = p => p.id[0].id;
  //list_proposals only returns ballots for neurons controlled by the caller,
  //so any neuron with a ballot on a proposal is eligible to vote on it.
  const eligibleNeurons = p => neurons.filter(n => p.ballots.some(([nid]) => nid === n.neuronid));
  const ballotFor = (p, neuron) => {
    var b = p.ballots.find(([nid]) => nid === neuron.neuronid);
    return b ? b[1] : null;
  };
  const hasVoted = p => p.ballots.some(([, b]) => b.vote !== 0);

  const formatDeadline = p => {
    //ProposalInfo has no deadline field, derive from the standard 4 day voting period
    var deadline = (Number(p.proposal_timestamp_seconds) + 4 * 24 * 3600) * 1000;
    return new Date(deadline).toLocaleString();
  };

  const cast = async (p, voteCode) => {
    var neuron =
      neurons.find(n => n.id === selected[p.id[0].id.toString()]) || eligibleNeurons(p)[0];
    if (!neuron) return props.error('No eligible neuron to vote with');
    var ballot = ballotFor(p, neuron);
    //Optimistic UI: mark as voted and add this neuron's voting power to the tally
    setProposals(ps =>
      ps.map(x => {
        if (proposalId(x) !== proposalId(p)) return x;
        var ballots = x.ballots.map(([nid, b]) =>
          nid === neuron.neuronid ? [nid, {...b, vote: voteCode}] : [nid, b],
        );
        var tally = x.latest_tally[0];
        if (tally && ballot && voteCode !== 0) {
          var power = ballot.voting_power;
          tally = {
            ...tally,
            yes: voteCode === 1 ? tally.yes + power : tally.yes,
            no: voteCode === 2 ? tally.no + power : tally.no,
          };
        }
        return {...x, ballots, latest_tally: tally ? [tally] : x.latest_tally};
      }),
    );
    props.loader(true);
    try {
      await neuron.vote(proposalId(p), voteCode, props.error);
    } catch (e) {
      props.error('Vote failed');
      load();
    } finally {
      props.loader(false);
    }
  };

  if (proposals.length === 0) {
    return (
      <div style={{maxWidth: 400, margin: '0 auto', paddingTop: 30}}>
        <Typography paragraph align="center">
          <HowToVoteIcon style={{width: 60, height: 60}} />
        </Typography>
        <Typography paragraph style={{fontWeight: 'bold'}} align="center">
          No open proposals
        </Typography>
      </div>
    );
  }

  return (
    <Grid container spacing={2} direction="row" justify="flex-start" alignItems="flex-start">
      {proposals.map(p => {
        var pid = p.id[0].id.toString();
        var topic = (NeuronManager.topics[p.topic] || ['Unknown'])[0];
        var tally = p.latest_tally[0];
        var yes = tally ? e8sToIcp(tally.yes) : 0;
        var no = tally ? e8sToIcp(tally.no) : 0;
        var pct = yes + no > 0 ? (yes / (yes + no)) * 100 : 0;
        var summary = p.proposal[0] ? p.proposal[0].summary : '';
        var voted = hasVoted(p);
        var eligible = eligibleNeurons(p);
        return (
          <Grid style={{height: '100%'}} item xl={4} lg={6} md={6} sm={12} key={pid}>
            <Card style={voted ? {opacity: 0.6} : {}}>
              <CardHeader
                action={voted ? <Chip size="small" color="secondary" label="Voted" /> : null}
                title={
                  <Typography style={{fontSize: 16, fontWeight: 'bold'}} color={'primary'}>
                    {topic} #{pid}
                    <IconButton
                      href={'https://dashboard.internetcomputer.org/proposal/' + pid}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      edge="end"
                      aria-label="open"
                    >
                      <LaunchIcon style={{fontSize: 18}} />
                    </IconButton>
                  </Typography>
                }
                subheader={
                  <Typography style={{fontSize: 12}} color={'secondary'}>
                    Voting ends: {formatDeadline(p)}
                  </Typography>
                }
              />
              <CardContent>
                {summary ? (
                  <Typography
                    style={{
                      fontSize: 13,
                      marginBottom: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {summary}
                  </Typography>
                ) : (
                  ''
                )}
                <Typography style={{fontSize: 13}} gutterBottom>
                  Yes: {yes} ICP&nbsp;&nbsp;&nbsp;No: {no} ICP
                </Typography>
                <LinearProgress variant="determinate" value={pct} />
              </CardContent>
              <CardActions style={{flexWrap: 'wrap'}}>
                {eligible.length === 0 ? (
                  <Typography style={{fontSize: 12, padding: 8}} color={'textSecondary'}>
                    No eligible neuron
                  </Typography>
                ) : (
                  <>
                    {eligible.length > 1 ? (
                      <FormControl style={{minWidth: 140, marginRight: 8}}>
                        <InputLabel>Neuron</InputLabel>
                        <Select
                          value={selected[pid] || eligible[0].id}
                          onChange={e => setSelected({...selected, [pid]: e.target.value})}
                        >
                          {eligible.map(n => (
                            <MenuItem key={n.id} value={n.id}>
                              #{n.id}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      ''
                    )}
                    <Button size="small" color="primary" onClick={() => cast(p, 1)}>
                      Yes
                    </Button>
                    <Button size="small" color="primary" onClick={() => cast(p, 2)}>
                      No
                    </Button>
                    <Button size="small" onClick={() => cast(p, 0)}>
                      Abstain
                    </Button>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

var cb = null;
function Neurons(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const identity = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].identity : {},
  );
  const neurons = useSelector(state => state.principals[currentPrincipal].neurons);
  const theme = useTheme();
  const dispatch = useDispatch();
  const [neuronDelayOpen, setNeuronDelayOpen] = React.useState(false);
  const [neuronTopupOpen, setNeuronTopupOpen] = React.useState(false);
  const [neuronCurrentDelay, setNeuronCurrentDelay] = React.useState(0);
  const [tab, setTab] = React.useState(0);

  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    empty: {
      maxWidth: 400,
      margin: '0 auto',
      paddingTop: 30,
    },
    grid: {
      flexGrow: 1,
      padding: theme.spacing(2),
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
    if (!id) return error('Something wrong with your wallet, try logging in again');
    NeuronManager.scan(id)
      .then(ns => {
        dispatch({type: 'neuron/scan', payload: {neurons: ns}});
      })
      .finally(() => {
        props.loader(false);
      });
  };
  const error = e => {
    props.alert('There was an error', e);
  };

  const neuronDelaySubmit = d => {
    neuronDelayClose();
    cb(d);
    cb = null;
  };
  const neuronDelayClose = () => {
    setNeuronCurrentDelay(null);
    setNeuronDelayOpen(false);
  };
  const showNeuronDelayForm = currentDelay => {
    setNeuronDelayOpen(true);
    setNeuronCurrentDelay(currentDelay);
    return new Promise((resolve, reject) => {
      cb = resolve;
    });
  };
  const neuronTopupSubmit = d => {
    neuronTopupClose();
    cb(d);
    cb = null;
  };
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
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="Neurons" />
        <Tab label="Proposals" />
      </Tabs>
      {tab === 1 ? (
        <div style={styles.grid}>
          <Proposals
            identity={identity}
            neurons={neurons}
            loader={props.loader}
            error={error}
          />
        </div>
      ) : neurons.length === 0 ? (
        <div style={styles.empty}>
          <Typography paragraph align="center">
            <AllInclusiveIcon style={styles.largeIcon} />
          </Typography>
          <Typography paragraph style={{fontWeight: 'bold'}} align="center">
            No neurons available
          </Typography>
        </div>
      ) : (
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
                return (
                  <Neuron
                    alert={props.alert}
                    showNeuronTopupForm={showNeuronTopupForm}
                    showNeuronDelayForm={showNeuronDelayForm}
                    loader={props.loader}
                    error={error}
                    key={n.id}
                    neuron={n}
                  />
                );
              })}
            </Grid>
          </div>
        </>
      )}
      <NeuronForm alert={props.alert} loader={props.loader} error={error}>
        <MainFab color="primary" aria-label="send">
          <AddIcon />
        </MainFab>
      </NeuronForm>

      <NeuronDelayForm
        open={neuronDelayOpen}
        onSubmit={neuronDelaySubmit}
        onClose={neuronDelayClose}
        currentDelay={neuronCurrentDelay}
      />
      <TopupNeuronForm
        open={neuronTopupOpen}
        onSubmit={neuronTopupSubmit}
        onClose={neuronTopupClose}
      />
    </div>
  );
}

export default Neurons;
