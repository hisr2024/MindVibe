# Domain Migration Guide: mindvibe.life → kiaanverse.com

## Overview

This guide walks you through migrating your domain from `mindvibe.life` to `kiaanverse.com` (purchased on Namecheap). Follow each step in order.

---

## PHASE 1: Namecheap DNS Setup (Do This First)

### Step 1.1: Log into Namecheap

1. Go to https://www.namecheap.com and sign in
2. Click **Domain List** in the left sidebar
3. Find `kiaanverse.com` and click **Manage**

### Step 1.2: Point DNS to Vercel (Frontend)

Your frontend is hosted on **Vercel**. You need to point the domain there.

1. In Namecheap, go to the **Advanced DNS** tab
2. Delete any existing `A Record` or `CNAME` records for `@` and `www`
3. Add these DNS records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `76.76.21.21` | Automatic |
| CNAME | `www` | `cname.vercel-dns.com.` | Automatic |

> These are Vercel's official DNS values. The `@` means the root domain (kiaanverse.com).

### Step 1.3: Set Up Email Forwarding (for care@kiaanverse.com)

You currently use `care@mindvibe.life`. To set up email on the new domain:

**Option A: Namecheap Email Forwarding (Free)**

1. In Namecheap, go to **Domain List** → **Manage** → **Redirect Email** tab
2. Click **Add Catch All** or **Add Forwarder**
3. Set `care@kiaanverse.com` → forward to `hisr2024@gmail.com` (or your actual email)

**Option B: Custom Email (Paid)**

If you want a full mailbox (send + receive as care@kiaanverse.com):
- Namecheap Private Email (~$1.50/mo)
- Google Workspace (~$6/mo)
- Zoho Mail (free for 1 user)

### Step 1.4: Wait for DNS Propagation

- DNS changes take **5 minutes to 48 hours** to propagate globally
- Check propagation at: https://www.whatsmydns.net/#A/kiaanverse.com
- While waiting, proceed with the other steps below

---

## PHASE 2: Vercel Configuration (Frontend Hosting)

### Step 2.1: Add Domain in Vercel

1. Go to https://vercel.com/dashboard
2. Select your MindVibe project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Type `kiaanverse.com` and click **Add**
6. Also add `www.kiaanverse.com` and set it to redirect to `kiaanverse.com`

Vercel will:
- Automatically provision an SSL certificate (free)
- Show a checkmark when DNS is verified

### Step 2.2: Update Environment Variables in Vercel

1. Go to **Settings** → **Environment Variables**
2. Update or add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://kiaanverse.com` |
| `NEXT_PUBLIC_API_URL` | `https://mindvibe-api.onrender.com` (keep this for now) |

### Step 2.3: Keep the Old Domain (Temporarily)

**DO NOT remove `mindvibe.life` from Vercel yet!** Keep it for 30-90 days so:
- Old bookmarks still work
- Google re-indexes the new domain
- No traffic is lost

You can set up a redirect later (see Phase 6).

---

## PHASE 3: Render Configuration (Backend API)

Your backend is on Render at `mindvibe-api.onrender.com`. The API URL doesn't change, but you need to update CORS.

### Step 3.1: Update CORS Allowed Origins on Render

1. Go to https://dashboard.render.com
2. Select your `mindvibe-api` service
3. Go to **Environment** → **Environment Variables**
4. Find `CORS_ALLOWED_ORIGINS` and update it to:

```
https://kiaanverse.com,https://www.kiaanverse.com,https://mind-vibe-universal.vercel.app,https://www.mindvibe.life,https://mindvibe.life,http://localhost:3000,http://localhost:3001
```

> Keep the old domain in CORS during the transition period.

### Step 3.2: Update Frontend URL on Render

Find `FRONTEND_URL` and update it to:

```
https://kiaanverse.com
```

---

## PHASE 4: Update Codebase References

The codebase has been updated in this commit. Here's what was changed:

### Files Updated (all `mindvibe.life` → `kiaanverse.com`):

**Frontend (Next.js):**
- `app/layout.tsx` — metadataBase, canonical URLs, Open Graph, alternate languages, JSON-LD structured data
- `app/sitemap.ts` — sitemap base URL
- `app/robots.ts` — sitemap URL
- `next.config.js` — CSP img-src policy
- `utils/socialShare.ts` — share text and Facebook share URL
- `components/seo/BreadcrumbSchema.tsx` — breadcrumb base URL
- `app/components/SiteFooter.tsx` — contact email
- `app/terms/page.tsx` — canonical URL and contact emails
- `app/contact/page.tsx` — form mailto action
- `app/*/layout.tsx` — canonical URLs for all section pages (wisdom-rooms, kiaan-vibe, tools, pricing, sacred-reflections, journeys, introduction, companion, community, deep-insights, dashboard)
- `app/profile/page.tsx` — placeholder emails
- `app/onboarding/page.tsx` — placeholder emails
- `app/onboarding/[step]/page.tsx` — placeholder emails
- `app/admin/page.tsx` — admin email placeholders
- `app/admin/login/page.tsx` — email placeholder
- `app/admin/export/page.tsx` — export log emails
- `app/admin/audit-logs/page.tsx` — audit log emails
- `app/account/AccountPageClient.tsx` — email placeholder

**Backend (FastAPI):**
- `backend/main.py` — CORS allowed origins default
- `backend/services/email_service.py` — default from address and from name

