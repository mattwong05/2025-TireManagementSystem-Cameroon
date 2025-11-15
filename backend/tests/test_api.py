from __future__ import annotations

from typing import Dict

from fastapi.testclient import TestClient


def authenticate(client: TestClient) -> Dict[str, str]:
    response = client.post(
        "/auth/login",
        data={"username": "tester", "password": "secret123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_vehicle_lifecycle(client: TestClient) -> None:
    headers = authenticate(client)

    create_response = client.post(
        "/vehicles",
        json={"license_plate": "LT 123 CM", "description": "Logistics truck"},
        headers=headers,
    )
    assert create_response.status_code == 201
    vehicle = create_response.json()
    assert vehicle["license_plate"] == "LT 123 CM"
    vehicle_id = vehicle["id"]

    list_response = client.get("/vehicles", headers=headers)
    assert list_response.status_code == 200
    assert any(item["id"] == vehicle_id for item in list_response.json())

    update_response = client.put(
        f"/vehicles/{vehicle_id}/wheel-positions/1",
        json={"tire_serial": "TIRE001"},
        headers=headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["tire_serial"] == "TIRE001"

    vehicle_update = client.put(
        f"/vehicles/{vehicle_id}",
        json={"license_plate": "LT 999 CM", "description": "Updated"},
        headers=headers,
    )
    assert vehicle_update.status_code == 200
    assert vehicle_update.json()["license_plate"] == "LT 999 CM"

    remove_response = client.delete(
        f"/vehicles/{vehicle_id}/wheel-positions/1",
        headers=headers,
    )
    assert remove_response.status_code == 200
    assert remove_response.json()["tire_serial"] is None

    bulk_response = client.post(
        f"/vehicles/{vehicle_id}/wheel-positions/bulk",
        json={
            "positions": [
                {"position_index": 1, "tire_serial": "TIRE-A"},
                {"position_index": 2, "tire_serial": "TIRE-B"},
            ]
        },
        headers=headers,
    )
    assert bulk_response.status_code == 200
    body = bulk_response.json()
    assert len(body["wheel_positions"]) == 20
    assert any(wp["tire_serial"] == "TIRE-A" for wp in body["wheel_positions"])

    detail_response = client.get(f"/vehicles/{vehicle_id}", headers=headers)
    assert detail_response.status_code == 200
    detail_body = detail_response.json()
    assert len(detail_body["wheel_positions"]) == 20

    delete_response = client.delete(f"/vehicles/{vehicle_id}", headers=headers)
    assert delete_response.status_code == 204

    list_after_delete = client.get("/vehicles", headers=headers)
    assert list_after_delete.status_code == 200
    assert all(item["id"] != vehicle_id for item in list_after_delete.json())


def test_search(client: TestClient) -> None:
    headers = authenticate(client)
    client.post(
        "/vehicles",
        json={"license_plate": "CM 987 AA", "description": "Spare"},
        headers=headers,
    )
    search_response = client.get("/vehicles", params={"search": "987"}, headers=headers)
    assert search_response.status_code == 200
    results = search_response.json()
    assert any("987" in item["license_plate"] for item in results)
