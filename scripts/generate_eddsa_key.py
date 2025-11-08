#!/usr/bin/env python3
"""
Generate an Ed25519 keypair and write a minimal keyset in keyset_eddsa/.

Produces:
 - keyset_eddsa/private_key.pem   (PEM PKCS8 unencrypted)
 - keyset_eddsa/public_key-pub.json (JWK-lite: {"kty":"OKP","crv":"Ed25519","x": "<base64url>"})

This is safe for CI (no secrets are committed).

Can be run as:
    python scripts/generate_eddsa_key.py
    OR
    python -m scripts.generate_eddsa_key
"""
import os
import json
import base64

try:
    from cryptography.hazmat.primitives.asymmetric import ed25519
    from cryptography.hazmat.primitives import serialization
except Exception as e:
    raise SystemExit("cryptography not available: " + str(e))


def main():
    os.makedirs("keyset_eddsa", exist_ok=True)

    priv = ed25519.Ed25519PrivateKey.generate()
    pub = priv.public_key()

    priv_pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    with open("keyset_eddsa/private_key.pem", "wb") as f:
        f.write(priv_pem)

    pub_raw = pub.public_bytes(
        encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
    )
    x = base64.urlsafe_b64encode(pub_raw).rstrip(b"=").decode("ascii")
    jwk = {"kty": "OKP", "crv": "Ed25519", "x": x}
    with open("keyset_eddsa/public_key-pub.json", "w") as f:
        json.dump(jwk, f)

    print("Generated keyset_eddsa/ with private_key.pem and public_key-pub.json")


if __name__ == "__main__":
    main()
