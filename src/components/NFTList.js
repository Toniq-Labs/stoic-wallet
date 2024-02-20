/* global BigInt */
import React from 'react';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import LaunchIcon from '@material-ui/icons/Launch';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Paper from '@material-ui/core/Paper';
import SendIcon from '@material-ui/icons/Send';
import Typography from '@material-ui/core/Typography';
import SnackbarButton from '../components/SnackbarButton';
import Pagination from '@material-ui/lab/Pagination';
import SendNFTForm from '../components/SendNFTForm';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import {compressAddress, clipboardCopy, formatNumberForDisplay} from '../utils.js';
import {useSelector, useDispatch} from 'react-redux';
import NftThumbnail from './NftThumbnail';
const wrapableCanisters = [
  'xkbqi-2qaaa-aaaah-qbpqq-cai',
  'qcg3w-tyaaa-aaaah-qakea-cai',
  'jzg5e-giaaa-aaaah-qaqda-cai',
  'd3ttm-qaaaa-aaaai-qam4a-cai',
];
const wrapperCanisters = [
  'q6hjz-kyaaa-aaaah-qcama-cai',
  '3db6u-aiaaa-aaaah-qbjbq-cai',
  'bxdf4-baaaa-aaaah-qaruq-cai',
];

const perPage = 20;
const _showPrice = (n,e) => {
  if (!e) e = 8;
  n = Number(n) / (10**e);
  return formatNumberForDisplay(n);
};
export default function NFTList(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const currentAccount = useSelector(state => state.currentAccount);
  const identity = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].identity : {},
  );
  const account = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].accounts[currentAccount] : {},
  );
  const [collection, setCollection] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [openNFTForm, setOpenNFTForm] = React.useState(false);
  const [tokenNFT, setTokenNFT] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState({});
  const handleClick = (id, target) => {
    setAnchorEl({id: id, target: target});
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const dispatch = useDispatch();
  const changeCollection = event => {
    setPage(1);
    setCollection(event.target.value);
  };
  const styles = {
    empty: {
      maxWidth: 400,
      margin: '0 auto',
    },
    table: {
      minWidth: 650,
    },
  };
  //Custom Actions
  const unwrapNft = async (tokenid, canister) => {
    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error('Something wrong with your wallet, try logging in again');
    props.loader(true, 'Unwrapping NFT...');
    //hot api, will sign as identity - BE CAREFUL
    var r = await extjs
      .connect('https://icp0.io/', id)
      .canister(canister)
      .unwrap(tokenid, [extjs.toSubaccount(currentAccount ?? 0)]);
    if (!r) return error('There was an error!');
    await props.loadNfts();
    props.loader(false);
    dispatch({type: 'account/nft/remove', payload: {id: tokenid}});
    return props.alert(
      'You were successful!',
      'Your NFT has been unwrapped!' +
        (currentAccount !== 0 ? ' Unwrapped NFTs will appear in your Main account' : ''),
    );
  };
  const wrapNft = async (tokenid, canister, standard) => {
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error('Something wrong with your wallet, try logging in again');
    props.loader(true, 'Creating wrapper...this may take a few minutes');
    try {
      var wrappedCanister = props.collections.find(a => a.wrapped === canister).canister;
      var r = await extjs.connect('https://icp0.io/', id).canister(wrappedCanister).wrap(tokenid);
      if (!r) return error('There was an error wrapping this NFT!');
      props.loader(true, 'Sending NFT to wrapper...');
      var r2 = await extjs
        .connect('https://icp0.io/', id)
        .token(tokenid, standard.toLowerCase())
        .transfer(
          identity.principal,
          currentAccount,
          wrappedCanister,
          BigInt(1),
          BigInt(0),
          '00',
          false,
        );
      if (!r2) return error('There was an error wrapping this NFT!');
      props.loader(true, 'Wrapping NFT...');
      await extjs.connect('https://icp0.io/', id).canister(wrappedCanister).mint(tokenid);
      if (!r) return error('There was an error wrapping this NFT!');
      await props.loadNfts();
      props.loader(false);
      return props.alert('You were successful!', 'Your NFT has been wrapped!');
    } catch (e) {
      props.loader(false);
      console.log(e);
      return;
    }
  };
  const nftAction = (tokenid, memo, standard) => {
    //Submit to blockchain here
    var _from_principal = identity.principal;
    var _from_sa = currentAccount;
    var _to_user = account.address;
    var _amount = BigInt(1);
    var _fee = BigInt(0);
    var _memo = '00'; //TODO
    var _notify = false;

    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error('Something wrong with your wallet, try logging in again');

    props.loader(true, 'Processing NFT action...');
    //hot api, will sign as identity - BE CAREFUL
    extjs
      .connect('https://icp0.io/', id)
      .token(tokenid, standard.toLowerCase())
      .transfer(_from_principal, _from_sa, _to_user, _amount, _fee, _memo, _notify)
      .then(async r => {
        if (r !== false) {
          //update img, adhoc
          var el = document.getElementById('img-' + tokenid);
          el.src = el.src + '?t=' + new Date().getTime();
          //Update here
          props.loader(true, 'Updating tokens...');
          await props.loadNfts();
          return props.alert('You were successful!', 'You completed an advanced NFT action!');
        } else {
          return error('Something went wrong with this transfer');
        }
      })
      .catch(e => {
        return error('There was an error: ' + e);
      })
      .finally(() => {
        props.loader(false);
      });
  };

  const sendNft = nft => {
    setTokenNFT(nft);
    setOpenNFTForm(true);
  };
  const closeNFTForm = () => {
    setOpenNFTForm(false);
    setTokenNFT('');
  };
  //UTILITY
  const error = e => {
    props.loader(false);
    props.error(e);
  };
  const getMintNumber = nft => {
    if (nft.canister === 'qcg3w-tyaaa-aaaah-qakea-cai') return nft.tokenindex;
    else if (nft.canister === 'jzg5e-giaaa-aaaah-qaqda-cai') return nft.tokenindex;
    else if (nft.canister === 'bxdf4-baaaa-aaaah-qaruq-cai') return nft.tokenindex;
    else if (nft.canister === '3db6u-aiaaa-aaaah-qbjbq-cai') return nft.tokenindex;
    else if (nft.canister === 'd3ttm-qaaaa-aaaai-qam4a-cai') return nft.tokenindex;
    else if (nft.canister === 'xkbqi-2qaaa-aaaah-qbpqq-cai') return nft.tokenindex;
    else if (nft.canister === 'q6hjz-kyaaa-aaaah-qcama-cai') return nft.tokenindex;
    else return nft.tokenindex + 1;
  };

  React.useEffect(() => {
    setPage(1);
  }, [collection, props.collections.length]);

  return (
    <>
      <FormControl style={{marginRight: 20}}>
        <InputLabel>Collections</InputLabel>
        <Select value={collection} onChange={changeCollection}>
          <MenuItem value={false}>All Collections</MenuItem>
          {props.collections.map(col => {
            return (
              <MenuItem key={col.canisterId} value={col.canisterId}>
                {col.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      <span style={{marginLeft: 20, lineHeight: '50px'}}>
        Showing {props.nfts === false ? 0 : (props.nfts.filter(a => collection === false || a.canister === collection).length)}
      </span>
      {props.nfts === false || props.nfts.filter(a => collection === false || a.canister === collection).length === 0 ? (
        <div style={styles.empty}>
          <Typography paragraph style={{paddingTop: 20, fontWeight: 'bold'}} align="center">
            {props.nfts === false ? "Loading NFTs..." : "You have no NFT's right now"}
          </Typography>
        </div>
      ) : (
        <>
          {props.nfts.slice().filter(a => collection === false || a.canister === collection).length >
          perPage ? (
            <Pagination
              style={{float: 'right', marginTop: '10px', marginBottom: '20px'}}
              size="small"
              count={Math.ceil(
                props.nfts.filter(a => collection === false || a.canister === collection).length / perPage,
              )}
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
                  <TableCell width="70" style={{fontWeight: 'bold'}}>
                    #
                  </TableCell>
                  <TableCell width="220" style={{fontWeight: 'bold'}}>
                    ID
                  </TableCell>
                  <TableCell width="100" style={{fontWeight: 'bold'}}>
                    Preview
                  </TableCell>
                  <TableCell width="220" style={{fontWeight: 'bold'}}>
                    Collection/Canister
                  </TableCell>
                  <TableCell  align="right" width="300" style={{fontWeight: 'bold'}}>
                    Floor Price
                  </TableCell>
                  <TableCell width="150" align="right" style={{fontWeight: 'bold'}}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {props.nfts
                  .slice()
                  .filter(a => collection === false || a.canister === collection)
                  .filter((nft, i) => i >= (page - 1) * perPage && i < page * perPage)
                  .map((nft, i) => {
                    return (
                      <TableRow key={nft.tokenid}>
                        <TableCell style={{fontWeight: 'bold'}}>{getMintNumber(nft)}</TableCell>
                        <TableCell style={{fontWeight: 'bold'}}>
                          {compressAddress(nft.tokenid)}
                          <SnackbarButton
                            message="NFT ID Copied"
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'left',
                            }}
                            onClick={() => clipboardCopy(nft.tokenid)}
                          >
                            <IconButton size="small" edge="end" aria-label="copy">
                              <FileCopyIcon style={{fontSize: 18}} />
                            </IconButton>
                          </SnackbarButton>
                        </TableCell>
                        <TableCell>
                          <NftThumbnail nft={nft} />
                        </TableCell>
                        <TableCell>
                          {props.collections.find(a => a.canisterId === nft.canister)?.name ??
                            compressAddress(nft.canister)}<br />
                            {nft.standard}
                          <Tooltip title="View in browser">
                            <IconButton
                              size="small"
                              href={'https://icscan.io/canister/' + nft.canister}
                              target="_blank"
                              edge="end"
                              aria-label="search"
                            >
                              <LaunchIcon style={{fontSize: 18}} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          {_showPrice(nft.floor)} ICP<br />
                          ${_showPrice(nft.floorUsd, 4)} USD
                        </TableCell>
                        <TableCell align="right">
                          <>
                            <>
                              <IconButton
                                id={'more-' + nft.tokenid}
                                size="small"
                                onClick={event => {
                                  handleClick(nft.tokenid, event.currentTarget);
                                }}
                                edge="end"
                              >
                                <MoreVertIcon />
                              </IconButton>
                              <Menu
                                anchorEl={
                                  anchorEl !== null && anchorEl.id === nft.tokenid
                                    ? anchorEl.target
                                    : null
                                }
                                keepMounted
                                open={anchorEl !== null && anchorEl.id === nft.tokenid}
                                onClose={handleClose}
                              >
                                <MenuItem
                                  onClick={() => {
                                    handleClose();
                                    sendNft(nft);
                                  }}
                                >
                                  <ListItemIcon>
                                    <SendIcon fontSize="small" />
                                  </ListItemIcon>
                                  <Typography variant="inherit">Transfer</Typography>
                                </MenuItem>
                                {/*Custom actions*/}
                                {wrapperCanisters.indexOf(nft.canister) >= 0
                                  ? [
                                      <Divider key={0} />,
                                      <MenuItem
                                        key={1}
                                        onClick={() => {
                                          handleClose();
                                          unwrapNft(nft.tokenid, nft.canister);
                                        }}
                                      >
                                        <ListItemIcon>
                                          <LockOpenIcon fontSize="small" />
                                        </ListItemIcon>
                                        <Typography variant="inherit">Unwrap NFT</Typography>
                                      </MenuItem>,
                                    ]
                                  : ''}
                                {wrapableCanisters.indexOf(nft.canister) >= 0
                                  ? [
                                      <Divider key={0} />,
                                      <MenuItem
                                        key={1}
                                        onClick={() => {
                                          handleClose();
                                          wrapNft(nft.tokenid, nft.canister, "icpunks");
                                        }}
                                      >
                                        <ListItemIcon>
                                          <LockIcon fontSize="small" />
                                        </ListItemIcon>
                                        <Typography variant="inherit">Wrap NFT</Typography>
                                      </MenuItem>,
                                    ]
                                  : ''}
                                {nft.canister === 'e3izy-jiaaa-aaaah-qacbq-cai'
                                  ? [
                                      <Divider key={0} />,
                                      <MenuItem
                                        key={1}
                                        onClick={() => {
                                          handleClose();
                                          nftAction(nft.tokenid, nft.standard, 0);
                                        }}
                                      >
                                        Remove Wearables
                                      </MenuItem>,
                                    ]
                                  : ''}
                              </Menu>
                            </>
                          </>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          {props.nfts.slice().filter(a => collection === false || a.canister === collection).length >
          perPage ? (
            <Pagination
              style={{float: 'right', marginTop: '10px', marginBottom: '20px'}}
              size="small"
              count={Math.ceil(
                props.nfts.filter(a => collection === false || a.canister === collection).length / perPage,
              )}
              page={page}
              onChange={(e, v) => setPage(v)}
            />
          ) : (
            ''
          )}
        </>
      )}
      <SendNFTForm
        loadNfts={props.loadNfts}
        alert={props.alert}
        open={openNFTForm}
        close={closeNFTForm}
        loader={props.loader}
        error={error}
        nft={tokenNFT}
      />
    </>
  );
}
