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
import StorefrontIcon from '@material-ui/icons/Storefront';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import SnackbarButton from '../components/SnackbarButton';
import Pagination from '@material-ui/lab/Pagination';
import SendNFTForm from '../components/SendNFTForm';
import ListingForm from '../components/ListingForm';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import extjs from '../ic/extjs.js';
import CANISTERS from '../ic/canisters.js';
import {StoicIdentity} from '../ic/identity.js';
import {toHexString} from '../ic/utils.js';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { compressAddress, clipboardCopy } from '../utils.js';
import { useSelector, useDispatch } from 'react-redux'
import { getNftsListIntersection } from '../hooks/useDab';
import NftThumbnail from './NftThumbnail';
const perPage = 20;
const api = extjs.connect("https://boundary.ic0.app/");
const _showListingPrice = n => {
  n = Number(n) / 100000000;
  return n.toFixed(8).replace(/0{1,6}$/, '');
};
// var allowedPrincipals = [
  // "4opr7-aaepd-uw2ok-lpt52-bi5to-nguta-7r7gr-gx57i-tnzlw-ewjid-qae",
  // "sensj-ihxp6-tyvl7-7zwvj-fr42h-7ojjp-n7kxk-z6tvo-vxykp-umhfk-wqe",
  // "gt6pl-emtcy-selas-w57zx-kyok4-5ofde-vf5nq-6773c-2t6bv-bsems-tqe",
  // "qzbdz-mtxb4-orry7-pvi45-w3e47-sclbg-xqr6z-zld6i-ertsb-xth33-eqe",
