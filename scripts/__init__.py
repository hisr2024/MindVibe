"""
MindVibe Scripts Package

This package contains utility scripts for the MindVibe project:
- generate_eddsa_key.py: Generate Ed25519 keypairs for JWT signing
- seed_wisdom.py: Seed the database with wisdom verses
- seed_content.py: Seed the database with content packs
- verify_wisdom.py: Verify wisdom guide implementation

All scripts can be run directly from the command line:
    python -m scripts.seed_wisdom
    python -m scripts.seed_content
    python -m scripts.verify_wisdom
    python -m scripts.generate_eddsa_key
"""

__version__ = "0.1.0"
