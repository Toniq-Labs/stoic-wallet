/* global BigInt */
import React from 'react';
import Divider from '@material-ui/core/Divider';
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
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {toHexString} from '../ic/utils.js';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { compressAddress, clipboardCopy } from '../utils.js';
import { useSelector, useDispatch } from 'react-redux'
const perPage = 10;
const api = extjs.connect("https://boundary.ic0.app/");
const nftMap = {
  "e3izy-jiaaa-aaaah-qacbq-cai" : "Cronics",
  "uzhxd-ziaaa-aaaah-qanaq-cai" : "ICP News",
  "tde7l-3qaaa-aaaah-qansa-cai" : "Cronic Wearables",
};
const allowedForMarket = [
  "e3izy-jiaaa-aaaah-qacbq-cai",
  "uzhxd-ziaaa-aaaah-qanaq-cai",
  // "tde7l-3qaaa-aaaah-qansa-cai",
];
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
  
  const handleClick = (id, target) => {
    setAnchorEl({id: id, target: target});
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const dispatch = useDispatch()
  
  const styles = {
    empty : {
      maxWidth:400,
      margin : "0 auto",
    },
    table: {
      minWidth: 650,
    },
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
    
    props.loader(true);
    //hot api, will sign as identity - BE CAREFUL
    extjs.connect("https://boundary.ic0.app/", id).token(tokenid).transfer(_from_principal, _from_sa, _to_user, _amount, _fee, _memo, _notify).then(async r => {
      if (r !== false) {
        //update img, adhoc
        var el = document.getElementById("img-"+tokenid);     
        el.src = el.src+"?t=" + new Date().getTime(); 
        //Update here
        await props.searchCollections();
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
  const sendNft = (id) => {
    setTokenNFT(id);
    setOpenNFTForm(true);
  }
  const listNft = (id) => {
    setTokenNFT(id);
    setOpenListingForm(true);
  }
  const closeNFTForm = () => {
    setOpenNFTForm(false);
    setTokenNFT('');
  };
  const handleRefresh = () => {
    getTokenDetails(tokenNFT.id, true)
  };
  const closeListingForm = () => {
    setOpenListingForm(false);
    setTimeout(() => setTokenNFT(''), 300);
  };
  const deleteNft = (id) => {
    props.confirm("Please confirm", "You are about to remove this NFT from your account? This does not affect the ownership of the NFT, and you can add it back again in future").then(v => {
      if (v) dispatch({ type: 'account/nft/remove', payload: {id:id}});
    });
  };
  const getTokenDetails = (id, refresh) => {
    if (typeof tokenDetails[id] == 'undefined') {
      tokenDetails[id] = false;
      setTokenDetails(tokenDetails);
      refresh = true;
    };
    if (refresh) {
      api.token(id).getDetails().then(b => {
        tokenDetails[id] = b;
        const newDetails = {...tokenDetails};
        setTokenDetails(newDetails);
      });
    }
  };
  const error = (e) => {
    props.error(e);
  }
  React.useEffect(() => {
    var _nfts = [];
    account.nfts.forEach(nft => {
      getTokenDetails(nft.id);
      var dec = extjs.decodeTokenId(nft.id);
      _nfts.push({
        id : nft.id,
        index : dec.index,
        canister : dec.canister,
        metadata : toHexString(nft.metadata.metadata[0]),
        price : (tokenDetails[nft.id] === false ? false : (tokenDetails[nft.id][1].length === 0 ? 0 : tokenDetails[nft.id][1][0].price)),
        bearer : (tokenDetails[nft.id] === false ? false : tokenDetails[nft.id][0]),
        allowedToList : allowedForMarket.indexOf(dec.canister) >= 0,
        listing : (tokenDetails[nft.id] === false ? false : (tokenDetails[nft.id][1].length === 0 ? 0 : tokenDetails[nft.id][1])),
        listingText : (allowedForMarket.indexOf(dec.canister) < 0 ? "Restricted" : (tokenDetails[nft.id] !== false ? (tokenDetails[nft.id][1].length === 0 ? "Not listed" : 
          (tokenDetails[nft.id][1][0].locked.length === 0 || (Number(tokenDetails[nft.id][1][0].locked[0]/1000000n) < Date.now())?
            "Listed for " + _showListingPrice(tokenDetails[nft.id][1][0].price) + " ICP" :
            "Locked @ " + _showListingPrice(tokenDetails[nft.id][1][0].price) + " ICP" )
        ) : "Loading...")),
      })
    });
    setNfts(_nfts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount, account.nfts, tokenDetails]);


  return (
    <>
      {nfts.length === 0 ?
      <div style={styles.empty}>
        <Typography paragraph style={{paddingTop:20,fontWeight:"bold"}} align="center">
          You have no NFT's right now
        </Typography>
      </div> :
      <>
        {nfts.length > perPage ?
        <Pagination style={{float:"right",marginTop:"10px",marginBottom:"20px"}} size="small" count={Math.ceil(nfts.length/perPage)} page={page} onChange={(e, v) => setPage(v)} />
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
              {nfts.filter((nft,i) => (i >= ((page-1)*perPage) && i < ((page)*perPage))).map((nft, i) => {
                return (<TableRow key={nft.id}>
                  <TableCell style={{fontWeight:'bold'}}>{nft.index+1}</TableCell>
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
                    <a href={"https://" + nft.canister + ".raw.ic0.app/?tokenid="+nft.id} target="_blank" rel="noreferrer"><img id={"img-"+nft.id} alt={compressAddress(nft.id)} src={"https://" + nft.canister + ".raw.ic0.app/?tokenid="+nft.id} style={{width:64}} /></a>
                  </TableCell>
                  <TableCell>
                    
                    {nftMap[nft.canister] ?? compressAddress(nft.canister)}<Tooltip title="View in browser">
                      <IconButton size="small" href={"https://" + nft.canister + ".raw.ic0.app"} target="_blank" edge="end" aria-label="search">
                        <LaunchIcon style={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {nft.metadata.substr(0, 32)+"..."}
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
                    {nft.listing !== false ?
                      <>{nft.bearer === account.address ?
                        <strong>{nft.listingText}</strong> :
                        <strong>SOLD/SENT</strong> 
                      }</> :
                      <strong>Loading...</strong> 
                    }
                  </TableCell>
                  <TableCell align="right">
                    {nft.listing !== false ?
                    <>
                      {nft.bearer === account.address ?
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
                            <MenuItem onClick={() => {handleClose(); sendNft(nft.id)}}>
                              <ListItemIcon>
                                <SendIcon fontSize="small" />
                              </ListItemIcon>
                              <Typography variant="inherit">Transfer</Typography>
                            </MenuItem>
                            {nft.allowedToList ?
                            <MenuItem onClick={() => {handleClose(); listNft(nft)}}>
                              <ListItemIcon>
                                <StorefrontIcon fontSize="small" />
                              </ListItemIcon>
                              <Typography variant="inherit">Manage Listing</Typography>
                            </MenuItem> : ""}
                            {nft.canister === "e3izy-jiaaa-aaaah-qacbq-cai" ?
                            ([
                              <Divider key={0} />,
                              <MenuItem key={1} onClick={() => {handleClose(); nftAction(nft.id, 0)}}>Remove Wearables</MenuItem>
                            ]): ""}
                          </Menu>
                        </>
                      </> : ""}
                       <Tooltip title="Remove from Stoic">
                        <IconButton size="small" onClick={() => deleteNft(nft.id)}>
                          <DeleteIcon size="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                    : 
                      <Tooltip title="Remove from Stoic">
                        <IconButton size="small" onClick={() => deleteNft(nft.id)}>
                          <DeleteIcon size="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  </TableCell>
                </TableRow>)
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
      <ListingForm alert={props.alert} handleRefresh={handleRefresh} open={openListingForm} close={closeListingForm} loader={props.loader} error={error} nft={tokenNFT} />
      <SendNFTForm alert={props.alert} open={openNFTForm} close={closeNFTForm} loader={props.loader} error={error} nft={tokenNFT} />
    </>
  );
}
