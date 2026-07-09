/* global BigInt */
import React from 'react';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {useTheme} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Skeleton from '@material-ui/lab/Skeleton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import SendIcon from '@material-ui/icons/Send';
import extjs from '../ic/extjs.js';
import {compressAddress} from '../utils.js';
import NftThumbnail from './NftThumbnail';

const HISTORY_LIMIT = 10;

// EXT nonfungible metadata is an optional byte blob. When a collection stores
// JSON on-chain we can surface a name/description/traits, otherwise we fall
// back gracefully to whatever the registry/props give us.
const decodeMetadata = raw => {
  if (!raw || !raw.length) return {};
  try {
    const bytes = Uint8Array.from(raw);
    const text = new TextDecoder().decode(bytes).trim();
    if (text.startsWith('{') || text.startsWith('[')) {
      return JSON.parse(text);
    }
    return {description: text};
  } catch (e) {
    return {};
  }
};

const extractTraits = meta => {
  const traits = meta.attributes || meta.traits || meta.properties;
  if (!traits) return [];
  if (Array.isArray(traits)) {
    return traits
      .map(t => ({
        name: t.trait_type || t.name || t.key,
        value: t.value ?? t.trait_value,
      }))
      .filter(t => t.name && t.value !== undefined);
  }
  if (typeof traits === 'object') {
    return Object.keys(traits).map(name => ({name, value: traits[name]}));
  }
  return [];
};

const formatTime = time => {
  try {
    // EXT transaction time is nanoseconds since the epoch.
    const ms = Number(BigInt(time) / BigInt(1000000));
    return new Date(ms).toLocaleString();
  } catch (e) {
    return '';
  }
};

const formatPrice = price => {
  try {
    return (Number(price) / 1e8).toString() + ' ICP';
  } catch (e) {
    return '';
  }
};

export default function NFTDetailModal(props) {
  const _theme = useTheme();
  const fullScreen = useMediaQuery(_theme.breakpoints.down('xs'));
  const [loading, setLoading] = React.useState(false);
  const [meta, setMeta] = React.useState({});
  const [history, setHistory] = React.useState([]);
  const nft = props.nft;

  React.useEffect(() => {
    if (!props.open || !nft) return;
    let cancelled = false;
    setLoading(true);
    setMeta({});
    setHistory([]);
    (async () => {
      const api = extjs.connect('https://icp0.io/');
      let parsed = {};
      try {
        const md = await api
          .token(nft.tokenid, (nft.standard || 'ext').toLowerCase())
          .getMetadata();
        if (md && md.metadata && md.metadata[0]) {
          parsed = decodeMetadata(md.metadata[0]);
        }
      } catch (e) {
        console.error('Unable to load NFT metadata', e);
      }
      let events = [];
      try {
        // EXT exposes a canister-wide transfer/sale history; filter to this token.
        const txs = await api.canister(nft.canister).transactions();
        events = txs
          .filter(t => t.token === nft.tokenid)
          .sort((a, b) => (BigInt(b.time) > BigInt(a.time) ? 1 : -1))
          .slice(0, HISTORY_LIMIT);
      } catch (e) {
        console.error('Unable to load NFT transfer history', e);
      }
      if (!cancelled) {
        setMeta(parsed);
        setHistory(events);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.open, nft]);

  if (!nft) return null;

  const name = meta.name || 'NFT #' + (nft.tokenindex ?? '');
  const traits = extractTraits(meta);

  return (
    <Dialog
      open={props.open}
      onClose={props.close}
      maxWidth={'sm'}
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle style={{textAlign: 'center'}}>{name}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={5} style={{textAlign: 'center'}}>
            <NftThumbnail nft={nft} />
          </Grid>
          <Grid item xs={12} sm={7}>
            <Typography variant="subtitle2" color="textSecondary">
              Collection
            </Typography>
            <Typography paragraph>
              {props.collectionName || compressAddress(nft.canister)}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              Token ID
            </Typography>
            <Typography paragraph noWrap>
              {compressAddress(nft.tokenid)}
            </Typography>
            {meta.description ? (
              <>
                <Typography variant="subtitle2" color="textSecondary">
                  Description
                </Typography>
                <Typography paragraph>{meta.description}</Typography>
              </>
            ) : (
              ''
            )}
          </Grid>
        </Grid>

        {loading ? (
          <>
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={30} />
          </>
        ) : (
          <>
            {traits.length > 0 ? (
              <>
                <Divider style={{margin: '15px 0'}} />
                <Typography variant="subtitle1" gutterBottom style={{fontWeight: 'bold'}}>
                  Traits
                </Typography>
                <Grid container spacing={1}>
                  {traits.map((t, i) => (
                    <Grid item xs={6} sm={4} key={i}>
                      <Typography variant="caption" color="textSecondary" display="block" noWrap>
                        {t.name}
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {String(t.value)}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </>
            ) : (
              ''
            )}

            <Divider style={{margin: '15px 0'}} />
            <Typography variant="subtitle1" gutterBottom style={{fontWeight: 'bold'}}>
              Provenance
            </Typography>
            {history.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No transfer history available for this NFT.
              </Typography>
            ) : (
              <Table size="small" aria-label="transfer history">
                <TableHead>
                  <TableRow>
                    <TableCell style={{fontWeight: 'bold'}}>Date</TableCell>
                    <TableCell style={{fontWeight: 'bold'}}>From</TableCell>
                    <TableCell style={{fontWeight: 'bold'}}>To</TableCell>
                    <TableCell align="right" style={{fontWeight: 'bold'}}>
                      Price
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatTime(t.time)}</TableCell>
                      <TableCell>
                        {compressAddress(t.seller.toText ? t.seller.toText() : t.seller)}
                      </TableCell>
                      <TableCell>{compressAddress(t.buyer)}</TableCell>
                      <TableCell align="right">{formatPrice(t.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.close} color="primary">
          Close
        </Button>
        <Button
          onClick={() => {
            props.close();
            props.onSend(nft);
          }}
          color="primary"
          variant="contained"
          startIcon={<SendIcon />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}
