import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

import main


@pytest.fixture
def client(monkeypatch):
    """API client backed by an in-memory MongoDB mock, so no database is needed."""
    monkeypatch.setattr(main, "db", AsyncMongoMockClient()["dine_ai_test"])
    with TestClient(main.app) as test_client:  # context manager runs the startup seeding
        yield test_client


def order_payload(table=1, guest="Asha", items=None):
    items = items or [{"name": "Butter Chicken", "price": 100.0, "quantity": 2}]
    return {"tableId": table, "guestName": guest, "items": items}
