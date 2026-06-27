"""Local filesystem storage for agent documents and inspection photos.

Files live under backend/app/storage/{documents,photos}/ (gitignored). We keep
only a path in the DB; capabilities read bytes back from here to hand to Claude
as document/image content blocks. No external object store (per project scope).
"""

from __future__ import annotations

import base64
import binascii
import mimetypes
import uuid
from pathlib import Path

_STORAGE_DIR = Path(__file__).resolve().parents[1] / "storage"
DOCUMENTS_DIR = _STORAGE_DIR / "documents"
PHOTOS_DIR = _STORAGE_DIR / "photos"

_KIND_DIRS = {"documents": DOCUMENTS_DIR, "photos": PHOTOS_DIR}

# Claude vision accepts these image media types; everything else we treat as PDF
# (the document content block) when reading back.
_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def _ensure_dirs() -> None:
    for directory in _KIND_DIRS.values():
        directory.mkdir(parents=True, exist_ok=True)


def guess_media_type(filename: str | None, fallback: str = "application/pdf") -> str:
    if not filename:
        return fallback
    media_type, _ = mimetypes.guess_type(filename)
    return media_type or fallback


def is_image(media_type: str) -> bool:
    return media_type in _IMAGE_TYPES


def save_bytes(kind: str, data: bytes, *, original_name: str | None = None) -> str:
    """Persist raw bytes under documents|photos and return the relative path."""
    _ensure_dirs()
    directory = _KIND_DIRS.get(kind, DOCUMENTS_DIR)
    suffix = Path(original_name).suffix if original_name else ""
    name = f"{uuid.uuid4().hex}{suffix}"
    target = directory / name
    target.write_bytes(data)
    return str(target.relative_to(_STORAGE_DIR.parent))


def save_base64(kind: str, b64: str, *, original_name: str | None = None) -> str:
    """Persist a base64 payload (data URLs accepted) and return the path."""
    if "," in b64 and b64.strip().startswith("data:"):
        b64 = b64.split(",", 1)[1]
    try:
        raw = base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError(f"invalid base64 payload: {exc}") from exc
    return save_bytes(kind, raw, original_name=original_name)


def read_base64(relative_path: str) -> str:
    """Read a stored file back as base64 (for Claude content blocks)."""
    path = _STORAGE_DIR.parent / relative_path
    return base64.b64encode(path.read_bytes()).decode("ascii")


def absolute_path(relative_path: str) -> Path:
    return _STORAGE_DIR.parent / relative_path
