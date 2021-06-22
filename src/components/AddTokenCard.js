import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import withStyles from "@material-ui/core/styles/withStyles"

const styles = {
  root: {
    height: "100%",
    width: 150
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

export default function AddTokenCard(props) {

  return (
    <Grid style={styles.root}>
      <Card style={styles.card}>
        <CardActionArea>
          <CardContent>
            <Typography variant="h5" component="h2">
              Add Token
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}
