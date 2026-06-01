from fastapi.testclient import TestClient
from main import app
from storage import systems

client = TestClient(app)


def test_operator_can_turn_pump_on():
    systems["PBR-TEST"] = {
        "pump": False,
        "lights": True,
        "emergency_stop": False,
    }

    response = client.post(
        "/actuator",
        json={
            "system_id": "PBR-TEST",
            "actuator": "pump",
            "action": "on",
            "role": "operator",
            "username": "test_operator",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "acknowledged"
    assert response.json()["state"] is True


def test_viewer_cannot_control_actuator():
    systems["PBR-TEST"] = {
        "pump": False,
        "lights": True,
        "emergency_stop": False,
    }

    response = client.post(
        "/actuator",
        json={
            "system_id": "PBR-TEST",
            "actuator": "pump",
            "action": "on",
            "role": "viewer",
            "username": "test_viewer",
        },
    )

    assert response.status_code == 403


def test_emergency_stop_blocks_actuator_command():
    systems["PBR-TEST"] = {
        "pump": False,
        "lights": True,
        "emergency_stop": True,
    }

    response = client.post(
        "/actuator",
        json={
            "system_id": "PBR-TEST",
            "actuator": "pump",
            "action": "on",
            "role": "operator",
            "username": "test_operator",
        },
    )

    assert response.status_code == 423