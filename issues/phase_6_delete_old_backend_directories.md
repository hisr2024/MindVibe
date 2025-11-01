# Phase 6: Delete old backend directories (routes, services, models, core, security)

**Background:**
After backend file reorganization and migration to `backend/`, several old directories in the root are now obsolete or redundant. Removing these will ensure the repository remains clean, maintainable, and avoids confusion for new contributors.

**Directories to Delete:**
- `routes/` (now in `backend/routes/`)
- `services/` (now in `backend/services/`)
- `models/` (now consolidated in `backend/models.py`)
- `core/` (should move to `backend/core/` if needed, otherwise delete)
- `security/` (should move to `backend/security/` if needed, otherwise delete)

**Action:**
- [ ] Delete the above directories from the root, or move their contents to the appropriate `backend/` subdirectory if needed.
- [ ] Commit with message: `Delete old backend directories - PHASE 6 COMPLETE`
- [ ] Push to `repo-cleanup-reorganization` branch.

**Acceptance Criteria:**
- All obsolete directories are removed from the root.
- All needed files are present in the proper `backend/` structure.
- No breaking changes introduced.

**Reference:**
See `CLEANUP_PROGRESS.md` for migration documentation.