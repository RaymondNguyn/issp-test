import pytest
from jose import jwt
from datetime import datetime, timedelta, timezone
from backend.services.auth_service import (
    create_access_token,
    verify_password,
    get_password_hash,
    SECRET_KEY,
    ALGORITHM
)

def test_password_hashing():
    password = "testpassword123"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)

def test_create_access_token():
    test_data = {"sub": "testuser@example.com"}
    token = create_access_token(test_data)
    assert isinstance(token, str)
    
    # Verify token contents
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == test_data["sub"]
    assert "exp" in payload

def test_create_access_token_with_expiry():
    test_data = {"sub": "testuser@example.com"}
    expires_delta = timedelta(minutes=30)
    token = create_access_token(test_data, expires_delta)
    
    # Verify expiration time
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    exp_time = datetime.fromtimestamp(payload["exp"], timezone.utc)
    now = datetime.now(timezone.utc)
    assert (exp_time - now).total_seconds() > 0
