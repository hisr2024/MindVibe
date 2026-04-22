/**
 * In-App Purchase Service for Kiaanverse — 4-Tier Model (March 2026)
 *
 * Play Billing / StoreKit implementation on top of react-native-iap 12.x.
 *
 * Design:
 * - Module-scoped connection + listeners attached once, stored on
 *   `globalThis` so they survive Metro hot reloads without duplicating
 *   native subscriptions (a common source of double-finishTransaction
 *   bugs in dev).
 * - Purchases are never finished (acknowledged) until the backend has
 *   verified the receipt. Play auto-refunds unacknowledged purchases
 *   after 72h — that is the safety net: if verification fails or the
 *   device dies, the user is not charged.
 * - Android PENDING purchases (cash, direct carrier billing) are NOT
 *   verified or acknowledged. They are held by Play until settlement,
 *   at which point Play re-emits the event as PURCHASED.
 * - Every purchase is tagged with the signed-in user id
 *   (`obfuscatedAccountIdAndroid` / `appAccountToken`) so the backend
 *   can reject receipts replayed from other accounts.
 * - Pending promise resolvers are keyed by productId so
 *   `purchaseSubscription` can await the event-loop outcome, with a
 *   2-minute ceiling so promises can never hang.
 * - Receipt verification is retried once with short backoff; a purchase
 *   that fails to verify is intentionally left unacknowledged.
 *
 * Public API is unchanged from the prior stub so existing callers
 * (subscription.tsx, store) compile without edits.
 */

import { Platform, type EmitterSubscription } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  getAvailablePurchases,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  flushFailedPurchasesCachedAsPendingAndroid,
  deepLinkToSubscriptions,
  PurchaseStateAndroid,
  type Subscription,
  type SubscriptionAndroid,
  type SubscriptionIOS,
  type SubscriptionPurchase,
  type ProductPurchase,
  type PurchaseError,
} from 'react-native-iap';

import { ReplacementModesAndroid } from 'react-native-iap';

import { apiClient } from '../client';
import {
  IAP_PRODUCT_IDS,
  TIER_CONFIGS,
  TIER_RANK,
  type SubscriptionTier,
  type BillingPeriod,
} from './constants';

// ---------------------------------------------------------------------------
// Public types (callers depend on these — do not break)
// ---------------------------------------------------------------------------

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod;
}

export interface PurchaseResult {
  success: boolean;
  tier: SubscriptionTier;
  expiresAt?: string;
  error?: string;
  /** True when the user dismissed the billing sheet (no toast needed). */
  cancelled?: boolean;
}

export interface ReceiptVerificationPayload {
  receipt: string;
  platform: 'ios' | 'android';
  product_id: string;
}

export interface ReceiptVerificationResponse {
  valid: boolean;
  tier: string;
  expires_at: string | null;
  error?: string;
}

export class IAPError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'IAPError';
    this.code = code;
  }
}

/**
 * Recognises the "Play Store hasn't activated the product yet" failure
 * mode. Covers:
 *   - `E_OFFER_UNAVAILABLE` — our own IAPError when the cached
 *     SubscriptionAndroid exists but has no offerToken
 *   - `E_PRODUCT_NOT_FOUND` — raw code from react-native-iap when the
 *     sku is entirely unknown to Play
 *   - Message substrings — covers both the IAPError copy above and
 *     any string relayed via onError callbacks, which only surfaces the
 *     message (no code) to the UI layer.
 *
 * Used by screens to show a "Coming soon" alert rather than the scary
 * "Purchase unsuccessful" copy when the real reason is store
 * configuration.
 */
