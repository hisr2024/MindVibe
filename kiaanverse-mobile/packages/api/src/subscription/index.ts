/**
 * Subscription module — IAP service, constants, and types for Kiaanverse.
 */

export {
  type VibePlayerTier,
  type TierConfig,
  TIER_CONFIGS,
  TIER_RANK,
  IAP_PRODUCT_IDS,
  ALL_PRODUCT_IDS,
  BACKEND_TIER_MAP,
  VIBE_TO_BACKEND_TIER,
  DAILY_SAKHA_QUOTA,
} from './constants';

export {
  initializeIAP,
  disconnectIAP,
  getProducts,
  purchaseSubscription,
  restorePurchases,
  verifyReceipt,
  IAPError,
  type IAPProduct,
  type PurchaseResult,
  type ReceiptVerificationPayload,
  type ReceiptVerificationResponse,
} from './iapService';
