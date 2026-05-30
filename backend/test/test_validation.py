from models import SensorData
from pydantic import ValidationError


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


def test_invalid_ph_rejected():
    try:
        SensorData(
            system_id="PBR-001",
            temperature=24.5,
            ph=15,
            oxygen=82,
            turbidity=10,
            latency=45,
        )
        assert False
    except ValidationError:
        assert True