export function isSubscriptionUnavailableError(
  err: unknown,
): boolean {
  const code =
    err instanceof IAPError
      ? err.code
      : ((err as { code?: unknown })?.code as string | undefined) ?? '';
  if (code === 'E_OFFER_UNAVAILABLE' || code === 'E_PRODUCT_NOT_FOUND') return true;

  const message =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : '';
  return (
    message.toLowerCase().includes('not available') ||
    message.includes('E_PRODUCT_NOT_FOUND') ||
    message.includes('E_OFFER_UNAVAILABLE') ||
    // react-native-iap sometimes surfaces "SKU not found" on Android when
    // the sku list passed to getSubscriptions doesn't match what's live.
    message.toLowerCase().includes('sku not found')
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PURCHASE_TIMEOUT_MS = 120_000;
const VERIFY_MAX_ATTEMPTS = 2;
const VERIFY_RETRY_DELAY_MS = 1_500;

// ---------------------------------------------------------------------------
// Module state — bridged via globalThis so Metro reloads don't leak
// native listeners. Without this, each `r` key in the Metro CLI attaches
// a fresh JS listener while the old native one remains — which means
// every purchase event fires twice (and the second call to
// finishTransaction throws).
// ---------------------------------------------------------------------------

interface GlobalIapState {
  connectionPromise: Promise<boolean> | null;
  purchaseSub: EmitterSubscription | null;
  errorSub: EmitterSubscription | null;
  cachedSubscriptions: Subscription[];
  pendingResolvers: Map<string, (r: PurchaseResult) => void>;
  inflightProductIds: Set<string>;
  /** Optional app-account tag for linking receipts to the signed-in user. */
  accountTag: string | null;
}

const GLOBAL_KEY = '__kiaanverseIapState';

function getState(): GlobalIapState {
  const g = globalThis as unknown as Record<string, GlobalIapState | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      connectionPromise: null,
      purchaseSub: null,
      errorSub: null,
      cachedSubscriptions: [],
      pendingResolvers: new Map(),
      inflightProductIds: new Set(),
      accountTag: null,
    };
  }
  return g[GLOBAL_KEY]!;
}

// ---------------------------------------------------------------------------
// Account tagging
// ---------------------------------------------------------------------------

/**
 * Set the signed-in user tag. Called from the auth flow at login so
 * purchases can be bound to this user on both stores. Clearing is safe
 * on logout. Android hash must be ≤ 64 chars alphanumeric; iOS requires
 * a UUID. We pass the raw string and trust the caller to normalise.
 */
export function setIapAccountTag(tag: string | null): void {
  getState().accountTag = tag;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function productIdToTier(productId: string): SubscriptionTier {
  if (productId.includes('bhakta')) return 'bhakta';
  if (productId.includes('sadhak')) return 'sadhak';
  if (productId.includes('siddha')) return 'siddha';
  return 'free';
}

function productIdToBilling(productId: string): BillingPeriod {
  return productId.includes('yearly') ? 'yearly' : 'monthly';
}

function resolvePending(productId: string, result: PurchaseResult): void {
  const state = getState();
  const resolver = state.pendingResolvers.get(productId);
  if (resolver) {
    state.pendingResolvers.delete(productId);
    state.inflightProductIds.delete(productId);
    resolver(result);
  }
}

/**
 * Extract the platform-appropriate receipt token.
 * - Android: `purchaseToken` (required for server-side verification via
 *   the Google Play Developer API).
 * - iOS: `transactionReceipt` (StoreKit base64-encoded receipt).
 */
function extractReceipt(purchase: ProductPurchase | SubscriptionPurchase): string {
  if (Platform.OS === 'android') {
    return purchase.purchaseToken ?? purchase.transactionReceipt ?? '';
  }
  return purchase.transactionReceipt ?? '';
}

async function verifyWithRetry(
  receipt: string,
  productId: string,
): Promise<ReceiptVerificationResponse> {
  let lastError: string | undefined;
  for (let attempt = 1; attempt <= VERIFY_MAX_ATTEMPTS; attempt++) {
    try {
      const result = await verifyReceipt(receipt, productId);
      // Transient backend failure — our verifyReceipt() swallows network
      // errors into `{ valid: false, error: 'Receipt validation failed.' }`.
      // Only retry if it looks like a transport issue, not a valid
      // "invalid receipt" response.
      if (result.valid || result.error !== 'Receipt validation failed.') {
        return result;
      }
      lastError = result.error;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (attempt < VERIFY_MAX_ATTEMPTS) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, VERIFY_RETRY_DELAY_MS * attempt),
      );
    }
  }
  return {
    valid: false,
    tier: 'free',
    expires_at: null,
    error: lastError ?? 'Receipt validation failed.',
  };
}

/**
 * Handle a purchase event: skip if pending, verify with backend, then
 * finish transaction. We intentionally do NOT finish the transaction
 * before verification — if verification fails (or the device dies),
 * Play auto-refunds after 72h, which is the correct outcome.
 */
