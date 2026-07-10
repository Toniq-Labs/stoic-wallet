import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import extjs from '../ic/extjs.js';
import {useSelector} from 'react-redux';
import {BalanceVisibilityContext} from '../balanceVisibility';
import {getIcpPrice, formatFiat, useCurrency, CURRENCIES} from '../ic/RosettaApi';

const styles = {
  root: {
    height: '100%',
  },
  selectedCard: {
    height: 132,
    overflow: 'hidden',
    backgroundColor: '#003240',
    color: 'white',
  },
  card: {
    height: 132,
    overflow: 'hidden',
  },
  actionArea: {
    height: '100%',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
};
const api = extjs.connect('https://icp0.io/');
function TokenCard(props) {
  const [balance, setBalance] = React.useState(false);
  const hideBalances = React.useContext(BalanceVisibilityContext);
  const currency = useCurrency();
  // Fiat price of one token unit. Only ICP has a known price feed; other tokens
  // stay null and gracefully render as 'N/A'.
  const [price, setPrice] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    if (props.data.symbol === 'ICP') {
      getIcpPrice(currency).then(p => {
        if (!cancelled) setPrice(p);
      });
    } else {
      setPrice(null);
    }
    return () => {
      cancelled = true;
    };
  }, [props.data.symbol, currency]);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const identity = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].identity : {},
  );
  const handleClick = () => {
    props.onClick();
  };
  const updateBalance = () => {
    api
      .token(props.data.id, props.data.standard)
      .getBalance(props.address, identity.principal)
      .then(b => {
        setBalance(Number(b) / 10 ** props.data.decimals);
      })
      .catch(() => {});
  };
  React.useEffect(() => {
    updateBalance();
    const id = setInterval(() => updateBalance(), 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    setBalance(false);
    updateBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.address]);
  return (
    <Grid style={styles.root} item xs={6} sm={4} md={4} lg={3} xl={2}>
      <Card onClick={handleClick} style={props.selected ? styles.selectedCard : styles.card}>
        <CardActionArea style={styles.actionArea}>
          <CardContent>
            <Typography
              style={styles.title}
              color={props.selected ? 'inherit' : 'textSecondary'}
              gutterBottom
              noWrap
            >
              {props.data.name}
            </Typography>
            <Typography variant="h6" noWrap>
              {balance === false
                ? 'Loading'
                : hideBalances
                  ? '••••••'
                  : balance + ' ' + props.data.symbol}
            </Typography>
            {balance !== false && !hideBalances ? (
              <Typography
                style={styles.pos}
                variant="body2"
                color={props.selected ? 'inherit' : 'textSecondary'}
              >
                {price != null
                  ? '≈ ' + formatFiat(balance * price, currency) + ' ' + CURRENCIES[currency].code
                  : 'N/A'}
              </Typography>
            ) : null}
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}

export default React.memo(TokenCard);
