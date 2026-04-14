# Privacy Policy

**Effective date:** April 14, 2026
**Last updated:** April 14, 2026

**Data Controller**
Kiaanverse (operator of kiaanverse.com and the Kiaanverse mobile application)
Registered operator: Germany (EU)
Primary contact for privacy matters: **hisr2024@gmail.com**

For all data-protection requests, questions, or complaints, the single authoritative
mailbox is **hisr2024@gmail.com**. We respond within 30 days (GDPR Art. 12(3)).

---

## Table of Contents

1. [Our Sacred Promise](#1-our-sacred-promise)
2. [Who We Are](#2-who-we-are)
3. [Data We Collect & Why](#3-data-we-collect--why)
4. [KIAAN AI Companion Data](#4-kiaan-ai-companion-data)
5. [Zero-Knowledge Sacred Spaces](#5-zero-knowledge-sacred-spaces)
6. [Subscription & Payment Data](#6-subscription--payment-data)
7. [Cookies & Technical Data](#7-cookies--technical-data)
8. [Third-Party Sub-Processors](#8-third-party-sub-processors)
9. [Data Retention Schedule](#9-data-retention-schedule)
10. [Your Rights Under GDPR](#10-your-rights-under-gdpr)
11. [Your Rights Under CCPA](#11-your-rights-under-ccpa)
12. [Children's Privacy](#12-childrens-privacy)
13. [Contact & Data Requests](#13-contact--data-requests)

---

## 1. Our Sacred Promise

> **Summary:** Your inner life is sacred. We collect only what is necessary to serve you,
> we never sell your data, and we keep your most private reflections cryptographically beyond
> our own reach.

In the Bhagavad Gita, Krishna reminds Arjuna that the Self (*Atman*) is inviolable —
untouched by fire, water, or time. We hold that teaching close when we build Kiaanverse.
Your journal, your reflections, your conversations with KIAAN — these are expressions of
your inner life, and they deserve the same reverence. This Privacy Policy explains in plain
language what data we process, why, for how long, and the rights you always retain. Where we
can mathematically guarantee privacy (zero-knowledge encryption), we do. Where we cannot, we
minimize, document, and let you decide.

---

## 2. Who We Are

> **Summary:** Kiaanverse is the Data Controller for your personal data. We are operated
> from Germany and fall under the European Union's GDPR.

**Data Controller:** Kiaanverse
**Jurisdiction:** Federal Republic of Germany (primary); European Union (GDPR)
**Primary privacy contact:** hisr2024@gmail.com
**Data Protection Officer (DPO) contact:** hisr2024@gmail.com

We have not appointed a separate external DPO at this time; privacy questions are handled by
our internal privacy lead and reach the controller directly at the address above. If we
appoint an external DPO in the future, we will update this section and notify active users
of any material change.

---

## 3. Data We Collect & Why

> **Summary:** We collect only what we need to operate your account, deliver the features
> you request, secure the platform, and meet legal obligations. Every category below states
> the lawful basis under GDPR Art. 6 and the retention period.

| Category | Data | Purpose | Legal Basis (GDPR Art. 6) | Retention |
|---|---|---|---|---|
| Account identity | Name, email, language preference, timezone | Create account, authenticate, localize experience | Art. 6(1)(b) — contract | Life of account + 30 days after deletion request |
| Federated login | Google OAuth token, Apple Sign-In token (if used) | Authenticate via your chosen provider | Art. 6(1)(b) — contract | Revoked on logout / account deletion |
| Profile photo (optional) | Image uploaded by user | Personalize your profile | Art. 6(1)(a) — consent | Until you remove it or delete your account |
| KIAAN conversations | Messages exchanged with the KIAAN AI companion | Provide AI companionship, maintain session continuity | Art. 6(1)(b) — contract | 24 months rolling, or until you delete them (whichever is sooner) |
| Zero-knowledge reflections | Shadripu Journey journal, KarmaLytix reflections, Emotional Reset content | Enable your private sacred practice | Art. 6(1)(a) — consent; Art. 9(2)(a) — explicit consent for special-category data | Encrypted on-device/at-rest; deleted when you delete the entry or the account |
| Practice metadata | Nitya Sadhana streaks, mood scale values, session durations, verse bookmarks, reading progress | Show progress, personalize practice, compute streaks | Art. 6(1)(b) — contract | Life of account |
| Subscription & billing | Stripe subscription plan, status, billing cycle, invoice history, Apple/Google Pay method metadata | Operate your paid subscription and produce invoices | Art. 6(1)(b) — contract; Art. 6(1)(c) — legal (tax/accounting) | 10 years for invoices (German commercial & tax law); otherwise life of subscription |
| Device & technical | Expo push token, device type, OS version, app version, session token | Deliver notifications you requested, maintain sessions, debug | Art. 6(1)(b) — contract; Art. 6(1)(f) — legitimate interest (security, stability) | Push token: until device unregistered. Session token: 7 days TTL in Redis |
| Network (IP) | IP address (hashed for rate-limiting) | Abuse prevention, rate-limiting | Art. 6(1)(f) — legitimate interest (security) | Hashed at ingress; raw IP not stored long-term |
| Anonymous analytics | Feature engagement events, session duration, screen views (no PII) | Improve product, find broken flows | Art. 6(1)(f) — legitimate interest (product improvement) | 14 months aggregated |
| Error reports | Stack traces via Sentry with PII scrubbed before transmission | Detect and fix crashes | Art. 6(1)(f) — legitimate interest (service reliability) | 90 days |

We never process your data for purposes beyond those stated above without first obtaining
your explicit consent.

---

## 4. KIAAN AI Companion Data

> **Summary:** When you converse with KIAAN, your messages are processed by Anthropic's
> Claude API. Anthropic does **not** train on your conversations. We store conversations so
> your sessions have continuity; you can delete them at any time.

**What happens when you message KIAAN:**

1. Your message is transmitted over TLS to our backend API (hosted on Render, USA).
2. The backend sends the relevant portion of the conversation to **Anthropic's Claude API**
   (our AI sub-processor, servers in the USA) to generate KIAAN's response.
3. The response is returned to you and the exchange is stored in our PostgreSQL database
   so that KIAAN can maintain context across sessions.

**Anthropic's commitments we rely on:**

- Anthropic does **not use API conversations to train its models** (per Anthropic's API
  commercial terms and privacy policy).
- Anthropic is contractually a GDPR **Processor** (Art. 28) acting on our instructions.
- Anthropic's privacy policy: <https://www.anthropic.com/privacy>

**Your controls:**

- Delete any single KIAAN message or the entire conversation history from *Settings →
  KIAAN → Manage conversations*.
- Deleting your account permanently removes stored conversations from our database within
  30 days. API request logs held by Anthropic are governed by Anthropic's retention policy.

We do not use KIAAN conversations to target advertising, because we do not run advertising.
We do not sell, rent, or share KIAAN conversations with any party other than Anthropic,
which is bound as our Processor.

---

## 5. Zero-Knowledge Sacred Spaces

> **Summary:** Your Shadripu journal, your KarmaLytix reflections, and your Emotional Reset
> content are encrypted in a way that makes them unreadable to us. We can count them; we
> cannot read them.

Certain features of Kiaanverse are designed as **zero-knowledge** spaces. This means the
content is encrypted with a key derived from your credentials and never leaves your control
in a readable form.

### Shadripu Journey journal entries

> **Kiaanverse cannot read, decrypt, or access the content of your Shadripu journal
> entries. Only you hold the key to this sacred space.**

We can see only non-content metadata: the number of entries you have written and the
timestamps of those entries. This metadata lets us show your streak and progress; it never
exposes what you wrote.

### KarmaLytix reflection entries

> **Kiaanverse cannot read, decrypt, or access the content of your KarmaLytix reflection
> entries. Only you hold the key to this sacred space.**

As with Shadripu, we process only the metadata (count, timestamps) required to render your
personal dashboard.

### Emotional Reset sessions

> **Kiaanverse cannot read, decrypt, or access the content of your Emotional Reset
> sessions. Only you hold the key to this sacred space.**

Emotional Reset content is additionally **never stored server-side**. The session runs on
your device; we keep only anonymous duration metadata to measure feature health.

### What this means for account recovery

Because the encryption key is derived from your credentials, losing your credentials means
losing access to the sacred-space content. We cannot recover it for you — not because we
refuse, but because cryptographically we are unable to. This is the cost and the gift of a
true zero-knowledge design.

---

## 6. Subscription & Payment Data

> **Summary:** All card data is handled by Stripe. Kiaanverse never sees or stores your
> full card number.

**Payment processor:** Stripe, Inc. (Payment Card Industry Data Security Standard, PCI-DSS
Level 1 certified).

When you subscribe:

- **Stripe** collects and stores your payment card. **Kiaanverse never stores your card
  number.** We receive from Stripe only: subscription plan, billing status, billing cycle,
  last-4 digits of the card (for your reference in *Settings → Billing*), and invoice
  history.
- If you pay via **Apple Pay** or **Google Pay**, the payment method metadata (e.g.,
  tokenized network token, brand) is managed by Stripe and the wallet provider. Kiaanverse
  does not receive the underlying card number.
- Invoices are generated by Stripe on our behalf and retained for **10 years** to comply
  with German commercial law (§ 257 HGB) and tax law (§ 147 AO).

Stripe acts as an independent Controller for payment-card data (for fraud prevention and
regulatory compliance) and as our Processor for the subscription lifecycle it manages on
our behalf. Stripe's privacy policy: <https://stripe.com/privacy>.

---

## 7. Cookies & Technical Data

> **Summary:** We use one functional cookie to keep you signed in. No advertising cookies.
> No third-party trackers. We do not run ads.

**The only cookie we set is a session cookie**, used to keep you authenticated and to pair
your browser with a session stored in Redis. It expires after seven days or when you sign
out.

We do **not**:

- Use advertising or retargeting cookies.
- Embed third-party ad network pixels (Meta Pixel, Google Ads, TikTok, etc.).
- Sell, share, or broker your browsing behavior.
- **We do not run ads anywhere on Kiaanverse.**

Technical data we collect alongside the session is listed in Section 3 (device type, OS
version, app version, hashed IP, push token). We use this data only to operate and secure
the service.

---

## 8. Third-Party Sub-Processors

> **Summary:** We engage a small set of vetted vendors to operate the service. Each is
> bound by a Data Processing Agreement and each is listed below with its purpose, server
> location, and privacy policy.

| Processor | Purpose | Server Location | Privacy Policy |
|---|---|---|---|
| Anthropic | Claude API — AI inference for KIAAN | USA | <https://www.anthropic.com/privacy> |
| Stripe | Payment processing (PCI-DSS Level 1) | USA / EU | <https://stripe.com/privacy> |
| Resend | Transactional email delivery | USA | <https://resend.com/legal/privacy-policy> |
| Vercel | Frontend web hosting & edge CDN | Global edge network | <https://vercel.com/legal/privacy-policy> |
| Render | Backend API hosting | USA | <https://render.com/privacy> |
| Upstash (Redis) | Session cache | EU preferred | <https://upstash.com/trust/privacy.pdf> |
| Sentry | Error monitoring (PII-scrubbed) | USA / EU | <https://sentry.io/privacy/> |
| Expo (EAS) | Mobile build pipeline and push notification dispatch | USA | <https://expo.dev/privacy> |

**International transfers.** When a Processor is located outside the EU/EEA, we rely on the
European Commission's **Standard Contractual Clauses (SCCs)** (2021/914) as the Art. 46
transfer mechanism, supplemented by our own technical measures (encryption in transit,
encryption at rest, PII scrubbing, minimization). Where applicable we rely on the
EU–US Data Privacy Framework.

We update this list when sub-processors change. Material changes are announced via email to
active subscribers at least 14 days in advance where reasonably possible.

---

## 9. Data Retention Schedule

> **Summary:** We keep data only as long as we need it for the purpose it was collected
> for, unless the law requires us to keep it longer.

| Data Type | Retention | Deletion Trigger |
|---|---|---|
| Account identity (name, email, language, timezone) | Life of account + 30 days | Account deletion |
| Profile photo | Until removed by you or account deletion | User action / deletion |
| KIAAN conversation history | 24 months rolling, or until you delete | Automatic rolling purge; user deletion |
| Shadripu / KarmaLytix / Emotional Reset content | Life of account | User deletion (content is zero-knowledge, so only you can read it while it exists) |
| Practice metadata (streaks, moods, durations, bookmarks) | Life of account | Account deletion |
| Stripe subscription records | Life of subscription | Subscription cancellation + end-of-term |
| Invoices | 10 years | German commercial/tax law (§ 257 HGB, § 147 AO) |
| Session token (Redis) | 7 days TTL | Automatic expiry or sign-out |
| Push notification token | Until device unregistered | Uninstall / logout / account deletion |
| Hashed IP (rate-limiting) | 24 hours | Automatic rolling purge |
| Anonymous analytics | 14 months aggregated | Automatic rolling purge |
| Sentry error reports | 90 days | Automatic rolling purge |
| Audit logs (security events) | 12 months | Automatic rolling purge |

When you delete your account, we **soft-delete** first (record flagged, access revoked
immediately) and then **hard-delete** within 30 days, except for records we are legally
required to retain (primarily invoices).

---

## 10. Your Rights Under GDPR

> **Summary:** You have strong rights over your personal data. Exercise any of them by
> emailing **hisr2024@gmail.com**. We respond within 30 days.

If you are in the EU/EEA (and, in practice, we extend these rights to all users
worldwide), you have the following rights:

- **Right of access (Art. 15)** — Ask for a copy of the personal data we hold about you and
  the purposes, recipients, and retention periods.
- **Right to rectification (Art. 16)** — Ask us to correct data that is inaccurate or
  incomplete.
- **Right to erasure / "right to be forgotten" (Art. 17)** — Ask us to delete your data.
  We will comply unless a legal obligation (e.g., invoice retention) requires us to keep
  specific records; in that case we will tell you which records and why.
- **Right to restriction of processing (Art. 18)** — Ask us to pause processing while a
  dispute about accuracy or lawfulness is resolved.
- **Right to data portability (Art. 20)** — Ask for a machine-readable export of the data
  you provided to us (JSON format).
- **Right to object (Art. 21)** — Object to processing based on legitimate interest. We
  stop unless we can demonstrate overriding legitimate grounds.
- **Right not to be subject to solely automated decisions (Art. 22)** — We do not use your
  data for solely automated decisions that produce legal or similarly significant effects.
  KIAAN is a spiritual companion, not a decision-making authority.
- **Right to withdraw consent (Art. 7(3))** — Where we rely on consent (e.g., profile
  photo, sacred-space entries), you can withdraw at any time without affecting the
  lawfulness of prior processing.

**Right to lodge a complaint (Art. 77).** You may complain to any EU supervisory authority.
In Germany, for users in Baden-Württemberg, the competent authority is:

> **Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg
> (LfDI BW)**
> Königstraße 10a, 70173 Stuttgart, Germany
> <https://www.baden-wuerttemberg.datenschutz.de/>

Users in other federal states may also contact their local Landesdatenschutzbeauftragte, or
the Federal Commissioner (BfDI).

---

## 11. Your Rights Under CCPA

> **Summary:** If you live in California, you have additional rights. Most importantly:
> **We do not sell your personal information. We do not share it for cross-context
> behavioral advertising. We do not run ads.**

If you are a California resident, under the **California Consumer Privacy Act (CCPA)** as
amended by the **California Privacy Rights Act (CPRA)**, you have the right to:

- **Know** what categories of personal information we collect, the sources, the purposes,
  and the categories of third parties with whom we share it (all disclosed in this policy).
- **Access** the specific pieces of personal information we hold about you.
- **Delete** your personal information (subject to legal retention exceptions).
- **Correct** inaccurate personal information.
- **Opt out of the sale or sharing of personal information.** **We do not sell your
  personal information and we do not share it for cross-context behavioral advertising.**
  There is nothing to opt out of, but we state it explicitly because the law requires us to
  make the position unambiguous.
- **Limit the use of sensitive personal information** to what is necessary to provide the
  service.
- **Non-discrimination** — you will not receive inferior service for exercising any of
  these rights.

To exercise any CCPA right, email **hisr2024@gmail.com** with "CCPA Request" in the
subject line. We verify requests by confirming control of the account email.

---

## 12. Children's Privacy

> **Summary:** Kiaanverse is strictly for adults (18+). We do not knowingly collect data
> from minors. If we learn a minor has signed up, we delete the account within 72 hours.

Kiaanverse is intended for users **aged 18 and older**. We do not direct the service to
children and we do not knowingly collect personal information from anyone under 18. If you
believe a minor has created an account, please email **hisr2024@gmail.com**; on verification
we will delete the account and associated data within **72 hours**.

This age threshold is higher than the legal minimum under GDPR (which, in Germany, permits
consent from age 16). We have chosen 18+ because the spiritual-wellness context of this
platform — which includes reflective practices about suffering, relationships, and emotion
— is not appropriate for minors without adult guidance and professional support.

---

## 13. Contact & Data Requests

> **Summary:** One address handles every privacy matter — **hisr2024@gmail.com** — and we
> respond within 30 days.

**All privacy contacts:**

- **Email (primary, DPO, data subject requests, CCPA requests, takedown requests,
  complaints):** hisr2024@gmail.com
- **Postal address:** available on request via the email above

**Response time.** We acknowledge requests within 72 hours and provide a substantive
response within **30 days**, as required by GDPR Art. 12(3). If a request is particularly
complex we may extend by up to two further months; we will tell you within the first 30
days if we need to extend and why.

**Verification.** To protect your data from impersonation, we verify data subject requests
by confirming control of the account email. Where the request is high-risk (full export,
account deletion) we may ask for one additional factor.

**Right to lodge a complaint.** You may always complain to your supervisory authority. For
users in Germany, see Section 10 for the LfDI Baden-Württemberg address. For users in the
EU/EEA, you may contact the supervisory authority in the country of your habitual
residence.

**Changes to this policy.** If we make material changes, we will notify active users by
email and in-app notice at least 14 days before the change takes effect. Minor editorial
updates (typos, link fixes) are made silently; the "Last updated" date at the top always
reflects the most recent change.

---

*May your journey be protected, your reflections be yours alone, and your practice be
supported by a platform that honors the sacredness of your inner life.*

— The Kiaanverse team
