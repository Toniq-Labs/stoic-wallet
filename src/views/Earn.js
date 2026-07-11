import React from 'react';
import Typography from '@material-ui/core/Typography';
import TableContainer from '@material-ui/core/TableContainer';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Skeleton from '@material-ui/lab/Skeleton';
import Link from '@material-ui/core/Link';
import {useTheme} from '@material-ui/core/styles';
import {listMarkets} from '../ic/liquidium.js';
import useIsMobile from '../useIsMobile';

const pct = v => (v === null || v === undefined ? '—' : v.toFixed(2) + '%');
const num = v =>
  v === null || v === undefined ? '—' : v.toLocaleString(undefined, {maximumFractionDigits: 4});

// Earn: lending markets powered by Liquidium (https://liquidium.fi). Read-only —
// shows supply/borrow APYs for supported assets. Supplying (earning) is wired in
// ic/liquidium.js but not yet enabled here pending a live end-to-end test +
// security review (it moves real funds via Liquidium's canisters/API).
function Earn() {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [markets, setMarkets] = React.useState(null); // null = loading
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    listMarkets()
      .then(m => live && setMarkets(m))
      .catch(e => {
        console.error('Liquidium markets failed', e);
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const styles = {
    root: {flexGrow: 1, padding: theme.spacing(isMobile ? 1 : 3)},
    table: {minWidth: isMobile ? 0 : 650},
    empty: {maxWidth: 400, margin: '0 auto', paddingTop: 30},
  };

  return (
    <div style={styles.root}>
      <Typography variant="h6" style={{marginBottom: theme.spacing(0.5)}}>
        Earn
      </Typography>
      <Typography variant="body2" color="textSecondary" style={{marginBottom: theme.spacing(2)}}>
        Lending markets powered by{' '}
        <Link href="https://liquidium.fi" target="_blank" rel="noreferrer">
          Liquidium
        </Link>
        . Supply assets to earn yield or borrow against them.
      </Typography>

      {error ? (
        <div style={styles.empty}>
          <Typography paragraph align="center" style={{fontWeight: 'bold'}}>
            Couldn't load lending markets right now
          </Typography>
        </div>
      ) : (
        <TableContainer component={Paper}>
          <Table style={styles.table} aria-label="lending markets">
            <TableHead>
              <TableRow>
                <TableCell style={{fontWeight: 'bold'}}>Asset</TableCell>
                <TableCell align="right" style={{fontWeight: 'bold'}}>
                  Supply APY
                </TableCell>
                <TableCell align="right" style={{fontWeight: 'bold'}}>
                  Borrow APY
                </TableCell>
                {!isMobile && (
                  <TableCell align="right" style={{fontWeight: 'bold'}}>
                    Utilization
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell align="right" style={{fontWeight: 'bold'}}>
                    Available
                  </TableCell>
                )}
                <TableCell align="right" style={{fontWeight: 'bold'}}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {markets === null
                ? [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={isMobile ? 4 : 6}>
                        <Skeleton variant="text" height={32} />
                      </TableCell>
                    </TableRow>
                  ))
                : markets.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <strong>{m.asset}</strong>
                        {m.chain ? (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {m.chain}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell align="right" style={{color: theme.palette.success?.main}}>
                        {pct(m.supplyApy)}
                      </TableCell>
                      <TableCell align="right">{pct(m.borrowApy)}</TableCell>
                      {!isMobile && <TableCell align="right">{pct(m.utilization)}</TableCell>}
                      {!isMobile && <TableCell align="right">{num(m.availableLiquidity)}</TableCell>}
                      <TableCell align="right">
                        <Tooltip title="In-wallet supply is coming soon — pending live validation">
                          <span>
                            <Button size="small" variant="outlined" color="primary" disabled>
                              Supply
                            </Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default Earn;