async function handlePurchaseEvent(
  purchase: ProductPurchase | SubscriptionPurchase,
): Promise<void> {
  const productId = purchase.productId;

  // Android PENDING state: user paid via cash / DCB and Play is waiting
  // for settlement. Do NOT verify, do NOT acknowledge. Play re-emits the
  // event as PURCHASED once funds clear (typically minutes, up to 3 days).
  if (
    Platform.OS === 'android' &&
    purchase.purchaseStateAndroid === PurchaseStateAndroid.PENDING
  ) {
    resolvePending(productId, {
      success: false,
      tier: 'free',
      error:
        'Your payment is being processed. You will receive access as soon as it completes.',
    });
    return;
  }

  const receipt = extractReceipt(purchase);
  if (!receipt) {
    resolvePending(productId, {
      success: false,
      tier: 'free',
      error: 'Purchase receipt is missing — please contact support.',
    });
    return;
  }

  try {
    const verification = await verifyWithRetry(receipt, productId);

    if (!verification.valid) {
      resolvePending(productId, {
        success: false,
        tier: 'free',
        error: verification.error ?? 'Receipt verification failed.',
      });
      return;
    }

    // Subscriptions on Android must be acknowledged within 3 days or Play
    // auto-refunds. `finishTransaction` with isConsumable=false sends the
    // acknowledge call. On iOS this finishes the StoreKit transaction.
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch (finishErr) {
      // Verification already succeeded — server-side truth is the
      // subscription is active. Play will retry acknowledge on next
      // flushFailedPurchasesCachedAsPendingAndroid() call (wired in
      // initializeIAP). Safe to continue.
      console.warn('IAP: finishTransaction failed post-verify:', finishErr);
    }

    const success: PurchaseResult = {
      success: true,
      tier: verification.tier as SubscriptionTier,
    };
    if (verification.expires_at) success.expiresAt = verification.expires_at;
    resolvePending(productId, success);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Receipt verification error';
    resolvePending(productId, { success: false, tier: 'free', error: message });
  }
}

