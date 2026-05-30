from datetime import datetime

systems = {
    "PBR-001": {"pump": False, "lights": True, "emergency_stop": False},
    "PBR-002": {"pump": False, "lights": True, "emergency_stop": False},
    "PBR-003": {"pump": False, "lights": True, "emergency_stop": False},
    "PBR-004": {"pump": False, "lights": True, "emergency_stop": False}
}

sensor_history = {}
chat_messages = {}
logs = []


def add_log(level, system_id, event, username="system", details=None):
    logs.append({
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "level": level,
        "system_id": system_id,
        "event": event,
        "username": username,
        "details": details or {},
    })


def save_sensor_data(data):
    system_id = data["system_id"]

    if system_id not in sensor_history:
        sensor_history[system_id] = []

    sensor_history[system_id].append(data)

    sensor_history[system_id] = sensor_history[system_id][-100:]


def get_or_create_state(system_id):
    if system_id not in systems:
        systems[system_id] = {
            "pump": False,
            "lights": True,
            "emergency_stop": False,
        }

    return systems[system_id]