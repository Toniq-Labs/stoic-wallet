import React from 'react';
import Typography from '@material-ui/core/Typography';
import TableContainer from '@material-ui/core/TableContainer';
import Paper from '@material-ui/core/Paper';
import SnackbarButton from '../components/SnackbarButton';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import AddIcon from '@material-ui/icons/Add';
import MainFab from '../components/MainFab';
import Pagination from '@material-ui/lab/Pagination';
import ListIcon from '@material-ui/icons/List';
import RegisterTokenForm from '../components/RegisterTokenForm';
import extjs from '../ic/extjs.js';
import {useSelector, useDispatch} from 'react-redux';
import {compressAddress, clipboardCopy} from '../utils.js';
import {useTheme} from '@material-ui/core/styles';
const formatTokenBalance = (n, d) => {
  for (var i = 0; i < Number(d); i++) {
    n /= 10n;
  }
  return formatNumber(Number(n));
};
const formatNumber = n => {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
const perPage = 10;
const api = extjs.connect('https://icp0.io/');
function TokenRegistry(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const account = useSelector(state => state.principals[currentPrincipal].accounts[0]);
  const [tokens, setTokens] = React.useState([]);
  const [page, setPage] = React.useState(1);

  const dispatch = useDispatch();
  const theme = useTheme();
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    empty: {
      maxWidth: 400,
      margin: '0 auto',
    },
    table: {
      minWidth: 650,
    },

    largeIcon: {
      width: 60,
      height: 60,
    },
  };
  const registerToken = (name, symbol, decimals, supply) => {
    props.loader(true);
    var md = {
      fungible: {
        name: name,
        symbol: symbol,
        decimals: decimals,
        metadata: [],
      },
    };
    api
      .canister('kxh4l-cyaaa-aaaah-qadaq-cai')
      .registerToken({
        metadata: md,
        supply: supply * 10 ** decimals,
        owner: account.address,
      })
      .then(r => {
        if (r.hasOwnProperty('ok')) {
          var tokenId = extjs.encodeTokenId('kxh4l-cyaaa-aaaah-qadaq-cai', r.ok);
          dispatch({
            type: 'account/token/add',
            payload: {
              metadata: {
                id: tokenId,
                name: md.fungible.name,
                symbol: md.fungible.symbol,
                decimals: md.fungible.decimals,
                metadata: md.fungible.metadata,
                type: 'fungible',
              },
            },
          });
          api
            .canister('kxh4l-cyaaa-aaaah-qadaq-cai')
            .tokenRegistry()
            .then(tr => {
              setTokens(tr);
            })
            .finally(() => {
              props.loader(false);
            });
        } else {
          error(r.err);
        }
      })
      .catch(() => {
        props.loader(false);
      });
  };
  const error = e => {
    props.alert('There was an error', e);
  };
  React.useEffect(() => {
    props.loader(true);
    api
      .canister('kxh4l-cyaaa-aaaah-qadaq-cai')
      .tokenRegistry()
      .then(tr => {
        setTokens(tr);
      })
      .finally(() => {
        props.loader(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div style={styles.root}>
      {tokens.length === 0 ? (
        <div style={styles.empty}>
          <Typography paragraph align="center">
            <ListIcon style={styles.largeIcon} />
          </Typography>
          <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
            There are no tokens added to the registry
          </Typography>
        </div>
      ) : (
        <>
          <div style={styles.empty}>
            <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
              View and create your own tokens
            </Typography>
          </div>
          {tokens.length > perPage ? (
            <Pagination
              style={{float: 'right', marginTop: '10px', marginBottom: '20px'}}
              size="small"
              count={Math.ceil(tokens.length / perPage)}
              page={page}
              onChange={(e, v) => setPage(v)}
            />
          ) : (
            ''
          )}
          <TableContainer component={Paper}>
            <Table style={styles.table} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell style={{fontWeight: 'bold'}}>Name</TableCell>
                  <TableCell style={{fontWeight: 'bold'}}>Token ID</TableCell>
                  <TableCell style={{fontWeight: 'bold'}}>Symbol</TableCell>
                  <TableCell style={{fontWeight: 'bold'}}>Total Supply</TableCell>
                  <TableCell width="100" style={{fontWeight: 'bold'}}>
                    Owners
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens
                  .slice()
                  .reverse()
                  .filter((token, i) => i >= (page - 1) * perPage && i < page * perPage)
                  .map((token, i) => {
                    return (
                      <TableRow key={token[0]}>
                        <TableCell>{token[1].fungible.name}</TableCell>
                        <TableCell>
                          {compressAddress(
                            extjs.encodeTokenId('kxh4l-cyaaa-aaaah-qadaq-cai', token[0]),
                          )}
                          <SnackbarButton
                            message="Token ID Copied"
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'left',
                            }}
                            onClick={() =>
                              clipboardCopy(
                                extjs.encodeTokenId('kxh4l-cyaaa-aaaah-qadaq-cai', token[0]),
                              )
                            }
                          >
                            <IconButton size="small" edge="end" aria-label="copy">
                              <FileCopyIcon style={{fontSize: 18}} />
                            </IconButton>
                          </SnackbarButton>
                        </TableCell>
                        <TableCell>{token[1].fungible.symbol}</TableCell>
                        <TableCell>
                          {formatTokenBalance(token[2], token[1].fungible.decimals)}
                        </TableCell>
                        <TableCell>{Number(token[3])}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <RegisterTokenForm
            onSubmit={registerToken}
            loader={props.loader}
            error={error}
            address={account.address}
          >
            <MainFab color="primary" aria-label="send">
              <AddIcon />
            </MainFab>
          </RegisterTokenForm>
        </>
      )}
    </div>
  );
}

export default TokenRegistry;
