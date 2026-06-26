import {isHex} from './ic/format';

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

const identityTypes = {
  ii: 'Internet Identity',
  private: 'Mnemonic Key',
  watch: 'Read-only',
  pem: 'PEM Import',
  google: 'Google Account',
  twitter: 'Twitter Account',
  reddit: 'Reddit Account',
  github: 'Github Account',
  facebook: 'Facebook Account',
};

const clipboardCopy = text => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(
    () => {},
    err => {
      console.error('Async: Could not copy text: ', err);
    },
  );
};

const compressAddress = a => {
  if (!a) return '';
  if (a.length === 64 && isHex(a)) return a.substr(0, 16) + '...';
  const pp = a.split('-');
  if (pp.length <= 4) return a;
  return (
    pp[0] +
    '-' +
    pp[1].substr(0, 3) +
    '...' +
    pp[pp.length - 3].substr(2) +
    '-' +
    pp[pp.length - 2] +
    '-' +
    pp[pp.length - 1]
  );
};

const numf = (n, d) => {
  if (n === 'N/A') return n;
  d = d ?? 2;
  return n.toFixed(d).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

const formatNumberForDisplay = n => {
  // Expand scientific notation (e.g. 1e-7) to fixed decimals for display.
  const nStr = n.toString();
  if (nStr.includes('e-')) {
    const exponent = parseInt(nStr.split('e-')[1], 10);
    return n.toFixed(exponent);
  }
  return n;
};

export {clipboardCopy, compressAddress, numf, identityTypes, formatNumberForDisplay};
