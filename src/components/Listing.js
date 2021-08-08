import React from 'react';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import {StoicIdentity} from '../ic/identity.js';
import Tooltip from '@material-ui/core/Tooltip';
import { useSelector, useDispatch } from 'react-redux'
import LaunchIcon from '@material-ui/icons/Launch';
import Skeleton from '@material-ui/lab/Skeleton';
import Button from '@material-ui/core/Button';
import Timestamp from 'react-timestamp';
import extjs from '../ic/extjs.js';
const _getRandomBytes = () => {
  var bs = [];
  for(var i = 0; i < 32; i++) {
    bs.push(Math.floor(Math.random() * 256))
  }
  return bs;
};
const _showListingPrice = n => {
  n = Number(n) / 100000000;
  return n.toFixed(8).replace(/0{1,6}$/, '');
};
export default function Listing(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal)
  const accounts = useSelector(state => state.principals[currentPrincipal].accounts)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const tokenid = extjs.encodeTokenId("e3izy-jiaaa-aaaah-qacbq-cai", props.listing[0]);
  const error = props.error;
  const dispatch = useDispatch()
  
  const _isLocked = listing => {
    if (listing.locked.length === 0) return false;
    if (Date.now() >= Number(listing.locked[0]/1000000n)) return false;
    return true;
  };

  const buy = async () => {
    try {
      var acc = await props.showListingBuyForm();
      const id = StoicIdentity.getIdentity(identity.principal);
      const api = extjs.connect("https://boundary.ic0.app/", id);
      props.loader(true);
      var bal = await api.token().getBalance(accounts[acc].address, identity.principal);
      props.loader(false);
      if (bal < (props.listing[1].price + 10000n)) return error("You have insufficient funds for this transaction");
      var answer = await props.confirm("Please confirm", "You are about to purchase this NFT for "+_showListingPrice(props.listing[1].price)+" ICP from your account labelled \""+accounts[acc].name+"\". This process may take over 30 seconds. Are you sure you want to continue?");
      if (!answer) {
        return props.loader(false);
      };
      props.loader(true);
      var address = accounts[acc].address;
      var r = await api.canister("e3izy-jiaaa-aaaah-qacbq-cai").lock(tokenid, props.listing[1].price, address, _getRandomBytes());
      if (r.hasOwnProperty("err")) throw r.err;
      var paytoaddress = r.ok;
      await api.token().transfer(identity.principal, acc, paytoaddress, props.listing[1].price, 10000);
      var r3;
      while(true){
        try {
          r3 = await api.canister("e3izy-jiaaa-aaaah-qacbq-cai").settle(tokenid);
          if (r3.hasOwnProperty("ok")) break;
        } catch (e) {}
      }
      var md = await api.token(tokenid).getMetadata();
      props.alert("Transaction complete", "Your purchase was made successfully");
      var nft = {
        id : tokenid,
        metadata : md
      };
      dispatch({ type: 'account/nft/addToAccount', payload: {
        principal : currentPrincipal,
        account : acc,
        nft : nft
      }});
      props.refreshListings();
    } catch (e) {
      props.loader(false);
      error(e);
    };
  };
  
  return (
    <Grid style={{height:'100%'}} item xl={2} lg={2} md={3} sm={6} xs={6}>
        <Card>
          <CardContent>
            <Typography style={{fontSize: 14, textAlign:"center", fontWeight:"bold"}} color={"inherit"} gutterBottom>
              <Tooltip title="View in browser"><a style={{color:"black",textDecoration: 'none' }} href={"https://e3izy-jiaaa-aaaah-qacbq-cai.raw.ic0.app/?tokenid=" + tokenid} rel="noreferrer" target="_blank">{"#"+(props.listing[0]+1)} <LaunchIcon style={{ fontSize: 12 }} /></a></Tooltip>
            </Typography>

            <a href={"https://e3izy-jiaaa-aaaah-qacbq-cai.raw.ic0.app/?tokenid=" + tokenid} target="_blank" rel="noreferrer">
              <img alt={tokenid} style={{display:(imgLoaded ? "block" : "none")}} src={"https://e3izy-jiaaa-aaaah-qacbq-cai.raw.ic0.app/?tokenid=" + tokenid} onLoad={() => setImgLoaded(true)} />
              <Skeleton style={{margin:"0 auto",display:(imgLoaded ? "none" : "block")}} variant="circle" width={120} height={120} />
            </a>
            
            <Typography style={{fontSize: 14, textAlign:"center", fontWeight:"bold"}} color={"inherit"} gutterBottom>
              <Tooltip title="Genetic Rarity Index displays the color and trait rarity of a specific Cronic relative to others. Does not include Mint #, Twin Status or Animation within the index. Developed by a 3rd party."><a style={{color:"black",textDecoration: 'none' }} href={"https://nntkg-vqaaa-aaaad-qamfa-cai.ic.fleek.co/?tokenid=" + tokenid} rel="noreferrer" target="_blank">GRI: {(props.gri*100).toFixed(1)}%  <LaunchIcon style={{ fontSize: 12 }} /></a></Tooltip>
            </Typography>
            
            <Typography style={{fontSize: 20, textAlign:"center", fontWeight:"bold"}} color={"inherit"} gutterBottom>
              {_showListingPrice(props.listing[1].price)} ICP
            </Typography>
            
            <Typography style={{fontSize: 14, textAlign:"center"}} color={"inherit"} gutterBottom>
              { _isLocked(props.listing[1]) ? 
                <>Unlocks <Timestamp relative autoUpdate date={Number(props.listing[1].locked[0]/1000000000n)} /></>
              : 
                <Button onClick={buy} variant="contained" color="primary">Buy Now</Button>
              }
            </Typography>
          </CardContent>
        </Card>
    </Grid>
  );
}

