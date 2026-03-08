# Stripe Subscriptions Setup Guide

Step-by-step guide to create Stripe Products, Prices, and Webhooks for MindVibe's 4-tier subscription model.

---

## Prerequisites

- A Stripe account ([dashboard.stripe.com](https://dashboard.stripe.com))
- Access to the MindVibe `.env` file

> Start in **Test Mode** (toggle at top-right of Stripe Dashboard). Switch to Live mode when ready for real payments.

---

## Step 1: Get API Keys

1. Go to **[Stripe API Keys](https://dashboard.stripe.com/apikeys)**
2. Copy both keys to your `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

---

## Step 2: Create 3 Products

Go to **[Products](https://dashboard.stripe.com/products)** and click **"+ Add product"** for each:

| Product | Description |
|---------|-------------|
| **Bhakta** | Devoted seeker tier -- 50 KIAAN questions/month, encrypted journal, 3 Wisdom Journeys |
| **Sadhak** | Dedicated practitioner tier -- 300 KIAAN questions/month, 10 Wisdom Journeys, advanced analytics, offline access |
| **Siddha** | Enlightened master tier -- Unlimited KIAAN questions, unlimited Wisdom Journeys, priority support, all premium features |

> The FREE tier is handled in-app and does not need a Stripe product.

---

## Step 3: Add Prices (6 total)

Click into each product and add **2 recurring prices** (monthly + yearly):

### Bhakta ($6.99/mo)
| Billing  | Amount  | Currency | Interval |
|----------|---------|----------|----------|
| Monthly  | $6.99   | USD      | Monthly  |
| Yearly   | $47.99  | USD      | Yearly   |

### Sadhak ($12.99/mo)
| Billing  | Amount  | Currency | Interval |
|----------|---------|----------|----------|
| Monthly  | $12.99  | USD      | Monthly  |
| Yearly   | $89.99  | USD      | Yearly   |

### Siddha ($22.99/mo)
| Billing  | Amount  | Currency | Interval |
|----------|---------|----------|----------|
| Monthly  | $22.99  | USD      | Monthly  |
| Yearly   | $169.99 | USD      | Yearly   |

**Price settings:**
- Pricing model: Standard pricing
- Type: Recurring
- Trial period: Leave empty (free tier serves as the trial)

---

## Step 4: Copy Price IDs to `.env`

After creating each price, Stripe assigns a Price ID (starts with `price_`). Copy all 6 to your `.env`:

```bash
# Bhakta tier
STRIPE_BHAKTA_MONTHLY_PRICE_ID=price_...
STRIPE_BHAKTA_YEARLY_PRICE_ID=price_...

# Sadhak tier
STRIPE_SADHAK_MONTHLY_PRICE_ID=price_...
STRIPE_SADHAK_YEARLY_PRICE_ID=price_...

# Siddha tier
STRIPE_SIDDHA_MONTHLY_PRICE_ID=price_...
STRIPE_SIDDHA_YEARLY_PRICE_ID=price_...
```

---

## Step 5: Set Up the Webhook

1. Go to **[Webhooks](https://dashboard.stripe.com/webhooks)** and click **"+ Add endpoint"**
2. **Endpoint URL:** `https://your-domain.com/api/subscriptions/webhook`
   - For local dev: `stripe listen --forward-to localhost:8000/api/subscriptions/webhook`
3. **Select these events:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Signing secret** to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Step 6: Enable Payment Methods

1. Go to **[Payment Methods](https://dashboard.stripe.com/settings/payment_methods)**
2. Enable:
   - **Cards** (Visa, Mastercard, etc.) -- this enables Google Pay automatically
   - **PayPal** (optional)

> Google Pay requires no separate setup. It appears automatically on compatible devices when card payments are enabled via Stripe Checkout.

---

## Step 7: Configure Customer Portal

1. Go to **[Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)**
2. Enable:
   - Allow customers to update payment methods
   - Allow customers to cancel subscriptions
   - Allow customers to switch plans (upgrade/downgrade)
3. Add all 3 products (Bhakta, Sadhak, Siddha) so customers can switch between tiers

---

## Step 8: Seed the Database

Run the seed script to store Price IDs in the database:

```bash
python -m backend.scripts.seed_subscription_plans
```

This creates/updates the `subscription_plans` table with the correct Stripe Price IDs.

---

## Step 9: Test End-to-End

Use Stripe test cards (no real charges):

| Card Number              | Scenario              |
|--------------------------|-----------------------|
| `4242 4242 4242 4242`    | Successful payment    |
| `4000 0000 0000 3220`    | Requires 3D Secure    |
| `4000 0000 0000 0002`    | Card declined         |

**Expiry:** Any future date (e.g., `12/34`). **CVC:** Any 3 digits.

### Test flow:
1. Start the app locally
2. Go to the pricing page and click "Subscribe Now" on any tier
3. Complete checkout with test card `4242 4242 4242 4242`
4. Verify redirect to `/subscription/success`
5. Check Stripe Dashboard > Payments for the test payment
6. Check the database for the new subscription record

---

## Step 10: Go Live

1. Toggle from Test to **Live mode** in Stripe Dashboard
2. Get live API keys from [API Keys](https://dashboard.stripe.com/apikeys)
3. Re-create all 3 products + 6 prices in Live mode (test and live are separate)
4. Create a new webhook endpoint in Live mode with the same events
5. Update production `.env` with live keys:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   STRIPE_BHAKTA_MONTHLY_PRICE_ID=price_live_...
   # ... all 6 live price IDs
   ```
6. Re-run `python -m backend.scripts.seed_subscription_plans` against production DB
7. Test with a real $6.99 Bhakta subscription, then refund from Stripe Dashboard

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Checkout redirects to blank page | Check `FRONTEND_URL` env var matches your actual URL |
| Webhook returns 400 | Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret |
| "No such price" error | Using test Price IDs in live mode (or vice versa) |
| Google Pay not showing | Only appears on Chrome + HTTPS |
| PayPal not showing | Enable PayPal in Dashboard > Settings > Payment methods |
