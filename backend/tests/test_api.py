import pytest

from .conftest import order_payload

ALLOWED_ORIGIN = "http://localhost:3000"


def test_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


# --- Menu -------------------------------------------------------------------------


def test_empty_database_is_seeded_with_menu(client):
    menu = client.get("/api/menu").json()
    assert len(menu) == 7
    assert all(item["id"] for item in menu)
    assert {"Butter Chicken", "Kerala Parotta"} <= {item["name"] for item in menu}


def test_menu_item_lifecycle(client):
    created = client.post(
        "/api/menu",
        json={"name": "Test Dosa", "price": 90, "category": "Mains", "allergens": ["gluten"]},
    )
    assert created.status_code == 200
    item_id = created.json()["id"]

    updated = client.patch(f"/api/menu/{item_id}", json={"price": 110})
    assert updated.json()["price"] == 110

    assert client.delete(f"/api/menu/{item_id}").json()["status"] == "deleted"
    assert client.delete(f"/api/menu/{item_id}").status_code == 404


@pytest.mark.parametrize("method", ["patch", "delete"])
def test_invalid_menu_id_is_rejected(client, method):
    kwargs = {"json": {"price": 1}} if method == "patch" else {}
    assert getattr(client, method)("/api/menu/not-an-id", **kwargs).status_code == 400


# --- Orders -----------------------------------------------------------------------


def test_place_order(client):
    response = client.post("/api/orders", json=order_payload())
    assert response.status_code == 200
    order = response.json()
    assert order["status"] == "placed"
    assert order["tableId"] == 1
    assert order["id"]


def test_second_order_from_same_table_merges_and_recomputes_totals(client):
    client.post("/api/orders", json=order_payload(items=[{"name": "A", "price": 100, "quantity": 2}]))
    merged = client.post(
        "/api/orders", json=order_payload(items=[{"name": "B", "price": 50, "quantity": 1}])
    ).json()

    assert len(merged["items"]) == 2
    # subtotal 250 + 5% GST + 2.5% service charge
    assert merged["totalAmount"] == pytest.approx(250 * 1.075)
    assert len(client.get("/api/orders").json()) == 1


def test_different_tables_get_separate_orders(client):
    client.post("/api/orders", json=order_payload(table=1))
    client.post("/api/orders", json=order_payload(table=2))
    assert len(client.get("/api/orders").json()) == 2


def test_order_status_flow_kitchen_to_service(client):
    order_id = client.post("/api/orders", json=order_payload()).json()["id"]

    ready = client.patch(f"/api/orders/{order_id}/status", params={"status": "ready"}).json()
    assert ready["status"] == "ready"
    assert all(item["status"] == "ready" for item in ready["items"])

    served = client.patch(f"/api/orders/{order_id}/status", params={"status": "served"}).json()
    assert served["status"] == "served"

    assert [o["id"] for o in client.get("/api/orders", params={"status": "served"}).json()] == [
        order_id
    ]


def test_unknown_order_returns_404(client):
    missing = "0" * 24
    assert client.patch(f"/api/orders/{missing}/status", params={"status": "ready"}).status_code == 404


# --- Table sessions ---------------------------------------------------------------


def test_table_session_and_settlement(client):
    assert client.get("/api/tables/5/session").json() == {"active": False}

    client.post("/api/orders", json=order_payload(table=5, guest="Ravi"))
    session = client.get("/api/tables/5/session").json()
    assert session["active"] is True
    assert session["guestName"] == "Ravi"

    assert client.post("/api/tables/5/settle").json() == {"status": "cleared", "count": 1}
    assert client.get("/api/tables/5/session").json() == {"active": False}


def test_settle_rejects_non_numeric_table(client):
    assert client.post("/api/tables/abc/settle").status_code == 400


# --- Users ------------------------------------------------------------------------


def test_login_creates_then_updates_user(client):
    assert client.post("/api/users/check", json={"phone": "9999999999"}).json() == {"exists": False}

    first = client.post("/api/users/login", json={"phone": "9999999999", "name": "Meera"}).json()
    assert first["visitCount"] == 1

    again = client.post("/api/users/login", json={"phone": "9999999999"}).json()
    assert again["visitCount"] == 2
    assert again["name"] == "Meera"

    assert client.post("/api/users/check", json={"phone": "9999999999"}).json() == {
        "exists": True,
        "name": "Meera",
    }


# --- CORS -------------------------------------------------------------------------


def preflight(client, origin):
    return client.options(
        "/api/menu",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
    )


def test_cors_allows_the_deployed_frontend(client):
    response = preflight(client, ALLOWED_ORIGIN)
    assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN


def test_cors_blocks_unknown_origins(client):
    response = preflight(client, "https://evil.example.com")
    assert "access-control-allow-origin" not in response.headers
