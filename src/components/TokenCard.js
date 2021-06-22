import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import withStyles from "@material-ui/core/styles/withStyles"
import extjs from '../ic/extjs.js';
import { useSelector, useDispatch } from 'react-redux'

const styles = {
  root: {
    height: "100%",
  },
  selectedCard: {
    height: "100%",
    backgroundColor: '#003240',
    color: 'white'
  },
  card: {
    height: "100%",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
};
var intervalId = 0;
const api = extjs.connect("https://boundary.ic0.app/");
export default function TokenCard(props) {
  const [balance, setBalance] = React.useState(false);
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const handleClick = () => {
    props.onClick();
  };
  const updateBalance = () => {
    api.token(props.data.id).getBalance(props.address, identity.principal).then(b => {
      setBalance(Number(b)/(10**props.data.decimals));
    });
  }
  React.useEffect(() => {
    updateBalance();
    intervalId = setInterval(() => updateBalance(), 10000);
    return () => {
      clearInterval(intervalId);
    }
  }, []);
  React.useEffect(() => {
    setBalance(false);
    updateBalance();
  }, [props.address]);
  return (
    <Grid style={styles.root} item xl={2} lg={3} md={4}>
      <Card onClick={handleClick} style={props.selected ? styles.selectedCard : styles.card }>
        <CardActionArea>
          <CardContent>
            <Typography style={styles.title} color={props.selected ? "inherit" : "textSecondary"} gutterBottom>
              {props.data.name}
            </Typography>
            <Typography variant="h6" >
              {balance === false ? "Loading" : balance + " " + props.data.symbol}
            </Typography>
            {/*<Typography style={styles.pos} color={props.selected ? "inherit" : "textSecondary"}>
              ~$123.04USD
            </Typography>*/}
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}