**Static Files:**
- `public/robots.txt` — sitemap URL
- `public/.well-known/security.txt` — canonical and policy URLs

**CI/CD:**
- `.github/workflows/monitor-production.yml` — monitoring endpoint URLs

**Tests:**
- `tests/frontend/utils/socialShare.test.ts` — updated assertion

**Mobile (Android):**
- `mobile/android/app/build.gradle.kts` — release API base URL

### What Was NOT Changed (update manually in hosting dashboards):
- Vercel project settings & environment variables
- Render environment variables
- Stripe webhook URLs
- Razorpay webhook URLs
- GitHub Secrets
- Google Search Console verification

---

## PHASE 5: Payment Provider Updates

### Step 5.1: Stripe

1. Go to https://dashboard.stripe.com
2. **Developers** → **Webhooks**
3. Update your webhook endpoint URL if it references the old domain
4. No changes needed if your webhook points to `mindvibe-api.onrender.com` (it stays the same)

### Step 5.2: Razorpay

1. Go to https://dashboard.razorpay.com
2. **Settings** → **Webhooks**
3. Same as Stripe — update only if webhook URL uses the old domain

---

## PHASE 6: SEO & Google Search Console

### Step 6.1: Add New Domain to Google Search Console

1. Go to https://search.google.com/search-console
2. Click **Add Property**
3. Choose **Domain** and enter `kiaanverse.com`
4. Verify ownership via DNS:
   - Add the TXT record Google gives you in Namecheap **Advanced DNS**
   - Example: `google-site-verification=xxxxxxxxxxxx`

### Step 6.2: Submit New Sitemap

1. In Search Console for `kiaanverse.com`
2. Go to **Sitemaps**
3. Submit: `https://kiaanverse.com/sitemap.xml`

### Step 6.3: Set Up 301 Redirects from Old Domain

After 30-90 days when the new domain is established:

**In Vercel** (for the old domain):
1. Go to your project settings
2. Under **Domains**, click on `mindvibe.life`
3. Set it to **redirect** to `kiaanverse.com` (301 permanent redirect)

This tells Google: "We moved permanently, update your index."

### Step 6.4: Google Search Console Change of Address

1. In Google Search Console for `mindvibe.life`
2. Go to **Settings** → **Change of Address**
3. Select `kiaanverse.com` as the new site
4. Follow the prompts

---

## PHASE 7: Third-Party Service Updates

Update your domain in these services:

| Service | Where to Update | Priority |
|---------|----------------|----------|
| Google Search Console | Add new property + change of address | High |
| Google Analytics | Property settings → Website URL | High |
| Sentry | Project settings → Allowed Domains | Medium |
| Social Media | Bio links (Twitter, Instagram, etc.) | Medium |
| OpenAI | API key allowed domains (if restricted) | Medium |
| Any OAuth providers | Callback URLs | High (if using social login) |

---

## PHASE 8: Verification Checklist

After everything is set up, verify:

```
DNS & SSL
  [ ] kiaanverse.com resolves to Vercel IP (76.76.21.21)
  [ ] www.kiaanverse.com redirects to kiaanverse.com
  [ ] SSL certificate is valid (green padlock)
  [ ] https://kiaanverse.com loads correctly

Frontend
  [ ] All pages load without errors
  [ ] Open Graph meta tags show kiaanverse.com
  [ ] Sitemap at /sitemap.xml shows kiaanverse.com URLs
  [ ] Robots.txt at /robots.txt shows kiaanverse.com sitemap
  [ ] Social sharing shows kiaanverse.com links
  [ ] Contact form sends to care@kiaanverse.com

Backend
  [ ] API calls from kiaanverse.com are not blocked by CORS
  [ ] Login/signup works from the new domain
  [ ] Payment flows work (Stripe/Razorpay)

Email
  [ ] care@kiaanverse.com receives email
  [ ] Password reset emails reference the new domain

Old Domain (keep working during transition)
  [ ] mindvibe.life still loads (for 30-90 days)
  [ ] Old bookmarks and links still work

SEO
  [ ] Google Search Console shows kiaanverse.com
  [ ] Sitemap submitted to Google
  [ ] 301 redirects set up from old domain (after transition)
```

---

## Timeline

| When | What |
|------|------|
| Day 1 | Set up DNS on Namecheap, add domain to Vercel, update CORS on Render |
| Day 1 | Deploy code changes (this commit) |
| Day 1-2 | Wait for DNS propagation, verify SSL |
| Day 2 | Test everything (login, payments, API, email) |
| Day 2 | Set up Google Search Console for new domain |
| Day 7 | Verify Google is indexing kiaanverse.com |
| Day 30 | Set up 301 redirects from mindvibe.life → kiaanverse.com |
| Day 90 | Consider removing mindvibe.life from Vercel (optional — keep if cheap) |

---

## Emergency Rollback

If something goes wrong:

1. **Frontend broken?** → Remove kiaanverse.com from Vercel, old domain still works
2. **API CORS errors?** → Add both domains to CORS_ALLOWED_ORIGINS on Render
3. **Email not working?** → Use hisr2024@gmail.com as fallback contact
4. **DNS not propagating?** → Wait 48 hours, check at whatsmydns.net

The old domain continues working throughout the entire migration. Nothing breaks until you explicitly remove it.
