import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { useSelector } from 'react-redux'

const styles = {
  root: {
    height: "100%",
  },
  selectedCard: {
    height: "100%",
    backgroundColor: '#003240',
    color: 'white'
  },
  card: {
    height: "100%",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
};
export default function NFTCard(props) {
  const handleClick = () => {
    props.onClick();
  };
  return (
    <Grid style={styles.root} item xl={2} lg={3} md={4}>
      <Card onClick={handleClick} style={props.selected ? styles.selectedCard : styles.card }>
        <CardActionArea>
          <CardContent>
            <Typography style={styles.title} color={props.selected ? "inherit" : "textSecondary"} gutterBottom>
              {props.title}
            </Typography>
            <Typography variant="h6" >
            {props.count >= 0 ? props.count  : ''} {props.count >= 0 ? typeof props.count != "string" ? <> NFT{props.count === 1 ? "" : "s"}</> : "" : 'Loading...'}
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
