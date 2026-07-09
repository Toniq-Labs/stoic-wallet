import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {installSignerTransport} from '../ic/icrc/transport.js';
import {SUPPORTED_STANDARDS, SCOPED_METHODS} from '../ic/icrc/standards.js';
import {notSupported, permissionNotGranted} from '../ic/icrc/jsonrpc.js';
import {getSubAccountArray} from '../ic/format.js';

// Mounts the ICRC signer: installs the ICRC-29 postMessage transport and
// services the ICRC-25 (permissions) and ICRC-27 (accounts) methods. User
// approval reuses the app's shared confirm() dialog. Renders nothing.
//
// This runs alongside the legacy stoic-connect protocol (additive rollout): the
// transport only handles JSON-RPC 2.0 messages, so legacy dapps are unaffected.
export default function SignerListener({confirm}) {
  const principals = useSelector(state => state.principals);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const dispatch = useDispatch();

  // The transport listener is installed once; it reads live state via this ref.
  const ctxRef = React.useRef();
  ctxRef.current = {principals, currentPrincipal, dispatch, confirm};

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
      ctxRef.current.dispatch({type: 'app/permissions/grant', payload: {host: origin, scopes: [method]}});
    };

    const onRequest = async (request, origin) => {
      switch (request.method) {
        case 'icrc25_supported_standards':
          return {supportedStandards: SUPPORTED_STANDARDS};
        case 'icrc25_permissions':
          return permissionsResult(origin);
        case 'icrc25_request_permissions': {
          const requested = ((request.params && request.params.scopes) || [])
            .map(s => s && s.method)
            .filter(m => SCOPED_METHODS.includes(m));
          if (!requested.length) return {scopes: []};
          const ok = await ctxRef.current.confirm(
            'Connection request',
            `"${origin}" is requesting permission to: ${requested.join(', ')}.`,
            'Reject',
            'Approve',
          );
          if (ok) {
            ctxRef.current.dispatch({
              type: 'app/permissions/grant',
              payload: {host: origin, scopes: requested},
            });
          }
          return {
            scopes: requested.map(method => ({
              scope: {method},
              state: ok ? 'granted' : 'denied',
            })),
          };
        }
        case 'icrc25_revoke_permissions': {
          const toRevoke =
            request.params && request.params.scopes
              ? request.params.scopes.map(s => s && s.method).filter(Boolean)
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
