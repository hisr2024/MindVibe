"""Observability wiring for Sentry, Prometheus, and OpenTelemetry."""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from sentry_sdk import Hub, init as sentry_init
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from backend.core.metrics import create_metrics_router, metrics_middleware
from backend.core.settings import settings

logger = logging.getLogger("mindvibe.observability")


def setup_sentry(app: FastAPI) -> None:
    if not settings.SENTRY_DSN:
        logger.info("sentry_disabled")
        return

    logging_integration = LoggingIntegration(level=logging.INFO, event_level=logging.ERROR)
    sentry_init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration(), logging_integration],
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        enable_tracing=True,
        environment="production" if settings.SECURE_COOKIE else "development",
        send_default_pii=False,
        default_integrations=True,
        attach_stacktrace=True,
        enable_backpressure_handling=True,
        before_send=lambda event, _hint: event,
    )

    # capture breadcrumbs from logging
    Hub.current.bind_client(Hub.current.client, scope=None)
    logger.info("sentry_initialized", extra={"dsn_configured": True})
    app.state.sentry_enabled = True


def setup_prometheus(app: FastAPI) -> Optional[Instrumentator]:
    if not settings.PROMETHEUS_ENABLED:
        logger.info("prometheus_disabled")
        return None

    app.middleware("http")(metrics_middleware)
    app.include_router(create_metrics_router())

    instrumentator = Instrumentator()
    instrumentator.instrument(app)
    instrumentator.expose(app, include_in_schema=False, endpoint="/instrumentator/metrics")
    logger.info("prometheus_instrumented", extra={"custom_metrics_endpoint": "/metrics"})
    return instrumentator


def setup_opentelemetry(app: FastAPI) -> None:
    if not settings.OTEL_EXPORTER_OTLP_ENDPOINT:
        logger.info("otel_exporter_missing")
        return

    resource = Resource.create({"service.name": settings.OTEL_SERVICE_NAME})
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT)
    processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)
    LoggingInstrumentor().instrument(set_logging_format=True)
    logger.info("otel_configured", extra={"endpoint": settings.OTEL_EXPORTER_OTLP_ENDPOINT})


def setup_observability(app: FastAPI) -> None:
    """Initialize all observability integrations for the FastAPI app."""

    setup_sentry(app)
    setup_prometheus(app)
    setup_opentelemetry(app)