function handlePurchaseError(error: PurchaseError): void {
  // User cancellation is not a failure — Play reports E_USER_CANCELLED,
  // iOS reports paymentCancelled. Surface cancel flag so the UI can
  // suppress an error toast.
  const isCancelled =
    error.code === 'E_USER_CANCELLED' || error.code === 'E_USER_ERROR';

  const state = getState();
  const message = isCancelled
    ? 'Purchase cancelled.'
    : error.message ?? 'Purchase failed. Please try again.';

  // react-native-iap doesn't reliably expose which productId the error
  // belongs to, so we reject every in-flight purchase. In practice there
  // is always ≤ 1 in flight because of the inflightProductIds guard.
  for (const [productId, resolver] of state.pendingResolvers) {
    state.pendingResolvers.delete(productId);
    state.inflightProductIds.delete(productId);
    const result: PurchaseResult = { success: false, tier: 'free', error: message };
    if (isCancelled) result.cancelled = true;
    resolver(result);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function initializeIAP(): Promise<void> {
  const state = getState();
  if (!state.connectionPromise) {
    state.connectionPromise = initConnection();
  }

  const connected = await state.connectionPromise;
  if (!connected) {
    state.connectionPromise = null;
    throw new IAPError('Store connection failed', 'E_CONNECTION_FAILED');
  }

  // Android: replay any pending purchases cached by Play (e.g. user paid
  // but app crashed before acknowledge). Required per Play Billing docs.
  if (Platform.OS === 'android') {
    try {
      await flushFailedPurchasesCachedAsPendingAndroid();
    } catch {
      // non-fatal — the purchase listener will still pick up new events
    }
  }

  // Attach listeners exactly once across the app lifetime AND across
  // Metro hot reloads (see globalThis comment above).
  if (!state.purchaseSub) {
    state.purchaseSub = purchaseUpdatedListener((event) => {
      void handlePurchaseEvent(event);
    });
  }
  if (!state.errorSub) {
    state.errorSub = purchaseErrorListener(handlePurchaseError);
  }
}

export async function disconnectIAP(): Promise<void> {
  const state = getState();
  state.purchaseSub?.remove();
  state.errorSub?.remove();
  state.purchaseSub = null;
  state.errorSub = null;
  state.connectionPromise = null;
  state.cachedSubscriptions = [];
  state.pendingResolvers.clear();
  state.inflightProductIds.clear();
  state.accountTag = null;
  try {
    await endConnection();
  } catch {
    // endConnection is idempotent — safe to swallow
  }
}

export async function getProducts(): Promise<IAPProduct[]> {
  await initializeIAP();
  const state = getState();

  try {
    const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
    const skus = Object.values(IAP_PRODUCT_IDS).map((entry) => entry[platform]);
    state.cachedSubscriptions = await getSubscriptions({ skus });

    return state.cachedSubscriptions.map(mapSubscriptionToIAPProduct);
  } catch (err) {
    console.warn('IAP: getSubscriptions failed, returning fallback config:', err);
    return getFallbackProducts();
  }
}

export async function purchaseSubscription(
  tier: SubscriptionTier,
  billingPeriod: BillingPeriod = 'monthly',
  callbacks?: {
    onComplete?: (result: PurchaseResult) => void;
    onError?: (error: string) => void;
  },
): Promise<void> {
  if (tier === 'free') {
    callbacks?.onError?.('Cannot purchase the free tier.');
    return;
  }

  try {
    await initializeIAP();
    const state = getState();

    // Make sure we have the store payload so we can find the offerToken
    // on Android. Harmless on iOS.
    if (state.cachedSubscriptions.length === 0) {
      await getProducts();
    }

    const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
    const tierKey = `${tier.toUpperCase()}_${billingPeriod.toUpperCase()}` as
      | 'BHAKTA_MONTHLY'
      | 'BHAKTA_YEARLY'
      | 'SADHAK_MONTHLY'
      | 'SADHAK_YEARLY'
      | 'SIDDHA_MONTHLY'
      | 'SIDDHA_YEARLY';
    const sku = IAP_PRODUCT_IDS[tierKey][platform];

    // Re-entrance guard: ignore a second tap while the first purchase is
    // still awaiting the native sheet. Prevents resolver collisions.
    if (state.inflightProductIds.has(sku)) {
      callbacks?.onError?.('A purchase is already in progress.');
      return;
    }
    state.inflightProductIds.add(sku);

    // Timeout + resolver promise. If the native sheet never emits (e.g.
    // a system dialog eats the response), we still resolve cleanly.
    const result = await new Promise<PurchaseResult>((resolve) => {
      const timeout = setTimeout(() => {
        // Clean up the resolver so a late event doesn't double-call.
        state.pendingResolvers.delete(sku);
        state.inflightProductIds.delete(sku);
        resolve({
          success: false,
          tier: 'free',
          error: 'The Play Store took too long to respond. Please try again.',
        });
      }, PURCHASE_TIMEOUT_MS);

      state.pendingResolvers.set(sku, (r) => {
        clearTimeout(timeout);
        resolve(r);
      });

      void dispatchSubscriptionRequest(sku, state.accountTag).catch((err: unknown) => {
        clearTimeout(timeout);
        state.pendingResolvers.delete(sku);
        state.inflightProductIds.delete(sku);
        const message = err instanceof Error ? err.message : 'Purchase failed.';
        resolve({ success: false, tier: 'free', error: message });
      });
    });

    if (result.success) {
      callbacks?.onComplete?.(result);
    } else if (!result.cancelled) {
      callbacks?.onError?.(result.error ?? 'Purchase did not complete.');
    }
    // Silently ignore cancelled purchases — user dismissed the sheet.
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected purchase error';
    callbacks?.onError?.(message);
  }
}

/**
 * Android-aware dispatch. Responsibilities:
 * 1. Pick the correct `offerToken` (prefer a base-plan offer over any
 *    offer tagged as a free trial so upgrades don't silently reset the
 *    user into a new trial period).
 * 2. Detect an existing active subscription via
 *    `getAvailablePurchases()` and, if the user is switching SKUs, add
 *    `purchaseTokenAndroid` + a policy-correct `replacementModeAndroid`.
 *    Without this, Play rejects the request with "you already own this
 *    item". We read from the store locally (not from our backend) so
 *    the token is always fresh and the flow works offline after init.
 * 3. Pass the signed-in user id so Play / App Store attach it to the
 *    transaction, enabling server-side binding of receipts to users.
 *
 * iOS doesn't need explicit upgrade args — StoreKit handles it
 * automatically when all paid SKUs are in the same Subscription Group
 * in App Store Connect. A one-time store config step, not code.
 */
async function dispatchSubscriptionRequest(
  sku: string,
  accountTag: string | null,
): Promise<void> {
  const state = getState();

  if (Platform.OS === 'android') {
    const androidSub = state.cachedSubscriptions.find(
      (s): s is SubscriptionAndroid =>
        'subscriptionOfferDetails' in s && s.productId === sku,
    );
    const offers = androidSub?.subscriptionOfferDetails ?? [];

    const chosen =
      offers.find(
        (o) =>
          (o.offerTags ?? []).length === 0 ||
          (o.offerTags ?? []).every((t) => t.toLowerCase() !== 'free-trial'),
      ) ?? offers[0];

    if (!chosen?.offerToken) {
      throw new IAPError(
        'This plan is not available on the Play Store yet. Please try again later.',
        'E_OFFER_UNAVAILABLE',
      );
    }

    const replacement = await resolveReplacementArgsAndroid(sku);

    await requestSubscription({
      sku,
      subscriptionOffers: [{ sku, offerToken: chosen.offerToken }],
      ...replacement,
      ...(accountTag ? { obfuscatedAccountIdAndroid: accountTag } : {}),
    });
    return;
  }

  // iOS — relies on the App Store Connect Subscription Group for
  // upgrade / downgrade behaviour; the client only forwards the account
  // tag so the user-to-receipt binding is preserved.
  await requestSubscription({
    sku,
    ...(accountTag ? { appAccountToken: accountTag } : {}),
  });
}

/**
 * Compute the Play Billing replacement payload for an upgrade or
 * downgrade. Returns an empty object when the user has no existing
 * subscription (i.e. a first-time purchase) so `requestSubscription`
 * can spread it safely in both cases.
 *
 * Policy:
 * - Upgrade (higher tier, or same tier switching monthly→yearly):
 *   `CHARGE_PRORATED_PRICE` — the new plan starts immediately, the
 *   user is credited for unused time on the old plan, and billed for
 *   the prorated remainder of the first period.
 * - Downgrade (lower tier, or yearly→monthly on the same tier):
 *   `DEFERRED` — the current plan keeps running until its period end,
 *   then the new plan takes over. Avoids unexpected refunds and
 *   matches standard SaaS semantics.
 */
async function resolveReplacementArgsAndroid(
  newSku: string,
): Promise<
  | { purchaseTokenAndroid: string; replacementModeAndroid: ReplacementModesAndroid }
  | Record<string, never>
> {
  try {
    const existingPurchases = await getAvailablePurchases();
    const existing = existingPurchases.find(
      (p) => p.productId !== newSku && Boolean(p.purchaseToken),
    );
    if (!existing?.purchaseToken) {
      return {};
    }

    const newTier = productIdToTier(newSku);
    const newBilling = productIdToBilling(newSku);
    const existingTier = productIdToTier(existing.productId);
    const existingBilling = productIdToBilling(existing.productId);

    const newRank = TIER_RANK[newTier];
    const existingRank = TIER_RANK[existingTier];

    const isUpgrade =
      newRank > existingRank ||
      (newRank === existingRank &&
        existingBilling === 'monthly' &&
        newBilling === 'yearly');

    return {
      purchaseTokenAndroid: existing.purchaseToken,
      replacementModeAndroid: isUpgrade
        ? ReplacementModesAndroid.CHARGE_PRORATED_PRICE
        : ReplacementModesAndroid.DEFERRED,
    };
  } catch (err) {
    // Unable to read active purchases — proceed as a fresh purchase.
    // Play will surface its own "you already own this item" error if
    // there really is an active subscription; that's safe and
    // actionable (user can restore / contact support).
    console.warn('IAP: resolveReplacementArgsAndroid failed:', err);
    return {};
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    await initializeIAP();

    const purchases = await getAvailablePurchases();
    if (purchases.length === 0) {
      return {
        success: false,
        tier: 'free',
        error: 'No active subscriptions found on this account.',
      };
    }

    // Verify the most recent purchase with our backend. The server is
    // the source of truth for tier / expiry.
    const latest = purchases.reduce((a, b) =>
      (a.transactionDate ?? 0) > (b.transactionDate ?? 0) ? a : b,
    );
    const receipt = extractReceipt(latest);
    if (!receipt) {
      return { success: false, tier: 'free', error: 'Restore receipt missing.' };
    }

    const verification = await verifyWithRetry(receipt, latest.productId);
    if (!verification.valid) {
      return {
        success: false,
        tier: 'free',
        error: verification.error ?? 'Subscription is no longer active.',
      };
    }

    // Acknowledge restored purchases if they weren't previously
    // acknowledged (e.g. re-install on a new device).
    try {
      await finishTransaction({ purchase: latest, isConsumable: false });
    } catch {
      // non-fatal
    }

    const restored: PurchaseResult = {
      success: true,
      tier: verification.tier as SubscriptionTier,
    };
    if (verification.expires_at) restored.expiresAt = verification.expires_at;
    return restored;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Restore failed';
    return { success: false, tier: 'free', error: message };
  }
}

export async function verifyReceipt(
  receipt: string,
  productId: string,
): Promise<ReceiptVerificationResponse> {
  const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
  try {
    const response = await apiClient.post<ReceiptVerificationResponse>(
      '/api/subscription/verify',
      { receipt, platform, product_id: productId } satisfies ReceiptVerificationPayload,
    );
    return response.data;
  } catch {
    return {
      valid: false,
      tier: 'free',
      expires_at: null,
      error: 'Receipt validation failed.',
    };
  }
}

/**
 * Open the store's subscription-management screen. On iOS this opens
 * Settings → Apple ID → Subscriptions; on Android it deep-links to the
 * Play subscription screen for the current app (and the specific sku
 * when provided). Falls back to a plain URL if the SDK call fails.
 */
export async function openManageSubscription(sku?: string): Promise<void> {
  try {
    await deepLinkToSubscriptions(sku ? { sku } : {});
  } catch (err) {
    console.warn('IAP: deepLinkToSubscriptions failed:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Mappers / fallbacks
// ---------------------------------------------------------------------------

function mapSubscriptionToIAPProduct(sub: Subscription): IAPProduct {
  const productId = sub.productId;
  const tier = productIdToTier(productId);
  const billingPeriod = productIdToBilling(productId);

  // Android v5 subscription payload
  if ('subscriptionOfferDetails' in sub) {
    const android = sub as SubscriptionAndroid;
    const phase =
      android.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0];
    return {
      productId,
      title: android.title || TIER_CONFIGS[tier].name,
      description: android.description || TIER_CONFIGS[tier].description,
      price: phase?.formattedPrice ?? TIER_CONFIGS[tier].priceDisplay[billingPeriod].usd,
      priceAmountMicros: Number(phase?.priceAmountMicros ?? 0),
      priceCurrencyCode: phase?.priceCurrencyCode ?? 'USD',
      tier,
      billingPeriod,
    };
  }

  // iOS StoreKit payload
  const ios = sub as SubscriptionIOS;
  return {
    productId,
    title: ios.title || TIER_CONFIGS[tier].name,
    description: ios.description || TIER_CONFIGS[tier].description,
    price: ios.localizedPrice ?? TIER_CONFIGS[tier].priceDisplay[billingPeriod].usd,
    priceAmountMicros: Math.round(Number(ios.price ?? 0) * 1_000_000),
    priceCurrencyCode: ios.currency ?? 'USD',
    tier,
    billingPeriod,
  };
}

/** Used when the store is unavailable (dev environment, airplane mode). */
function getFallbackProducts(): IAPProduct[] {
  const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
  const tiers: SubscriptionTier[] = ['bhakta', 'sadhak', 'siddha'];
  const periods: BillingPeriod[] = ['monthly', 'yearly'];

  return tiers.flatMap((tier) =>
    periods.map((period) => {
      const tierKey = `${tier.toUpperCase()}_${period.toUpperCase()}` as
        | 'BHAKTA_MONTHLY'
        | 'BHAKTA_YEARLY'
        | 'SADHAK_MONTHLY'
        | 'SADHAK_YEARLY'
        | 'SIDDHA_MONTHLY'
        | 'SIDDHA_YEARLY';
      const config = TIER_CONFIGS[tier];
      return {
        productId: IAP_PRODUCT_IDS[tierKey][platform],
        title: config.name,
        description: config.description,
        price: config.priceDisplay[period].usd,
        priceAmountMicros: Math.round(config.prices[period].usd * 1_000_000),
        priceCurrencyCode: 'USD',
        tier,
        billingPeriod: period,
      };
    }),
  );
}
