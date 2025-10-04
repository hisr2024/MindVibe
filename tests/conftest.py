import sys
import os

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

def _unify_module(pkg_name, top_name):
    mpkg = sys.modules.get(pkg_name)
    mtop = sys.modules.get(top_name)
    try:
        f_pkg = getattr(mpkg, "__file__", None)
        f_top = getattr(mtop, "__file__", None)
    except Exception:
        f_pkg = f_top = None
    if mpkg and mtop and f_pkg and f_top and os.path.realpath(f_pkg) == os.path.realpath(f_top):
        sys.modules[top_name] = mpkg

_unify_module("MindVibe.scripts.generate_jwks", "scripts.generate_jwks")
_unify_module("MindVibe.scripts", "scripts")
