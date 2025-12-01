"""Thin wrapper around S3-compatible object storage for encrypted payloads."""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger("mindvibe.object_storage")


@dataclass
class StorageConfig:
    bucket: str
    prefix: str
    region: str
    endpoint_url: str | None
    kms_key_id: str | None
    path_style: bool
    enabled: bool

    @classmethod
    def from_env(
        cls,
        bucket_env: str = "JOURNAL_STORAGE_BUCKET",
        prefix_env: str = "JOURNAL_STORAGE_PREFIX",
        default_prefix: str = "journal-archives",
    ) -> "StorageConfig":
        bucket = os.getenv(bucket_env, "")
        prefix = os.getenv(prefix_env, default_prefix).strip("/")
        region = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
        endpoint_url = os.getenv("JOURNAL_STORAGE_ENDPOINT_URL")
        kms_key_id = os.getenv("JOURNAL_STORAGE_KMS_KEY_ID")
        path_style = os.getenv("JOURNAL_STORAGE_PATH_STYLE", "false").lower() in {
            "1",
            "true",
            "yes",
            "on",
        }
        return cls(
            bucket=bucket,
            prefix=prefix,
            region=region,
            endpoint_url=endpoint_url,
            kms_key_id=kms_key_id,
            path_style=path_style,
            enabled=bool(bucket),
        )


@dataclass
class StorageResult:
    bucket: str
    key: str
    etag: str | None = None
    encryption_key_id: str | None = None

    @property
    def uri(self) -> str:
        return f"s3://{self.bucket}/{self.key}"

    def as_dict(self) -> Dict[str, Any]:
        return {
            "bucket": self.bucket,
            "key": self.key,
            "etag": self.etag,
            "encryption_key_id": self.encryption_key_id,
            "uri": self.uri,
        }


class ObjectStorageClient:
    """S3-compatible client with sane defaults for encryption and metadata."""

    def __init__(self, config: StorageConfig | None = None):
        self.config = config or StorageConfig.from_env()
        self._client = None
        if self.config.enabled:
            self._client = boto3.client(
                "s3",
                region_name=self.config.region,
                endpoint_url=self.config.endpoint_url,
                config=BotoConfig(
                    s3={"addressing_style": "path" if self.config.path_style else "auto"}
                ),
            )

    @property
    def enabled(self) -> bool:
        return bool(self._client and self.config.enabled)

    def _server_side_encryption(self) -> Dict[str, str]:
        if self.config.kms_key_id:
            return {
                "ServerSideEncryption": "aws:kms",
                "SSEKMSKeyId": self.config.kms_key_id,
            }
        return {"ServerSideEncryption": "AES256"}

    def upload_bytes(
        self,
        key: str,
        payload: bytes,
        content_type: str,
        metadata: Optional[Dict[str, str]] = None,
        encrypt_at_rest: bool = True,
    ) -> Optional[StorageResult]:
        if not self.enabled:
            logger.debug("object_storage_disabled", extra={"key": key})
            return None
        put_kwargs: Dict[str, Any] = {
            "Bucket": self.config.bucket,
            "Key": key,
            "Body": payload,
            "ContentType": content_type,
        }
        if metadata:
            put_kwargs["Metadata"] = metadata
        if encrypt_at_rest:
            put_kwargs.update(self._server_side_encryption())
        try:
            response = self._client.put_object(**put_kwargs)
            return StorageResult(
                bucket=self.config.bucket,
                key=key,
                etag=response.get("ETag"),
                encryption_key_id=metadata.get("encryption_key_id") if metadata else None,
            )
        except (ClientError, BotoCoreError) as exc:
            logger.exception("object_storage_put_failed", extra={"key": key, "error": str(exc)})
            return None

    def upload_file(
        self,
        path: Path,
        key: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None,
        encrypt_at_rest: bool = True,
    ) -> Optional[StorageResult]:
        if not path.exists():
            raise FileNotFoundError(path)
        return self.upload_bytes(
            key=key,
            payload=path.read_bytes(),
            content_type=content_type,
            metadata=metadata,
            encrypt_at_rest=encrypt_at_rest,
        )

    def list_objects(self, prefix: Optional[str] = None) -> list[dict]:
        if not self.enabled:
            return []
        search_prefix = prefix or self.config.prefix
        try:
            response = self._client.list_objects_v2(
                Bucket=self.config.bucket, Prefix=search_prefix
            )
        except (ClientError, BotoCoreError) as exc:
            logger.exception(
                "object_storage_list_failed",
                extra={"prefix": search_prefix, "error": str(exc)},
            )
            return []
        return response.get("Contents", []) or []

    def download_object(self, key: str, destination_dir: Path) -> Optional[Path]:
        if not self.enabled:
            return None
        destination_dir.mkdir(parents=True, exist_ok=True)
        target = destination_dir / Path(key).name
        try:
            self._client.download_file(self.config.bucket, key, str(target))
            return target
        except (ClientError, BotoCoreError) as exc:
            logger.exception(
                "object_storage_download_failed",
                extra={"key": key, "error": str(exc)},
            )
            return None


class JournalObjectArchiver:
    """Persist encrypted journal snapshots to object storage for durability."""

    def __init__(self, storage_client: ObjectStorageClient | None = None):
        self.storage = storage_client or ObjectStorageClient()
        self.prefix = self.storage.config.prefix

    @property
    def enabled(self) -> bool:
        return self.storage.enabled

    def archive_entry(
        self,
        *,
        entry_uuid: str,
        user_id: int,
        title: str,
        content: str,
        tags: list[str] | None,
        attachments: list[dict] | None,
        mood_score: int | None,
        encryption_fn,
    ) -> Optional[StorageResult]:
        if not self.enabled:
            return None

        snapshot = {
            "entry_uuid": entry_uuid,
            "user_id": user_id,
            "title": title,
            "content": content,
            "tags": tags,
            "attachments": attachments,
            "mood_score": mood_score,
        }
        serialized = json.dumps(snapshot, separators=(",", ":"))
        encrypted_payload, key_id = encryption_fn(serialized)

        object_key = f"{self.prefix}/users/{user_id}/{entry_uuid}.json"
        metadata = {"encryption_key_id": key_id, "schema": "journal_entry_v1"}
        return self.storage.upload_bytes(
            key=object_key,
            payload=encrypted_payload.encode("utf-8"),
            content_type="application/json",
            metadata=metadata,
        )


__all__ = [
    "ObjectStorageClient",
    "StorageConfig",
    "StorageResult",
    "JournalObjectArchiver",
]