// ];
export default function NFTList(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const currentAccount = useSelector(state => state.currentAccount)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const account = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].accounts[currentAccount] : {}));
  const [nfts, setNfts] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [tokenDetails, setTokenDetails] = React.useState({});
  const [openNFTForm, setOpenNFTForm] = React.useState(false);
  const [openListingForm, setOpenListingForm] = React.useState(false);
  const [tokenNFT, setTokenNFT] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState({});
  const [collection, setCollection] = React.useState(false);
  const [collections, setCollections] = React.useState([]);
  const [wearableFilter, setWearableFilter] = React.useState('all');

  const changeWearableFilter = async (event) => {
    setPage(1);
    setWearableFilter(event.target.value);
  };
  
  const handleClick = (id, target) => {
    setAnchorEl({id: id, target: target});
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const dispatch = useDispatch()
  const changeCollection = (event) => {
    setPage(1);
    setCollection(event.target.value);
  };
  const styles = {
    empty : {
      maxWidth:400,
      margin : "0 auto",
    },
    table: {
      minWidth: 650,
    },
  };
  const unwrapNft = async (tokenid, canister) => {
    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    props.loader(true, "Unwrapping NFT...");
    //hot api, will sign as identity - BE CAREFUL
    var r = await extjs.connect("https://boundary.ic0.app/", id).canister(canister).unwrap(tokenid, [extjs.toSubaccount(currentAccount ?? 0)]);
    if (!r) return error("There was an error!");
    await loadNfts();
    props.loader(false);
    dispatch({ type: 'account/nft/remove', payload: {id:tokenid}});
    return props.alert("You were successful!", "Your NFT has been unwrapped!" + (currentAccount !== 0 ? " Unwrapped NFTs will appear in your Main account" : ""));    
  };
  const wrapNft = async (tokenid, canister) => {
    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    props.loader(true, "Creating wrapper...this may take a few minutes");
    //hot api, will sign as identity - BE CAREFUL
    
    try{
      var wrappedCanister = props.collections.find(a => a.wrapped == canister).canister;
      var r = await extjs.connect("https://boundary.ic0.app/", id).canister(wrappedCanister).wrap(tokenid);
      if (!r) return error("There was an error wrapping this NFT!");
      props.loader(true, "Sending NFT to wrapper...");
      var r2 = await extjs.connect("https://boundary.ic0.app/", id).token(tokenid).transfer(identity.principal, currentAccount, wrappedCanister, BigInt(1), BigInt(0), "00", false);
      if (!r2) return error("There was an error wrapping this NFT!");
      props.loader(true, "Wrapping NFT...");
      var r3 = await extjs.connect("https://boundary.ic0.app/", id).canister(wrappedCanister).mint(tokenid);
      if (!r) return error("There was an error wrapping this NFT!");
      await loadNfts();
      props.loader(false);
      _removeNft(tokenid)
      return props.alert("You were successful!", "Your NFT has been wrapped!");
    } catch(e) {
      props.loader(false);
      console.log(e);
      return
    };
  };
  const _removeNft = (tokenid) => {
    loadNfts();
  };
  const nftAction = (tokenid, memo) => {
    //Submit to blockchain here
    var _from_principal = identity.principal;
    var _from_sa = currentAccount;
    var _to_user = account.address;
    var _amount = BigInt(1);
    var _fee = BigInt(0);
    var _memo = "00";//TODO
    var _notify = false;
    
    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");
    
    props.loader(true, "Processing NFT action...");
    //hot api, will sign as identity - BE CAREFUL
    extjs.connect("https://boundary.ic0.app/", id).token(tokenid).transfer(_from_principal, _from_sa, _to_user, _amount, _fee, _memo, _notify).then(async r => {
      if (r !== false) {
        //update img, adhoc
        var el = document.getElementById("img-"+tokenid);     
        el.src = el.src+"?t=" + new Date().getTime(); 
        //Update here
        props.loader(true, "Updating tokens...");
        await loadNfts();
        return props.alert("You were successful!", "You completed an advanced NFT action!");
      } else {        
        return error("Something went wrong with this transfer");
      }
    }).catch(e => {
      return error("There was an error: " + e);
    }).finally(() => {
      props.loader(false);
    });
  };
  const sendNft = (nft) => {
    setTokenNFT(nft);
    setOpenNFTForm(true);
  }
  const listNft = (nft) => {
    setTokenNFT(nft);
    setOpenListingForm(true);
  }
  const closeNFTForm = () => {
    setOpenNFTForm(false);
    setTokenNFT('');
  };
  const handleRefresh = () => {
    //getTokenDetails(tokenNFT.id, true)
    loadNfts();
  };
  const closeListingForm = () => {
    setOpenListingForm(false);
    setTimeout(() => setTokenNFT(''), 300);
  };
  const deleteNft = (id) => {
    props.confirm("Please confirm", "You are about to remove this NFT from your account? This does not affect the ownership of the NFT, and you can add it back again in future").then(v => {
      if (v) {
        _removeNft(id);
      }
    });
  };

  const error = (e) => {
    props.loader(false);
    props.error(e);
  }

  const getMintNumber = nft => {
    if(nft.isDabToken) return nft.index;
    if (nft.canister === "qcg3w-tyaaa-aaaah-qakea-cai") return nft.index;
    else if (nft.canister === "jzg5e-giaaa-aaaah-qaqda-cai") return nft.index;
    else if (nft.canister === "bxdf4-baaaa-aaaah-qaruq-cai") return nft.index;
    else if (nft.canister === "3db6u-aiaaa-aaaah-qbjbq-cai") return nft.index;
    else if (nft.canister === "d3ttm-qaaaa-aaaai-qam4a-cai") return nft.index;
    else if (nft.canister === "xkbqi-2qaaa-aaaah-qbpqq-cai") return nft.index;
    else if (nft.canister === "q6hjz-kyaaa-aaaah-qcama-cai") return nft.index;
    else return nft.index+1;
  }
  const wearableMap = ["accessories","hats","eyewear","pets"];
  const loadNfts = React.useCallback(
    async () => {
      var decoder;
      var _nfts = [];
      var _collections = [];
      try {
        new Uint8Array([]);
        decoder = new TextDecoder();
      } catch (e) { console.log('Browser can\'t decode.'); };
      var scanned = [];
      await Promise.all(props.collections.map(c => {
        return new Promise((resolve, reject) => {
          if(c.isDabCollection){
            _collections = _collections.concat(c.canister);
            _nfts = _nfts.concat(c.nfts);
            setCollections([...new Set(_collections)]);
            setNfts(getNftsListIntersection(_nfts));
            resolve();
          }
          if (scanned.indexOf(c.canister) >= 0) return resolve();
          scanned.push(c.canister);
          var allowedForMarket = props.collections.filter(a => a.market).map(a => a.canister);
          api.token(c.canister).getTokens(account.address, identity.principal).then(nfts => {
            if (nfts.length){
              _nfts = _nfts.concat(nfts.map(nft => {
                return {
                  ...nft,
                  metadata : toHexString(nft.metadata),
                  allowedToList : allowedForMarket.indexOf(nft.canister) >= 0,
                };
              }));
              _collections = _collections.concat(c.canister);
              setCollections([...new Set(_collections)]);
              setNfts(getNftsListIntersection(_nfts));
            }
            resolve();
          }).catch(e => {
            api.token(c.canister).getTokensLegacy(account.address, identity.principal).then(nfts => {
              if (nfts.length){
                _nfts = _nfts.concat(nfts.map(nft => {
                  return {
                    ...nft,
                    metadata : toHexString(nft.metadata),
                    allowedToList : allowedForMarket.indexOf(nft.canister) >= 0,
                  };
                }));
                _collections = _collections.concat(c.canister);
                setCollections([...new Set(_collections)]);
                setNfts(getNftsListIntersection(_nfts));
              }
              resolve();
            }).catch(e => {
              resolve();
            });
          });
        });
      }));
    },[account.address, identity.principal, props.collections]);
  React.useEffect(() => {
    loadNfts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount, props.childRefresh, props.collections.length]);

  React.useEffect(() => {
    setPage(1);
  }, [collection]);

  const displayMetadataInfo = (metadata) => {
    if(typeof metadata === "string"){
      return metadata.slice(0, 32)+"..."
    }
    if(typeof metadata === "object"){
      let data;
      try{
        data = JSON.stringify(metadata, null, 2);
      }catch{
        console.error("Could not stringify metadata", metadata);
        return ""
      }
      return <pre>{data}</pre>;
    }
  }


  return (
    <>
      <FormControl style={{marginRight:20}}>
      <InputLabel>Collections</InputLabel>
      <Select
        value={collection}
        onChange={changeCollection}
      >
      <MenuItem value={false}>All Collections</MenuItem>
      {collections.map(col => {
        return (<MenuItem key={col} value={col}>{props.collections.find(a => a.canister == col)?.name ?? col}</MenuItem>)
      })}
      </Select>
      </FormControl>
      {collection === "tde7l-3qaaa-aaaah-qansa-cai" ? 
      <FormControl style={{minWidth:120}}>
        <InputLabel>Wearable Type</InputLabel>
        <Select
          value={wearableFilter}
          onChange={changeWearableFilter}
        >
          <MenuItem value={"all"}>All Wearables</MenuItem>
          <MenuItem value={"pets"}>Pets</MenuItem>
          <MenuItem value={"accessories"}>Accessories/Flags</MenuItem>
          <MenuItem value={"hats"}>Hats/Hair</MenuItem>
          <MenuItem value={"eyewear"}>Eyewear</MenuItem>
        </Select>
      </FormControl> : "" }
      <span style={{marginLeft:20,lineHeight:"50px"}}>Showing {nfts.filter(a => (collection == false || a.canister == collection)).length}</span>
      {nfts.length === 0 ?
      <div style={styles.empty}>
        <Typography paragraph style={{paddingTop:20,fontWeight:"bold"}} align="center">
          You have no NFT's right now
        </Typography>
      </div> :
      <>
        {nfts.slice().filter(a => (collection == false || a.canister == collection)).length > perPage ?
        <Pagination style={{float:"right",marginTop:"10px",marginBottom:"20px"}} size="small" count={Math.ceil(nfts.filter(a => (collection == false || a.canister == collection)).length/perPage)} page={page} onChange={(e, v) => setPage(v)} />
        : ""}
        
        <TableContainer component={Paper}>
          <Table style={styles.table} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell width="70" style={{fontWeight:'bold'}}>#</TableCell>
                <TableCell width="220" style={{fontWeight:'bold'}}>ID</TableCell>
                <TableCell width="100" style={{fontWeight:'bold'}}>Preview</TableCell>
                <TableCell width="220" style={{fontWeight:'bold'}}>Collection/Canister</TableCell>
                <TableCell style={{fontWeight:'bold'}}>Metadata</TableCell>
                <TableCell width="200" style={{fontWeight:'bold'}}>Marketplace</TableCell>
                <TableCell width="150" align="right" style={{fontWeight:'bold'}}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nfts.slice().filter(a => (collection == false || a.canister == collection)).filter((nft,i) => (i >= ((page-1)*perPage) && i < ((page)*perPage))).map((nft, i) => {
                return (<TableRow key={nft.id}>
                  <TableCell style={{fontWeight:'bold'}}>{getMintNumber(nft)}</TableCell>
                  <TableCell style={{fontWeight:'bold'}}>
                    {compressAddress(nft.id)}
                    <SnackbarButton
                      message="NFT ID Copied"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      onClick={() => clipboardCopy(nft.id)}
                    >
                      <IconButton size="small" edge="end" aria-label="copy">
                        <FileCopyIcon  style={{ fontSize: 18 }} />
                      </IconButton>
                    </SnackbarButton>
                  </TableCell>
                  <TableCell>
                    <NftThumbnail nft={nft} />
                  </TableCell>
                  <TableCell>
                    
                    {props.collections.find(a => a.canister == nft.canister)?.name ?? compressAddress(nft.canister)}<Tooltip title="View in browser">
                      <IconButton size="small" href={"https://" + nft.canister + ".raw.ic0.app"} target="_blank" edge="end" aria-label="search">
                        <LaunchIcon style={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {displayMetadataInfo(nft.metadata)}
                    <SnackbarButton
                      message="NFT Metadata Copied"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      onClick={() => clipboardCopy(nft.metadata)}
                    >
                      <IconButton size="small" edge="end" aria-label="copy">
                        <FileCopyIcon  style={{ fontSize: 18 }} />
                      </IconButton>
                    </SnackbarButton>
                  </TableCell>
                  <TableCell>
                    {nft.listing == false ? 
                      <>{nft.allowedToList ? <><strong>Not Listed</strong></> : <><strong>Restricted</strong></>}</> :
                      <>{nft.listing.locked.length ? <><strong>Locked @ {(Number(nft.listing.price/1000000n)/100).toFixed(2)} ICP</strong></> : <><strong>Listed @ {(Number(nft.listing.price/1000000n)/100).toFixed(2)} ICP</strong></>}</>}
                  </TableCell>
                  <TableCell align="right">
                      <>
                        <>
                          <IconButton id={"more-"+nft.id} size="small" onClick={event => handleClick(nft.id, event.currentTarget)} edge="end">
                            <MoreVertIcon />
                          </IconButton>
                          <Menu
                            anchorEl={anchorEl !== null && anchorEl.id === nft.id ? anchorEl.target : null}
                            keepMounted
                            open={(anchorEl !== null && anchorEl.id === nft.id)}
                            onClose={handleClose}
                          >
                            <MenuItem onClick={() => {handleClose(); sendNft(nft)}}>
                              <ListItemIcon>
                                <SendIcon fontSize="small" />
                              </ListItemIcon>
                              <Typography variant="inherit">Transfer</Typography>
                            </MenuItem>
                            {nft.allowedToList || nft.listing ?
                            <MenuItem onClick={() => {handleClose(); listNft(nft)}}>
                              <ListItemIcon>
                                <StorefrontIcon fontSize="small" />
                              </ListItemIcon>
                              <Typography variant="inherit">Manage Listing</Typography>
                            </MenuItem> : ""}
                            {["q6hjz-kyaaa-aaaah-qcama-cai", "3db6u-aiaaa-aaaah-qbjbq-cai", "bxdf4-baaaa-aaaah-qaruq-cai"].indexOf(nft.canister) >= 0 ?
                            ([
                              <Divider key={0} />,
                              <MenuItem key={1} onClick={() => {handleClose(); unwrapNft(nft.id, nft.canister)}}>
                                <ListItemIcon>
                                  <LockOpenIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="inherit">Unwrap NFT</Typography>
                              </MenuItem>
                            ]): ""}
                            {["xkbqi-2qaaa-aaaah-qbpqq-cai", "qcg3w-tyaaa-aaaah-qakea-cai","jzg5e-giaaa-aaaah-qaqda-cai", "d3ttm-qaaaa-aaaai-qam4a-cai"].indexOf(nft.canister) >= 0 ?
                            ([
                              <Divider key={0} />,
                              <MenuItem key={1} onClick={() => {handleClose(); wrapNft(nft.id, nft.canister)}}>
                                <ListItemIcon>
                                  <LockIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="inherit">Wrap NFT</Typography>
                              </MenuItem>
                            ]): ""}
                            {nft.canister === "e3izy-jiaaa-aaaah-qacbq-cai" ?
                            ([
                              <Divider key={0} />,
                              <MenuItem key={1} onClick={() => {handleClose(); nftAction(nft.id, 0)}}>Remove Wearables</MenuItem>
                            ]): ""}
                          </Menu>
                        </>
                       <Tooltip title="Remove from Stoic">
                        <IconButton size="small" onClick={() => deleteNft(nft.id)}>
                          <DeleteIcon size="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  </TableCell>
                </TableRow>)
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {nfts.slice().filter(a => (collection == false || a.canister == collection)).length > perPage ?
        <Pagination style={{float:"right",marginTop:"10px",marginBottom:"20px"}} size="small" count={Math.ceil(nfts.filter(a => (collection == false || a.canister == collection)).length/perPage)} page={page} onChange={(e, v) => setPage(v)} />
        : ""}
      </>}
      <ListingForm alert={props.alert} handleRefresh={handleRefresh} open={openListingForm} close={closeListingForm} loader={props.loader} error={error} nft={tokenNFT} />
      <SendNFTForm loadNfts={loadNfts} alert={props.alert} open={openNFTForm} close={closeNFTForm} loader={props.loader} error={error} nft={tokenNFT} />
    </>
  );
}
