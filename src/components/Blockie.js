import React from 'react';
import makeBlockie from 'ethereum-blockies-base64';
const style = {
  width: '100%',
  height: '100%',
};
function Blockie(props) {
  return (
    <img
      alt={props.address}
      loading="lazy"
      decoding="async"
      style={style}
      src={makeBlockie(props.address)}
    />
  );
}
export default Blockie;
