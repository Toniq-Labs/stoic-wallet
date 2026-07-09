import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {installSignerTransport} from '../ic/icrc/transport.js';
import {SUPPORTED_STANDARDS, SCOPED_METHODS} from '../ic/icrc/standards.js';
import {
  notSupported,
  permissionNotGranted,
  actionAborted,
  RpcError,
  ERROR_CODES,
} from '../ic/icrc/jsonrpc.js';
import {buildDelegation} from '../ic/icrc/delegation.js';
import {bytesFromParam} from '../ic/icrc/bytes.js';
import {validateTrustedOrigins} from '../ic/icrc/trustedOrigins.js';
import {callCanister} from '../ic/icrc/caller.js';
import {fetchConsentMessage} from '../ic/icrc/consent.js';
import {getSubAccountArray} from '../ic/format.js';
import {StoicIdentity} from '../ic/identity.js';

// Mounts the ICRC signer: installs the ICRC-29 postMessage transport and
// services the ICRC-25 (permissions), ICRC-27 (accounts) and ICRC-34
// (delegation) methods. Approvals reuse the app's shared confirm() dialog.
//
// Runs alongside the legacy stoic-connect protocol (additive rollout): the
// transport only handles JSON-RPC 2.0 messages, so legacy dapps are unaffected.
export default function SignerListener({confirm, appState}) {
  const principals = useSelector(state => state.principals);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const dispatch = useDispatch();

  // The transport listener is installed once; it reads live state via this ref.
  const ctxRef = React.useRef();
  ctxRef.current = {principals, currentPrincipal, dispatch, confirm, appState};

  // Requests that need the unlocked signing identity wait here until the wallet
  // reaches the unlocked state (appState === 2).
  const waitersRef = React.useRef([]);
  React.useEffect(() => {
    if (appState === 2 && waitersRef.current.length) {
      waitersRef.current.splice(0).forEach(w => w.resolve());
    }
  }, [appState]);

  React.useEffect(() => {
    const activePrincipal = () => {
      const {principals, currentPrincipal} = ctxRef.current;
      return principals && principals.length ? principals[currentPrincipal] : null;
    };
    const grantedScopes = origin => {
      const p = activePrincipal();
      const app = p && p.apps ? p.apps.find(a => a && a.host === origin) : null;
      return (app && app.scopes) || [];
    };
    const grant = (origin, scopes) =>
      ctxRef.current.dispatch({type: 'app/permissions/grant', payload: {host: origin, scopes}});
    const permissionsResult = origin => {
      const granted = grantedScopes(origin);
      return {
        scopes: SCOPED_METHODS.map(method => ({
          scope: {method},
          state: granted.includes(method) ? 'granted' : 'ask_on_use',
        })),
      };
    };
    // ICRC-27: one account per Stoic sub-account (index 0 = default, no subaccount).
    const buildAccounts = () => {
      const p = activePrincipal();
      if (!p) return [];
      const owner = p.identity.principal;
      return p.accounts.map((a, i) =>
        i === 0 ? {owner} : {owner, subaccount: Uint8Array.from(getSubAccountArray(i))},
      );
    };
    // Ensure a scope is granted, prompting the user if it is currently ask_on_use.
    const requireScope = async (origin, method, description) => {
      if (grantedScopes(origin).includes(method)) return;
      const ok = await ctxRef.current.confirm(
        'Permission request',
        `"${origin}" is requesting permission to ${description}.`,
        'Reject',
        'Approve',
      );
      if (!ok) throw permissionNotGranted(method);
      grant(origin, [method]);
    };
    // Block until the wallet is unlocked with a usable signing identity.
    const waitForUnlock = () =>
      new Promise((resolve, reject) => {
        if (ctxRef.current.appState === 2) return resolve();
        const timer = setTimeout(() => reject(actionAborted()), 5 * 60 * 1000);
        waitersRef.current.push({resolve: () => (clearTimeout(timer), resolve())});
      });

    const handleDelegation = async (origin, params) => {
      await waitForUnlock();
      const p = activePrincipal();
      const identity = p && StoicIdentity.getIdentity(p.identity.principal);
      if (!identity || typeof identity.sign !== 'function') {
        throw new RpcError(ERROR_CODES.GENERIC, 'This account type cannot issue a delegation');
      }
      const targets = Array.isArray(params.targets) && params.targets.length ? params.targets : undefined;
      // ICRC-28: a canister-scoped (targets) delegation is only allowed when the
      // relying party is a trusted origin of every target canister.
      if (targets) {
        const trusted = await validateTrustedOrigins(origin, targets);
        if (!trusted) {
          throw new RpcError(
            ERROR_CODES.PERMISSION_NOT_GRANTED,
            'This app is not a trusted origin for the requested canister(s)',
          );
        }
      }
      const scopeText = targets
        ? `act on your behalf on: ${targets.join(', ')}`
        : 'act as you on ANY canister (unrestricted)';
      const ok = await ctxRef.current.confirm(
        'Sign-in request',
        `"${origin}" is requesting a delegation to ${scopeText}.`,
        'Reject',
        'Approve',
      );
      if (!ok) throw actionAborted();
      grant(origin, ['icrc34_delegation']);
      return buildDelegation(identity, bytesFromParam(params.publicKey), {
        targets,
        maxTimeToLive: params.maxTimeToLive,
      });
    };

    const handleCall = async (origin, params) => {
      await waitForUnlock();
      const p = activePrincipal();
      const identity = p && StoicIdentity.getIdentity(p.identity.principal);
      if (!identity || typeof identity.sign !== 'function') {
        throw new RpcError(ERROR_CODES.GENERIC, 'This account type cannot make calls');
      }
      // The requested sender must be the connected account.
      if (params.sender && params.sender !== identity.getPrincipal().toText()) {
        throw new RpcError(ERROR_CODES.GENERIC, 'Sender does not match the connected account');
      }
      const argBytes = bytesFromParam(params.arg);
      // ICRC-21: show the canister's consent message when available; otherwise
      // warn that this is a blind approval. User approval is never skipped.
      const consent = await fetchConsentMessage({
        canisterId: params.canisterId,
        method: params.method,
        arg: argBytes,
      });
      const detail = consent
        ? consent
        : `${params.canisterId} · ${params.method}\n\nThis canister provides no consent message. Approve only if you trust "${origin}".`;
      const ok = await ctxRef.current.confirm('Approve transaction', detail, 'Reject', 'Approve');
      if (!ok) throw actionAborted();
      grant(origin, ['icrc49_call_canister']);
      return callCanister(identity, {
        canisterId: params.canisterId,
        method: params.method,
        arg: argBytes,
        nonce: params.nonce ? bytesFromParam(params.nonce) : undefined,
      });
    };

    const onRequest = async (request, origin) => {
      const params = request.params || {};
      switch (request.method) {
        case 'icrc25_supported_standards':
          return {supportedStandards: SUPPORTED_STANDARDS};
        case 'icrc25_permissions':
          return permissionsResult(origin);
        case 'icrc25_request_permissions': {
          const requested = (params.scopes || [])
            .map(s => s && s.method)
            .filter(m => SCOPED_METHODS.includes(m));
          if (!requested.length) return {scopes: []};
          const ok = await ctxRef.current.confirm(
            'Connection request',
            `"${origin}" is requesting permission to: ${requested.join(', ')}.`,
            'Reject',
            'Approve',
          );
          if (ok) grant(origin, requested);
          return {
            scopes: requested.map(method => ({scope: {method}, state: ok ? 'granted' : 'denied'})),
          };
        }
        case 'icrc25_revoke_permissions': {
          const toRevoke = params.scopes
            ? params.scopes.map(s => s && s.method).filter(Boolean)
            : undefined;
          const remaining = toRevoke
            ? grantedScopes(origin).filter(s => !toRevoke.includes(s))
            : [];
          ctxRef.current.dispatch({
            type: 'app/permissions/revoke',
            payload: {host: origin, scopes: toRevoke},
          });
          return {
            scopes: SCOPED_METHODS.map(method => ({
              scope: {method},
              state: remaining.includes(method) ? 'granted' : 'ask_on_use',
            })),
          };
        }
        case 'icrc27_accounts':
          await requireScope(origin, 'icrc27_accounts', 'see your account list');
          return {accounts: buildAccounts()};
        case 'icrc34_delegation':
          return handleDelegation(origin, params);
        case 'icrc49_call_canister':
          return handleCall(origin, params);
        default:
          throw notSupported(request.method);
      }
    };

    const uninstall = installSignerTransport(onRequest);
    return uninstall;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
