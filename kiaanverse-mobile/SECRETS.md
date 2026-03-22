# Kiaanverse Mobile — Required GitHub Actions Secrets

All secrets must be configured in **GitHub > Repository Settings > Secrets and Variables > Actions**.

## Required for All EAS Builds

| Secret | Description | How to Generate |
|--------|-------------|-----------------|
| `EXPO_TOKEN` | Expo access token for EAS CLI authentication | Go to [expo.dev](https://expo.dev) > Account Settings > Access Tokens > Create Token |
| `EAS_PROJECT_ID` | EAS project identifier (also set in `app.config.ts`) | Go to [expo.dev](https://expo.dev) > Project Settings > Project ID |

## Required for Production Builds & Submissions

### Android (Google Play Store)

| Secret | Description | How to Generate |
|--------|-------------|-----------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded Android keystore (`.jks`) file | Generate keystore: `keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -storepass <password> -keypass <password> -alias <alias> -keystore release.jks -dname "CN=Kiaanverse"`. Then encode: `base64 -i release.jks` |
| `ANDROID_KEY_ALIAS` | Key alias within the keystore | The `-alias` value used when generating the keystore |
| `ANDROID_KEY_PASSWORD` | Password for the signing key | The `-keypass` value used when generating the keystore |
| `ANDROID_STORE_PASSWORD` | Password for the keystore file | The `-storepass` value used when generating the keystore |

### iOS (Apple App Store)

| Secret | Description | How to Generate |
|--------|-------------|-----------------|
| `APP_STORE_CONNECT_API_KEY` | App Store Connect API key in JSON format | Go to [App Store Connect](https://appstoreconnect.apple.com) > Users and Access > Integrations > App Store Connect API > Generate API Key. Store as JSON: `{"keyId": "...", "issuerId": "...", "key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}` |

## Optional

| Secret | Description | How to Generate |
|--------|-------------|-----------------|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL for build notifications to `#mobile-builds` | Go to [Slack API](https://api.slack.com/messaging/webhooks) > Create App > Incoming Webhooks > Add New Webhook to Workspace |

## Environment Variables in `app.config.ts`

These are injected at build time via EAS and are **not** GitHub secrets:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API base URL | `http://localhost:8000` |
| `SENTRY_DSN` | Sentry error tracking DSN | `''` (disabled) |
| `EAS_PROJECT_ID` | EAS project ID | `''` |

Configure these in your EAS build profiles via `eas.json` > `build` > `<profile>` > `env` or in the EAS dashboard under project environment variables.
