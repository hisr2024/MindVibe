import sys
import os

# Ensure repository root is on sys.path for test imports
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# If the same source file is importable under two module names, map one to the other.
# This prevents "Source file twice under different module names" errors during test collection.
def _unify_module(pkg_name, top_name):
    mpkg = sys.modules.get(pkg_name)
    mtop = sys.modules.get(top_name)
    try:
        f_pkg = getattr(mpkg, "__file__", None)
        f_top = getattr(mtop, "__file__", None)
    except Exception:
        f_pkg = f_top = None
    if mpkg and mtop and f_pkg and f_top and os.path.realpath(f_pkg) == os.path.realpath(f_top):
        # prefer the package-qualified module object
        sys.modules[top_name] = mpkg

# Examples to unify; adjust if your package name differs
_unify_module("MindVibe.scripts.generate_jwks", "scripts.generate_jwks")
_unify_module("MindVibe.scripts", "scripts")
