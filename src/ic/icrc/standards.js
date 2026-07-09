// The ICRC standards Stoic advertises via icrc25_supported_standards, and the
// map of permission-gated JSON-RPC methods to their ICRC-25 scope.
//
// A "scope" (ICRC-25) is the permission for a relying party to invoke a specific
// method. Methods listed here require a granted scope before Stoic will service
// them; methods absent from the map (icrc25_*, icrc29_status) are always allowed.

const BASE = 'https://github.com/dfinity/wg-identity-authentication/blob/main/topics';

// Advertised in icrc25_supported_standards.
export const SUPPORTED_STANDARDS = [
  {name: 'ICRC-25', url: `${BASE}/icrc_25_signer_interaction_standard.md`},
  {name: 'ICRC-27', url: `${BASE}/icrc_27_accounts.md`},
  {name: 'ICRC-29', url: `${BASE}/icrc_29_window_post_message_transport.md`},
  {name: 'ICRC-34', url: `${BASE}/icrc_34_delegation.md`},
  {name: 'ICRC-49', url: `${BASE}/icrc_49_call_canister.md`},
];

// JSON-RPC methods gated behind an ICRC-25 permission scope. The scope name
// equals the method name per the standards.
export const SCOPED_METHODS = ['icrc27_accounts', 'icrc34_delegation', 'icrc49_call_canister'];

// Methods that never require a permission (session/negotiation methods).
export const OPEN_METHODS = [
  'icrc29_status',
  'icrc25_request_permissions',
  'icrc25_permissions',
  'icrc25_revoke_permissions',
  'icrc25_supported_standards',
];

export const isScopedMethod = method => SCOPED_METHODS.includes(method);

// Every method Stoic knows how to handle (used to reject unknown methods with
// ERROR_CODES.NOT_SUPPORTED).
export const KNOWN_METHODS = [...OPEN_METHODS, ...SCOPED_METHODS];

export const isKnownMethod = method => KNOWN_METHODS.includes(method);
