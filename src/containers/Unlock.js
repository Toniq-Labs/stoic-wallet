import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import TextField from '@material-ui/core/TextField';
import {StoicIdentity} from '../ic/identity.js';
import {useSelector, useDispatch} from 'react-redux';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Blockie from '../components/Blockie';
import TwitterIcon from '@material-ui/icons/Twitter';
import MailIcon from '@material-ui/icons/Mail';
import FacebookIcon from '@material-ui/icons/Facebook';
import GitHubIcon from '@material-ui/icons/GitHub';
import {useFilePicker} from 'use-file-picker';
import {identityTypes} from '../utils';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {useTheme} from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';

function Unlock(props) {
  const principals = useSelector(state => state.principals);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const identity = useSelector(state =>
    state.principals.length ? state.principals[currentPrincipal].identity : {},
  );
  const [open, setOpen] = React.useState(true);
  const [changeDialog, setChangeDialog] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const dispatch = useDispatch();
  const [openFileSelector, fsobj] = useFilePicker({
    accept: '.pem',
    multiple: false,
  });
  React.useEffect(() => {
    if (fsobj.filesContent.length > 0) {
      var od = {
        pem: fsobj.filesContent[0].content,
      };
      fsobj.clear();
      StoicIdentity.unlock(identity, od)
        .then(r => {
          props.login();
        })
        .catch(e => {
          console.error(e);
        })
        .finally(() => {
          setOpen(true);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsobj.filesContent]);
  const error = e => {
    props.alert('There was an error', e);
  };
  const clear = () => {
    props
      .confirm(
        'Please confirm',
        'You are about to clear your wallet, which will remove all data from this device. Are you sure you want to continue?',
      )
      .then(v => {
        if (v) {
          setOpen(false);
          props.remove();
        }
      });
  };
  const changePrincipal = p => {
    dispatch({type: 'currentPrincipal', payload: {index: p}});
    setChangeDialog(false);
  };
  const change = () => {
    setChangeDialog(true);
  };
  const loginPassword = () => {
    if (!StoicIdentity.validatePassword(password))
      return error('Password is invalid, please try again');
    props.loader(true);
    setOpen(false);

    StoicIdentity.unlock(identity, {password: password})
      .then(r => {
        props.login();
      })
      .catch(e => {
        setPassword('');
        return error('You entered an incorrect password');
      })
      .finally(() => {
        setOpen(true);
        props.loader(false);
      });
  };
  const pemLogin = () => {
    openFileSelector();
  };
  const iiLogin = () => {
    props.loader(true);
    setOpen(false);
    StoicIdentity.unlock(identity)
      .then(r => {
        props.login();
      })
      .catch(e => {
        error(e.message || String(e));
      })
      .finally(() => {
        setTimeout(() => {
          setOpen(true);
          props.loader(false);
        }, 2000);
      });
  };
  const capitalizeFirstLetter = ([first, ...rest], locale = navigator.language) =>
    first.toLocaleUpperCase(locale) + rest.join('');

  // --- presentation only below; the unlock handlers above are unchanged ---
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));
  const isSocial = ['google', 'twitter', 'facebook', 'github'].indexOf(identity.type) >= 0;
  const socialIcon = {
    google: <MailIcon />,
    twitter: <TwitterIcon />,
    facebook: <FacebookIcon />,
    github: <GitHubIcon />,
  }[identity.type];

  // Footer actions shared by every unlock method.
  const commonActions = (
    <>
      {principals.length > 1 ? (
        <Button onClick={change} color="primary">
          Change Account
        </Button>
      ) : (
        ''
      )}
      <Button onClick={clear} color="primary">
        Clear Wallet
      </Button>
    </>
  );

  // The unlock-method-specific content + actions (single source instead of a
  // duplicated <Dialog> per method).
  let content = null;
  let actions = commonActions;
  if (identity.type === 'ii') {
    content = (
      <List component="nav" aria-label="unlock method">
        <ListItem button onClick={iiLogin}>
          <ListItemIcon>
            <AllInclusiveIcon />
          </ListItemIcon>
          <ListItemText
            primary="Re-authenticate your Internet Identity"
            secondary="We need to authenticate your Internet Identity"
          />
        </ListItem>
      </List>
    );
  } else if (identity.type === 'pem') {
    content = (
      <List component="nav" aria-label="unlock method">
        <ListItem button onClick={pemLogin}>
          <ListItemIcon>
            <InsertDriveFileIcon />
          </ListItemIcon>
          <ListItemText
            primary="Select your PEM file to access your wallet"
            secondary="We need to authenticate your PEM file"
          />
        </ListItem>
      </List>
    );
  } else if (identity.type === 'private') {
    content = (
      <>
        <p>
          <strong>Enter your password to unlock your wallet.</strong>
        </p>
        <TextField
          id="standard-textarea"
          label="Enter Password"
          fullWidth
          required
          type="password"
          autoComplete="off"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') loginPassword();
          }}
        />
      </>
    );
    actions = (
      <>
        {commonActions}
        <Button onClick={loginPassword} color="primary">
          Unlock
        </Button>
      </>
    );
  } else if (isSocial) {
    content = (
      <List component="nav" aria-label="unlock method">
        <ListItem button onClick={iiLogin}>
          <ListItemIcon>{socialIcon}</ListItemIcon>
          <ListItemText
            primary={'Login to your ' + capitalizeFirstLetter(identity.type) + ' account'}
            secondary="We need to authenticate your account to continue"
          />
        </ListItem>
      </List>
    );
  }

  return (
    <Dialog hideBackdrop maxWidth={'sm'} fullWidth fullScreen={fullScreen} open={open}>
      {changeDialog ? (
        <>
          <DialogTitle id="form-dialog-title" style={{textAlign: 'center'}}>
            Switch Principal
          </DialogTitle>
          <DialogContent>
            <List component="nav" aria-label="principals">
              {principals.map((principal, i) => {
                const firstAccount = principal.accounts[0];
                const accountCount = principal.accounts.length;
                return (
                  <ListItem
                    key={principal.identity.principal}
                    button
                    selected={i === currentPrincipal}
                    onClick={() => changePrincipal(i)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <Blockie
                          address={
                            firstAccount
                              ? firstAccount.address
                              : (principal.identity.principal ?? '')
                          }
                        />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primaryTypographyProps={{noWrap: true}}
                      secondaryTypographyProps={{noWrap: true, component: 'span'}}
                      primary={principal.identity.principal}
                      secondary={
                        <>
                          {identityTypes[principal.identity.type]} · {accountCount} account
                          {accountCount === 1 ? '' : 's'}
                          {firstAccount ? (
                            <>
                              <br />
                              {firstAccount.address.substr(0, 24) + '…'}
                            </>
                          ) : (
                            ''
                          )}
                        </>
                      }
                    />
                    {i === currentPrincipal ? <CheckIcon style={{color: '#00b894'}} /> : null}
                  </ListItem>
                );
              })}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChangeDialog(false)} color="primary">
              Back
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle id="form-dialog-title" style={{textAlign: 'center'}}>
            Unlock your Wallet
          </DialogTitle>
          <DialogContent>{content}</DialogContent>
          <DialogActions>{actions}</DialogActions>
        </>
      )}
    </Dialog>
  );
}

export default Unlock;
