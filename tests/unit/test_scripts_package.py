"""
Unit tests for scripts package.

Tests that the scripts package is properly structured and can be imported.
"""

import sys
from pathlib import Path

import pytest

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


def test_scripts_package_exists():
    """Test that the scripts package exists and can be imported."""
    import scripts

    assert scripts is not None
    assert hasattr(scripts, "__version__")


def test_scripts_package_has_docstring():
    """Test that the scripts package has proper documentation."""
    import scripts

    assert scripts.__doc__ is not None
    assert len(scripts.__doc__) > 0
    assert "MindVibe Scripts Package" in scripts.__doc__


def test_scripts_can_be_imported():
    """Test that individual scripts can be imported as modules."""
    # These imports should not fail even if dependencies are missing
    # We're just testing the package structure
    scripts_dir = project_root / "scripts"

    # Check that all expected scripts exist
    expected_scripts = [
        "generate_eddsa_key.py",
        "seed_wisdom.py",
        "seed_content.py",
        "verify_wisdom.py",
        "__init__.py",
    ]

    for script_name in expected_scripts:
        script_path = scripts_dir / script_name
        assert (
            script_path.exists()
        ), f"Script {script_name} not found in scripts package"
        assert script_path.is_file(), f"Script {script_name} is not a file"


def test_scripts_have_docstrings():
    """Test that all scripts have proper documentation."""
    scripts_dir = project_root / "scripts"

    scripts_to_check = [
        "generate_eddsa_key.py",
        "seed_wisdom.py",
        "seed_content.py",
        "verify_wisdom.py",
    ]

    for script_name in scripts_to_check:
        script_path = scripts_dir / script_name
        content = script_path.read_text()

        # Check for docstring
        assert (
            '"""' in content or "'''" in content
        ), f"Script {script_name} missing docstring"

        # Check for usage instructions
        assert (
            "Can be run as:" in content or "Usage:" in content
        ), f"Script {script_name} missing usage instructions"


def test_scripts_have_main_guard():
    """Test that all scripts have proper __main__ guard or are designed to run directly."""
    scripts_dir = project_root / "scripts"

    # These scripts should have __main__ guards
    scripts_to_check = [
        "generate_eddsa_key.py",
        "seed_wisdom.py",
        "seed_content.py",
    ]

    for script_name in scripts_to_check:
        script_path = scripts_dir / script_name
        content = script_path.read_text()

        # Check for __main__ guard
        assert (
            'if __name__ == "__main__":' in content
        ), f"Script {script_name} missing __main__ guard"

    # verify_wisdom.py is a verification/diagnostic script that runs immediately
    # Verify it does NOT have a __main__ guard (intentional design)
    verify_script_path = scripts_dir / "verify_wisdom.py"
    verify_content = verify_script_path.read_text()
    assert (
        'if __name__ == "__main__":' not in verify_content
    ), "verify_wisdom.py should not have __main__ guard (runs immediately by design)"


def test_scripts_have_proper_imports():
    """Test that scripts in the package directory have proper import setup."""
    scripts_dir = project_root / "scripts"

    scripts_to_check = ["seed_wisdom.py", "seed_content.py", "verify_wisdom.py"]

    for script_name in scripts_to_check:
        script_path = scripts_dir / script_name
        content = script_path.read_text()

        # Check for path handling to access parent modules
        assert (
            "sys.path.insert" in content or "Path(__file__).parent.parent" in content
        ), f"Script {script_name} missing proper path handling for imports"


def test_seed_scripts_have_database_imports():
    """Test that seed scripts import necessary database modules."""
    scripts_dir = project_root / "scripts"

    seed_scripts = ["seed_wisdom.py", "seed_content.py"]

    for script_name in seed_scripts:
        script_path = scripts_dir / script_name
        content = script_path.read_text()

        # Check for SQLAlchemy imports
        assert (
            "from sqlalchemy" in content
        ), f"Script {script_name} missing SQLAlchemy imports"

        # Check for model imports
        assert (
            "from models import" in content
        ), f"Script {script_name} missing model imports"

        # Check for async support
        assert (
            "asyncio" in content or "async def" in content
        ), f"Script {script_name} missing async support"


def test_verify_script_has_verification_logic():
    """Test that verify_wisdom script has proper verification logic."""
    scripts_dir = project_root / "scripts"
    script_path = scripts_dir / "verify_wisdom.py"
    content = script_path.read_text()

    # Check for verification prints
    assert (
        "Testing" in content or "Verification" in content
    ), "verify_wisdom.py missing verification output"

    # Check for imports of modules being verified
    assert (
        "from models import" in content
    ), "verify_wisdom.py should import models for verification"


def test_generate_key_script_has_crypto_imports():
    """Test that generate_eddsa_key script has cryptography imports."""
    scripts_dir = project_root / "scripts"
    script_path = scripts_dir / "generate_eddsa_key.py"
    content = script_path.read_text()

    # Check for cryptography imports
    assert (
        "from cryptography" in content or "import cryptography" in content
    ), "generate_eddsa_key.py missing cryptography imports"

    # Check for Ed25519 support
    assert (
        "ed25519" in content.lower()
    ), "generate_eddsa_key.py missing Ed25519 key generation"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
