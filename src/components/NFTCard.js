import React from 'react';
import Skeleton from '@material-ui/lab/Skeleton';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

const styles = {
  root: {
    height: '100%',
  },
  selectedCard: {
    height: 132,
    overflow: 'hidden',
    backgroundColor: '#003240',
    color: 'white',
  },
  card: {
    height: 132,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
};
function NFTCard(props) {
  const handleClick = () => {
    props.onClick();
  };
  return (
    <Grid style={styles.root} item xs={6} sm={4} md={4} lg={3} xl={2}>
      <Card onClick={handleClick} style={props.selected ? styles.selectedCard : styles.card}>
        <CardActionArea>
          <CardContent>
            <Typography
              style={styles.title}
              color={props.selected ? 'inherit' : 'textSecondary'}
              gutterBottom
              noWrap
            >
              {props.title}
            </Typography>
            <Typography variant="h6" noWrap>
              {props.count >= 0 ? props.count : ''}{' '}
              {props.count >= 0 ? (
                typeof props.count != 'string' ? (
                  <> NFT{props.count === 1 ? '' : 's'}</>
                ) : (
                  ''
                )
              ) : (
                <Skeleton variant="text" width={70} style={{display: 'inline-block'}} />
              )}
            </Typography>
            {/*<Typography style={styles.pos} color={props.selected ? "inherit" : "textSecondary"}>
              ~$123.04USD
            </Typography>*/}
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}

export default React.memo(NFTCard);
