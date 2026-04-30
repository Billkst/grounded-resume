from __future__ import annotations

import re


def clean_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def is_chinese_dominant(text: str, threshold: float = 0.5) -> bool:
    if not text:
        return False
    chinese_chars = sum(1 for c in text if "\u4e00" <= c <= "\u9fff")
    return chinese_chars / len(text) >= threshold


def extract_snippet(text: str, start: int, end: int, padding: int = 5) -> str:
    snippet_start = max(0, start - padding)
    snippet_end = min(len(text), end + padding)
    return text[snippet_start:snippet_end]
