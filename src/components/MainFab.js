import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
}));

export default function MainFab(props) {
  const classes = useStyles();
  const style = {
      margin: 0,
      top: 'auto',
      right: 20,
      bottom: 20,
      left: 'auto',
      position: 'fixed',
  };
  return (
    <div className={classes.root}>
      <Fab style={style} {...props}>
        {props.children}
      </Fab>
    </div>
  );
}

