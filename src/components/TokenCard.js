import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import extjs from '../ic/extjs.js';
import {useSelector} from 'react-redux';
import {BalanceVisibilityContext} from '../balanceVisibility';

// Cached ICP/USD spot price (one network call per session, shared by all cards).
let _icpUsd = null;
let _icpUsdPromise = null;
const getIcpPrice = () => {
  if (_icpUsd !== null) return Promise.resolve(_icpUsd);
  if (!_icpUsdPromise) {
    _icpUsdPromise = fetch('https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd')
      .then((r) => r.json())
      .then((j) => { _icpUsd = (j['internet-computer'] || {}).usd ?? null; return _icpUsd; })
      .catch(() => { _icpUsdPromise = null; return null; });
  }
  return _icpUsdPromise;
};

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
  const [usd, setUsd] = React.useState(null);
  React.useEffect(() => {
    if (props.data.symbol === 'ICP' && balance !== false && balance > 0) {
      getIcpPrice().then((p) => { if (p) setUsd(p); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, props.data.symbol]);
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
        <CardActionArea>
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
              {balance === false ? 'Loading' : hideBalances ? '••••••' : balance + ' ' + props.data.symbol}
            </Typography>
            {usd && balance !== false && !hideBalances && props.data.symbol === 'ICP' ? (
              <Typography style={styles.pos} variant="body2" color={props.selected ? "inherit" : "textSecondary"}>
                ≈ ${(balance * usd).toFixed(2)} USD
              </Typography>
            ) : null}
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}

export default React.memo(TokenCard);
