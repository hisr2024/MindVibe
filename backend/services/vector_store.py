"""Lightweight vector store for semantic retrieval without external services."""
from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass
from typing import Dict, Iterable, List

TOKEN_PATTERN = re.compile(r"[\w']+")


def _tokenize(text: str) -> Counter[str]:
    tokens = TOKEN_PATTERN.findall(text.lower())
    return Counter(tokens)


def _to_vector(counter: Counter[str]) -> Dict[str, float]:
    total = sum(counter.values()) or 1
    return {token: count / total for token, count in counter.items()}


def _cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    intersection = set(vec_a.keys()) & set(vec_b.keys())
    numerator = sum(vec_a[token] * vec_b[token] for token in intersection)
    norm_a = math.sqrt(sum(value * value for value in vec_a.values()))
    norm_b = math.sqrt(sum(value * value for value in vec_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return numerator / (norm_a * norm_b)


@dataclass
class VectorDocument:
    id: str
    text: str
    metadata: dict
    vector: Dict[str, float]


class VectorStore:
    def __init__(self) -> None:
        self.documents: dict[str, VectorDocument] = {}

    def add(self, doc_id: str, text: str, metadata: dict | None = None) -> None:
        tokens = _tokenize(text)
        vector = _to_vector(tokens)
        self.documents[doc_id] = VectorDocument(doc_id, text, metadata or {}, vector)

    def bulk_add(self, documents: Iterable[VectorDocument]) -> None:
        for doc in documents:
            self.documents[doc.id] = doc

    def search(self, query: str, k: int = 5) -> List[dict]:
        query_vector = _to_vector(_tokenize(query))
        scored: list[tuple[float, VectorDocument]] = []
        for doc in self.documents.values():
            score = _cosine_similarity(query_vector, doc.vector)
            scored.append((score, doc))
        scored.sort(key=lambda item: item[0], reverse=True)
        top = scored[:k]
        return [
            {
                "id": doc.id,
                "score": score,
                "text": doc.text,
                "metadata": doc.metadata,
            }
            for score, doc in top
            if score > 0
        ]
