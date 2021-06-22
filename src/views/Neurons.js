import React from 'react';
import { useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';

function Neurons(props) {
  const theme = useTheme();
  const styles = {
    root : {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    empty : {
      maxWidth:400,
      margin : "0 auto",
      paddingTop : 30
    },

    largeIcon: {
      width: 60,
      height: 60,
    },
  };

  return (
    <div style={styles.root}>
      <div style={styles.empty}>
        <Typography paragraph align="center">
          <AllInclusiveIcon style={styles.largeIcon} />
        </Typography>
        <Typography paragraph align="center">
          Sorry, neuron management is still cooking away over at Toniq Labs. Please be patient!
        </Typography>
        
        
        {/*
        <Typography paragraph align="center">
          <AllInclusiveIcon style={styles.largeIcon} />
        </Typography>
        <Typography paragraph style={{fontWeight:"bold"}} align="center">
          No neurons available
        </Typography>
        <Typography paragraph align="center">
          You can create create and manage neurons directly from Stoic.
        </Typography>*/}
      </div>
    </div>
  );
}

export default Neurons;