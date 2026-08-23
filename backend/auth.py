import os
import hashlib
import secrets
import hmac
import time

# ── Admin token ──

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
SECRET_KEY = hashlib.sha256(("delphi:" + ADMIN_PASSWORD).encode()).digest()

# Simple in-memory blacklist for revoked tokens (survives per-worker)
_revoked: set[str] = set()


def verify_admin_password(password: str) -> bool:
    return hmac.compare_digest(password, ADMIN_PASSWORD)


def issue_token() -> str:
    """Create an HMAC-signed token that any worker can verify independently."""
    payload = f"{secrets.token_urlsafe(16)}:{int(time.time())}"
    sig = hmac.new(SECRET_KEY, payload.encode(), hashlib.sha256).hexdigest()[:24]
    return f"{payload}:{sig}"


def is_valid_token(token: str) -> bool:
    """Verify token signature without shared memory. Also check blacklist."""
    if token in _revoked:
        return False
    try:
        parts = token.rsplit(":", 1)
        if len(parts) != 2:
            return False
        payload, sig = parts
        expected = hmac.new(SECRET_KEY, payload.encode(), hashlib.sha256).hexdigest()[:24]
        return hmac.compare_digest(sig, expected)
    except Exception:
        return False


def revoke_token(token: str) -> None:
    """Add token to per-worker blacklist."""
    _revoked.add(token)


# ── Participant password ──

def hash_password(password: str) -> str:
    """PBKDF2-SHA256 with random salt."""
    if not password:
        return ""
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return salt.hex() + ":" + dk.hex()


def verify_password(password: str, stored: str) -> bool:
    """Verify a password against a stored hash."""
    if not password or not stored:
        return False
    try:
        salt_hex, dk_hex = stored.split(":", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(dk_hex)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False