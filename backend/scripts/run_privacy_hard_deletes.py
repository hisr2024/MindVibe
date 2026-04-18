"""One-shot CLI: execute any deletions whose grace period has expired.

Intended usage: external scheduler (Render cron, Kubernetes CronJob,
systemd timer, GitHub Actions scheduled workflow, …) invokes this
script once per hour/day.

Typical Render cron config::

    command: python -m backend.scripts.run_privacy_hard_deletes
    schedule: "0 2 * * *"   # 2 AM UTC daily

Why this exists in addition to :class:`PrivacyScheduler`
--------------------------------------------------------
The in-process loop works great for long-lived API hosts, but Render's
free tier cold-starts every 15 minutes of idleness, which would mean
an in-process loop with a 1-hour cadence effectively never ticks on
low-traffic days.  Running this script from an out-of-band scheduler
is the reliable option.

Exit codes
----------
* ``0`` — completed (possibly with zero deletions to do).
* ``1`` — unexpected error (check logs; the scheduler will retry).
"""

from __future__ import annotations

import asyncio
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("privacy_hard_deletes")


async def _main() -> int:
    # Import lazily so --help doesn't require DB env vars.
    from backend import deps
    from backend.services.privacy_scheduler import (
        SCHEDULER_MAX_PER_TICK,
        run_hard_deletes_once,
    )

    logger.info("Privacy hard-delete tick starting (batch<=%d)", SCHEDULER_MAX_PER_TICK)
    stats = await run_hard_deletes_once(deps.SessionLocal, SCHEDULER_MAX_PER_TICK)
    logger.info(
        "Privacy hard-delete tick done — found=%d deleted=%d failed=%d",
        stats.get("found", 0),
        stats.get("deleted", 0),
        stats.get("failed", 0),
    )
    return 0


def main() -> None:
    try:
        code = asyncio.run(_main())
    except Exception as e:
        logger.exception("Privacy hard-delete tick crashed: %s", e)
        sys.exit(1)
    sys.exit(code)


if __name__ == "__main__":
    main()
