import os
import hashlib
import secrets
import hmac

# ── Admin token ──

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
_tokens: set[str] = set()


def verify_admin_password(password: str) -> bool:
    return hmac.compare_digest(password, ADMIN_PASSWORD)


def issue_token() -> str:
    t = secrets.token_urlsafe(32)
    _tokens.add(t)
    return t


def is_valid_token(token: str) -> bool:
    return token in _tokens


def revoke_token(token: str) -> None:
    _tokens.discard(token)


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