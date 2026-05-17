"""Prometheus scrape endpoint for the Wisdom-Core-gated pipeline.

Implements ``IMPROVEMENT_ROADMAP.md`` P2 §14. Returns the Prometheus
text-format snapshot of the default registry, including the
``kiaan_*`` metrics defined in
``backend.services.kiaan_telemetry``.

Scoped narrowly so it doesn't collide with the existing
``GET /api/monitoring/metrics`` (which serves a JSON business
dashboard for the admin UI). This endpoint is meant for a
``prometheus.yml`` ``scrape_configs`` job::

    - job_name: 'kiaan-grounded'
      scrape_interval: 15s
      metrics_path: /api/monitoring/prometheus
      static_configs:
        - targets: ['mindvibe-api:8000']

Auth model: unauthenticated by default. Operators usually expose this
behind a network-level filter (VPC / Tailscale / kube NetworkPolicy)
rather than HTTP auth — Prometheus scraping with bearer tokens is
finicky and breaks autoreload. If the deployment is on the open
internet, place the API behind a reverse proxy that restricts the
``/api/monitoring/prometheus`` path to the scrape source.
"""

from __future__ import annotations

from fastapi import APIRouter, Response

from backend.services.kiaan_telemetry import render_prometheus

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


@router.get("/prometheus")
async def prometheus_scrape() -> Response:
    """Return the Prometheus text-format snapshot of the registry."""
    body, content_type = render_prometheus()
    return Response(content=body, media_type=content_type)
