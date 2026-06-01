import pytest
from pydantic import ValidationError
from models import SensorData


def test_valid_sensor_data():
    data = SensorData(
        system_id="PBR-001",
        temperature=24.5,
        ph=7.1,
        oxygen=82,
        turbidity=10,
        latency=45,
    )

    assert data.system_id == "PBR-001"
    assert data.ph == 7.1
    assert data.latency == 45


def test_invalid_ph_rejected():
    with pytest.raises(ValidationError):
        SensorData(
            system_id="PBR-001",
            temperature=24.5,
            ph=15,
            oxygen=82,
            turbidity=10,
            latency=45,
        )


def test_negative_latency_rejected():
    with pytest.raises(ValidationError):
        SensorData(
            system_id="PBR-001",
            temperature=24.5,
            ph=7.1,
            oxygen=82,
            turbidity=10,
            latency=-1,
        )