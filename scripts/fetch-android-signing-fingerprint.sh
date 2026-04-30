#!/usr/bin/env bash
#
# fetch-android-signing-fingerprint.sh
# ------------------------------------
# Pulls the SHA-256 fingerprint of the Play Store app-signing key for
# `com.kiaanverse.app` from EAS, and patches it into
# public/.well-known/assetlinks.json so deep-link verification on
# Android 12+ works.
#
# WHY THIS SCRIPT EXISTS
# ----------------------
# Once an Android app is uploaded to Play Console, Google Play takes
# over signing. The fingerprint that proves "this app published the
# kiaanverse.com claim" is therefore NOT the one EAS generated locally
# — it's the one in:
#
#   Play Console → Setup → App integrity → App signing key certificate
#
# We can also pull it from EAS via the Expo CLI, which is what this
# script does so the value can be checked into source control without
# anyone needing access to Play Console.
#
# USAGE
# -----
#   ./scripts/fetch-android-signing-fingerprint.sh
#
# REQUIREMENTS
#   • eas-cli installed (npm i -g eas-cli)
#   • You are logged in: eas login
#   • Run from the repo root.
#
# RESULT
#   public/.well-known/assetlinks.json gets the SHA-256 written into the
#   sha256_cert_fingerprints array. Commit + deploy the file to
#   https://kiaanverse.com/.well-known/assetlinks.json. Then flip
#   `autoVerify: false` -> `true` in apps/mobile/app.config.ts.
#
set -euo pipefail

ASSETLINKS=public/.well-known/assetlinks.json
PROJECT_DIR=kiaanverse-mobile/apps/mobile

if [[ ! -f "$ASSETLINKS" ]]; then
  echo "error: $ASSETLINKS does not exist; run from repo root" >&2
  exit 1
fi

if ! command -v eas >/dev/null 2>&1; then
  echo "error: eas-cli not installed. Run 'npm i -g eas-cli' first." >&2
  exit 1
fi

echo "→ Pulling Android credentials from EAS for com.kiaanverse.app …"
# `eas credentials` is interactive; the JSON dump is the easiest way to
# get the fingerprint scriptably.
RAW=$(cd "$PROJECT_DIR" && eas credentials --platform android --profile production --non-interactive --json 2>/dev/null || true)

if [[ -z "$RAW" ]]; then
  echo "warn: eas credentials --json returned empty; falling back to keytool against the local upload key" >&2
  KEYSTORE="$PROJECT_DIR/android/keystores/release.keystore"
  if [[ -f "$KEYSTORE" ]]; then
    echo "Pass the keystore password when prompted:"
    SHA=$(keytool -list -v -keystore "$KEYSTORE" 2>/dev/null \
      | awk '/SHA256:/ {print $2; exit}')
  else
    echo "error: cannot find $KEYSTORE either. Read the SHA-256 from"
    echo "       Play Console → App integrity → App signing key, then"
    echo "       paste it manually into $ASSETLINKS."
    exit 1
  fi
else
  SHA=$(echo "$RAW" | python3 -c "
import json, sys
data = json.load(sys.stdin)
# The shape of this JSON is documented at:
# https://docs.expo.dev/eas/json/credentials
# but we walk it defensively.
def walk(node):
    if isinstance(node, dict):
        for k, v in node.items():
            if k.lower() in ('sha256certificatefingerprint', 'sha256_cert_fingerprint'):
                yield v
            yield from walk(v)
    elif isinstance(node, list):
        for v in node:
            yield from walk(v)
for f in walk(data):
    print(f)
    break
" || true)
fi

if [[ -z "${SHA:-}" ]]; then
  echo "error: could not extract a SHA-256 fingerprint." >&2
  exit 1
fi

# Normalise to colon-separated uppercase hex (the format Android expects).
SHA_NORMALISED=$(echo "$SHA" | tr 'a-f' 'A-F' | tr -d '\r\n ')

echo "→ Patching $ASSETLINKS with SHA-256 = $SHA_NORMALISED"
python3 - "$ASSETLINKS" "$SHA_NORMALISED" <<'PY'
import json
import sys

path = sys.argv[1]
sha = sys.argv[2]

with open(path) as f:
    data = json.load(f)

for entry in data:
    fps = entry.get("target", {}).get("sha256_cert_fingerprints", [])
    if sha not in fps:
        fps.append(sha)
    entry["target"]["sha256_cert_fingerprints"] = fps

with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY

echo "✔ Done. Deploy public/.well-known/assetlinks.json to"
echo "  https://kiaanverse.com/.well-known/assetlinks.json"
echo "  then flip autoVerify back to true in app.config.ts."
