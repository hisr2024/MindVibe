import json
import base64
from pathlib import Path
from scripts.generate_jwks import load_public_keys, write_jwks

def test_generate_jwks_tmp(tmp_path):
    """
    Create a temporary keyset_eddsa directory with one public JWK file,
    run the JWKS generator, and assert the output jwks.json contains the key.
    """
    # prepare temporary key dir
    keydir = tmp_path / "keyset_eddsa"
    keydir.mkdir()

    # create a valid base64url-encoded 32-byte 'x' value for Ed25519
    x = base64.urlsafe_b64encode(b'\\x01' * 32).decode("ascii").rstrip("=")

    pub = {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": x,
        "kid": "test-key"
    }

    # write public key file
    f = keydir / "test-key-pub.json"
    f.write_text(json.dumps(pub), encoding="utf-8")

    # load public keys using the module under test
    keys = load_public_keys(str(keydir))
    assert isinstance(keys, list)
    assert len(keys) == 1
    assert keys[0].get("kid") == "test-key"

    # write JWKS file
    outdir = tmp_path / "static" / ".well-known"
    write_jwks(keys, str(outdir / "jwks.json"))

    # verify output
    jwks_path = outdir / "jwks.json"
    assert jwks_path.exists()
    jwks = json.loads(jwks_path.read_text(encoding="utf-8"))
    assert "keys" in jwks
    assert isinstance(jwks["keys"], list)
    assert jwks["keys"][0].get("kid") == "test-key"
    assert jwks["keys"][0].get("kty") == "OKP"
