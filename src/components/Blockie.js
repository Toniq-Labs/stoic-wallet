import React, { useState, useEffect } from 'react';
import makeBlockie from 'ethereum-blockies-base64';
const style = {
  width:"100%", 
  height:"100%", 
}
function Blockie(props) {
  return (<img style={style} src={makeBlockie(props.address)}/>);
}
export default Blockie;