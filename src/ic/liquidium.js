/* global BigInt */
// Liquidium lending integration (https://liquidium.fi).
//
// Liquidium is an ICP-canister-based lending protocol. It connects with the same
// @icp-sdk/core identity Stoic uses, so read data works with no identity and
// write flows (supply/borrow) can be signed with the user's Stoic identity.
//
// SAFETY: the read helpers below move no funds. The supply/borrow WRITE flow is
// multi-step (Liquidium profile + HTTP API + a signed canister transfer) and
// moves real user funds. It is wired here for review but is NOT enabled in the
// UI yet — it must be live-tested against Liquidium's canisters/API and security
// reviewed before being turned on. See docs/liquidium and the Earn view.
import {LiquidiumClient} from '@liquidium/client';

let _readClient = null;
// Read-only client (no identity). Per the SDK, canister/API reads work with {}.
export function getReadClient() {
  if (!_readClient) _readClient = new LiquidiumClient({});
  return _readClient;
}

// Signed client for write flows, using the user's Stoic signing identity
// (@icp-sdk/core Identity). Only needed for supply/borrow/withdraw.
export function getSignedClient(identity) {
  return new LiquidiumClient({identity});
}

// An APR/ratio scaled by `rateDecimals` -> percentage number (2dp) for display.
const rateToPct = (rate, rateDecimals) => {
  try {
    return Number((BigInt(rate) * 10000n) / 10n ** BigInt(rateDecimals)) / 100;
  } catch (e) {
    return null;
  }
};
// base-unit bigint -> human number using `decimals`.
const toDisplay = (amount, decimals) => {
  try {
    return Number(BigInt(amount)) / 10 ** Number(decimals);
  } catch (e) {
    return null;
  }
};

// List the supported lending pools with supply/borrow APY, for the Earn
// dashboard. Read-only (no identity, no funds).
export async function listMarkets() {
  const pools = await getReadClient().market.listPools();
  return pools.map(p => ({
    id: p.id,
    asset: p.asset,
    chain: p.chain,
    frozen: p.frozen,
    supplyApy: rateToPct(p.lendingRate, p.rateDecimals),
    borrowApy: rateToPct(p.borrowingRate, p.rateDecimals),
    utilization: rateToPct(p.utilizationRate, p.rateDecimals),
    availableLiquidity: toDisplay(p.availableLiquidity, p.decimals),
    totalSupply: toDisplay(p.totalSupply, p.decimals),
  }));
}

// --- WRITE FLOW (wired for review; NOT yet enabled in the UI) ------------------
// Supply (lend/earn) into a Liquidium pool. Multi-step: ensure a Liquidium
// profile, request a supply target, transfer the ckAsset to it, then submit the
// inflow. Requires a live test + security review before enabling.
export async function supply(identity, {profileId, poolId, amount}) {
  const client = getSignedClient(identity);
  const flow = await client.lending.supply({profileId, poolId, action: 'deposit', amount});
  // flow.target is where funds go; flow.submit(...) reports the inflow after the
  // ckAsset transfer completes. The transfer + submit orchestration is the part
  // that must be validated end-to-end before this is exposed to users.
  return flow;
}
