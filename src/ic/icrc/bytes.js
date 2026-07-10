// Pure byte helpers for the ICRC signer (no @dfinity deps, so unit-testable).

export const toU8 = b => {
  if (b instanceof Uint8Array) return b;
  if (b instanceof ArrayBuffer) return new Uint8Array(b);
  if (Array.isArray(b)) return Uint8Array.from(b);
  return new Uint8Array(b);
};

const hexToBytes = h => {
  const clean = h.length % 2 ? '0' + h : h;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
};

const base64ToBytes = s => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

// Decode a blob received in an ICRC request. Over the ICRC-29 transport a blob
// may arrive as raw bytes (structured clone) or, from JSON clients, as a base64
// or hex string. Binary forms are preferred; strings are parsed as hex when they
// look like hex, otherwise base64.
export const bytesFromParam = v => {
  if (v instanceof Uint8Array) return v;
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (Array.isArray(v)) return Uint8Array.from(v);
  if (v && typeof v === 'object' && typeof v.byteLength === 'number') {
    return new Uint8Array(v.buffer || v);
  }
  if (typeof v === 'string') {
    return /^[0-9a-fA-F]+$/.test(v) && v.length % 2 === 0 ? hexToBytes(v) : base64ToBytes(v);
  }
  throw new Error('Unsupported blob encoding');
};
