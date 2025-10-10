from fastapi import APIRouter, Depends
from typing import List, Dict, Any
import os
import json
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/.well-known/jwks.json")
async def get_jwk():
    """Returns JWK Set containing public EdDSA keys"""
    jwks = {"keys": []}
    keyset_dir = os.getenv("EDDSA_KEYSET_DIR", "./keyset_eddsa")
    
    if os.path.exists(keyset_dir):
        for filename in os.listdir(keyset_dir):
            if filename.endswith("-pub.json"):
                with open(os.path.join(keyset_dir, filename), "r") as f:
                    key_data = json.load(f)
                    if key_data.get("kty") == "OKP" and key_data.get("crv") == "Ed25519":
                        jwks["keys"].append(key_data)
    
    return JSONResponse(content=jwks)
