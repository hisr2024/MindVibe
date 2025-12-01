import logging
from unittest.mock import MagicMock

import pytest

from backend.security.secret_manager import SecretManager, SecretManagerConfig, _redact_secret_id


class LogCaptureHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self.records = []

    def emit(self, record):
        self.records.append(record)


@pytest.fixture
def log_handler():
    handler = LogCaptureHandler()
    logger = logging.getLogger("mindvibe.secret_manager")
    logger.addHandler(handler)
    logger.setLevel(logging.WARNING)
    yield handler
    logger.removeHandler(handler)


def test_redact_secret_id_masks_sensitive_value():
    assert _redact_secret_id("super-secret-value") == "su***alue"
    assert _redact_secret_id("short") == "***"
    assert _redact_secret_id("") == ""


def test_get_secret_logs_redacted_identifier(log_handler):
    mock_client = MagicMock()
    mock_client.get_secret_value.side_effect = Exception("boom")
    manager = SecretManager(SecretManagerConfig(provider="aws", region="us-east-1", namespace="prod/"))
    manager._client = mock_client

    assert manager.get_secret("api/key") is None

    assert log_handler.records, "expected a warning log entry"
    record = log_handler.records[0]
    assert getattr(record, "secret_id", None) == "pr***/key"
    assert "api/key" not in str(record.__dict__)


def test_aws_secret_manager_disabled_without_region(log_handler):
    manager = SecretManager(SecretManagerConfig(provider="aws", region=None, namespace="prod/"))

    assert manager.enabled is False
    assert log_handler.records, "expected a warning when region is missing"
    assert log_handler.records[0].msg == "secret_manager_disabled_missing_region"
