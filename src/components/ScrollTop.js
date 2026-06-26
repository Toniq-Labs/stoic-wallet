import React from 'react';
import Fab from '@material-ui/core/Fab';
import Zoom from '@material-ui/core/Zoom';
import useScrollTrigger from '@material-ui/core/useScrollTrigger';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

// A back-to-top button that fades in once the page is scrolled down.
export default function ScrollTop() {
  const trigger = useScrollTrigger({disableHysteresis: true, threshold: 200});
  const handleClick = () => window.scrollTo({top: 0, behavior: 'smooth'});
  return (
    <Zoom in={trigger}>
      <Fab
        size="small"
        color="primary"
        aria-label="scroll back to top"
        onClick={handleClick}
        style={{position: 'fixed', bottom: 16, left: 16, zIndex: 1200}}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
}
