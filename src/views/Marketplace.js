/* global BigInt */
import React from 'react';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Pagination from '@material-ui/lab/Pagination';
import StorefrontIcon from '@material-ui/icons/Storefront';
import {StoicIdentity} from '../ic/identity.js';
import extjs from '../ic/extjs.js';
import { useTheme } from '@material-ui/core/styles';
import ListingBuyForm from '../components/ListingBuyForm';
import { useSelector } from 'react-redux'
import Listing from '../components/Listing';
const perPage = 18;
const api = extjs.connect("https://boundary.ic0.app/");

var cb = null;
var allowedPrincipals = [
  "4opr7-aaepd-uw2ok-lpt52-bi5to-nguta-7r7gr-gx57i-tnzlw-ewjid-qae",
  "sensj-ihxp6-tyvl7-7zwvj-fr42h-7ojjp-n7kxk-z6tvo-vxykp-umhfk-wqe",
  "gt6pl-emtcy-selas-w57zx-kyok4-5ofde-vf5nq-6773c-2t6bv-bsems-tqe",
  "qzbdz-mtxb4-orry7-pvi45-w3e47-sclbg-xqr6z-zld6i-ertsb-xth33-eqe",
];
var intv = false;
export default function Marketplace(props) {
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [listings, setListings] = React.useState([]);
  const accounts = useSelector(state => state.principals[currentPrincipal].accounts)
  const [page, setPage] = React.useState(1);
  const [listingBuyFormOpen, setListingBuyFormOpen] = React.useState(false);
  
  const listingBuyFormSubmit = (d) => {
    listingBuyFormClose();
    cb(d);
    cb = null;
  }  
  
  const _extractFunds = async () => {
    const id = StoicIdentity.getIdentity(identity.principal);
    const _api = extjs.connect("https://boundary.ic0.app/", id);
    var payments = await _api.canister("e3izy-jiaaa-aaaah-qacbq-cai").payments();
    if (payments.length === 0) return;
    payments[0].map(async payment => {
      var a = extjs.toAddress(identity.principal, payment);
      var b = Number(await api.token().getBalance(a));
      if (b <= 10000) return;
      _api.token().transfer(identity.principal, payment, accounts[0].address, BigInt(b-10000), BigInt(10000));
    });
  };
  const listingBuyFormClose = () => {    
    setListingBuyFormOpen(false);
  };
  /*const withdraw = async () => {
    try {
      var answer = await props.confirm("Withdraw sale proceeds", "If you have sold items, you need to manually withdraw sale proceeds. Would you like to look for any funds to withdraw (this can take some time)?");
      if (!answer) {
        return props.loader(false);
      };
      props.loader(true);
      const id = StoicIdentity.getIdentity(identity.principal);
      const _api = extjs.connect("https://boundary.ic0.app/", id);
      var payments = await _api.canister("e3izy-jiaaa-aaaah-qacbq-cai").payments();
      if (payments.length === 0) return props.alert("Sorry!", "There are no funds to be withdrawn");
      var ps = payments[0].map(async payment => {
        var a = extjs.toAddress(identity.principal, payment);
        var b = Number(await api.token().getBalance(a));
        if (b <= 10000) return;
        return _api.token().transfer(identity.principal, payment, accounts[0].address, BigInt(b-10000), BigInt(10000));
      });
      Promise.all(ps).then(() => {
        props.alert("Funds Sent", "We found some funds to withdraw and have sent them to your Main account");
      }).finally(() => {       
        props.loader(false);
      });
    } catch (e) {
      props.loader(false);
      error(e);
    };
  }*/
  const showListingBuyForm = () => {
    setListingBuyFormOpen(true);
    return new Promise((resolve, reject) => {
      cb = resolve;
    });
  };
  
  const theme = useTheme();
  const styles = {
    root : {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    empty : {
      maxWidth:800,
      margin : "0 auto",
      textAlign:"center"
    },
    grid: {
      flexGrow: 1,
      padding: theme.spacing(2)
    },

    largeIcon: {
      width: 60,
      height: 60,
    },
  };
  const refreshListings = () => {
    api.canister("e3izy-jiaaa-aaaah-qacbq-cai").listings().then(listings => {
      setListings(listings);
    }).finally(() => {
      props.loader(false);      
    });
  }
  const error = (e) => {
    props.alert("There was an error", e);
  };
  React.useEffect(() => {
    props.loader(true);
    refreshListings();
    _extractFunds();
    if (!intv) {
      intv = setInterval(_extractFunds, 30 *1000);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (allowedPrincipals.indexOf(identity.principal) < 0) return (<>IN TESTING</>);
  else return (
    <div style={styles.root}>
    {listings.length === 0 ?
      <div style={styles.empty}>
        <Typography paragraph align="center">
          <StorefrontIcon style={styles.largeIcon} />
        </Typography>
        <Typography paragraph style={{paddingTop:20,fontWeight:"bold"}} align="center">
          There are no listings added to the marketplace. You can list NFTs for sale directly from your wallet! 
          
        </Typography>
        <Button onClick={() => {props.loader(true);refreshListings();}} variant="contained" color="primary">Refresh Listings</Button>
      </div> :
      <>
        <div style={styles.empty}>
          <Typography paragraph style={{paddingTop:20,fontWeight:"bold"}} align="center">
            Buy and Sell NFTs from the Marketplace. You can list NFTs for sale directly from your wallet!
          </Typography>
          <Button onClick={() => {props.loader(true);refreshListings();}} variant="contained" color="primary">Refresh Listings</Button>
          
        </div>
        {listings.length > perPage ?
        <Pagination style={{float:"right",marginTop:"10px",marginBottom:"20px"}} size="small" count={Math.ceil(listings.length/perPage)} page={page} onChange={(e, v) => setPage(v)} />
        : ""}
        <div style={styles.grid}>
          <Grid
            container
            spacing={2}
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
          >
            {listings.slice().reverse().filter((token,i) => (i >= ((page-1)*perPage) && i < ((page)*perPage))).map((listing, i) => {
              return (<Listing refreshListings={refreshListings} showListingBuyForm={showListingBuyForm} loader={props.loader} error={error} key={listing[0]} listing={listing} confirm={props.confirm} />)
            })}
          </Grid>
        </div>
      </>
    }
    <ListingBuyForm open={listingBuyFormOpen} onSubmit={listingBuyFormSubmit} onClose={listingBuyFormClose} />
    </div>
  );
}