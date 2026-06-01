import json
import os
import random
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("ALBON_API_BASE_URL", "http://127.0.0.1:8000")
USERNAME = os.getenv("ALBON_SIMULATOR_USERNAME", "simulator_operator")

SYSTEM_JSON_PATH = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "system.json"


def load_systems():
    with open(SYSTEM_JSON_PATH, "r") as file:
        return json.load(file)


SYSTEMS = load_systems()
VALID_SYSTEMS = [system["id"] for system in SYSTEMS]


def get_base_system(system_id: str):
    for system in SYSTEMS:
        if system["id"] == system_id:
            return system

    raise ValueError(f"System {system_id} not found in system.json")


def fluctuate(value, amount, min_value=None, max_value=None, decimals=1):
    new_value = value + random.uniform(-amount, amount)

    if min_value is not None:
        new_value = max(min_value, new_value)

    if max_value is not None:
        new_value = min(max_value, new_value)

    return round(new_value, decimals)


def generate_sensor_data(system_id: str):
    base = get_base_system(system_id)

    base["temperature"] = fluctuate(
        base["temperature"],
        amount=0.5,
        min_value=18,
        max_value=32,
        decimals=1,
    )

    base["ph"] = fluctuate(
        base["ph"],
        amount=0.05,
        min_value=5.5,
        max_value=8.5,
        decimals=2,
    )

    base["oxygen"] = fluctuate(
        base["oxygen"],
        amount=1.0,
        min_value=40,
        max_value=95,
        decimals=1,
    )

    base["turbidity"] = fluctuate(
        base["turbidity"],
        amount=0.5,
        min_value=5,
        max_value=50,
        decimals=1,
    )

    print(
        f"Generated data for {system_id}: "
        f"T={base['temperature']}, "
        f"pH={base['ph']}, "
        f"O2={base['oxygen']}, "
        f"Turbidity={base['turbidity']}"
    )

    return {
        "system_id": system_id,
        "temperature": base["temperature"],
        "ph": base["ph"],
        "oxygen": int(base["oxygen"]),
        "turbidity": int(base["turbidity"]),
        "latency": 0,
        "timestamp": time.time(),
    }

def post_request(endpoint: str, payload: dict):
    try:
        response = requests.post(
            f"{BASE_URL}{endpoint}",
            json=payload,
            timeout=5,
        )

        try:
            body = response.json()
        except ValueError:
            body = response.text

        print(f"Status: {response.status_code}")
        print(body)

        return response

    except requests.exceptions.ConnectionError:
        print("ERROR: FastAPI backend is not running.")
        print("Start it with:")
        print("uvicorn main:app --host 127.0.0.1 --port 8000 --reload")
    except requests.exceptions.Timeout:
        print("ERROR: Request timed out.")
    except requests.exceptions.RequestException as error:
        print(f"ERROR: Request failed: {error}")

    return None


def publish_sensor_data(system_id: str):
    data = generate_sensor_data(system_id)

    print("\nPublishing sensor data...")
    print(data)

    post_request("/sensor", data)


def send_actuator(system_id: str, actuator: str, action: str):
    payload = {
        "system_id": system_id,
        "actuator": actuator,
        "action": action,
        "role": "operator",
        "username": USERNAME,
    }

    print(f"\nSending command: {actuator} {action}")
    post_request("/actuator", payload)


def emergency_stop(system_id: str):
    payload = {
        "system_id": system_id,
        "role": "operator",
        "username": USERNAME,
    }

    print("\nSending EMERGENCY STOP...")
    post_request("/emergency-stop", payload)


def run_all_sites_sensor_loop():
    print("\nPublishing sensor data for ALL sites every 1 second.")
    print("Press Ctrl+C to stop.")

    try:
        while True:
            for system_id in VALID_SYSTEMS:
                publish_sensor_data(system_id)

            time.sleep(1)

    except KeyboardInterrupt:
        print("\nStopped all-site sensor simulator.")


def select_system():
    print("\nAvailable Sites")

    for index, system in enumerate(SYSTEMS, start=1):
        print(f"{index}. {system['id']} - {system['location']}")

    while True:
        choice = input("Select site: ").strip()

        if choice.isdigit():
            index = int(choice)

            if 1 <= index <= len(SYSTEMS):
                return SYSTEMS[index - 1]["id"]

        print(f"Invalid site. Please choose 1-{len(SYSTEMS)}.")


def main():
    system_id = select_system()

    while True:
        print(f"\nALBON Simulator Desktop Client - {system_id}")
        print("1. Publish one sensor reading")
        print("2. Start automatic sensor stream")
        print("3. Pump ON")
        print("4. Pump OFF")
        print("5. Lights ON")
        print("6. Lights OFF")
        print("7. Emergency Stop")
        print("8. Change Site")
        print("9. Exit")

        choice = input("Select option: ").strip()

        if choice == "1":
            publish_sensor_data(system_id)
        elif choice == "2":
            run_auto_sensor_loop(system_id)
        elif choice == "3":
            send_actuator(system_id, "pump", "on")
        elif choice == "4":
            send_actuator(system_id, "pump", "off")
        elif choice == "5":
            send_actuator(system_id, "lights", "on")
        elif choice == "6":
            send_actuator(system_id, "lights", "off")
        elif choice == "7":
            emergency_stop(system_id)
        elif choice == "8":
            system_id = select_system()
        elif choice == "9":
            print("Exiting simulator.")
            break
        else:
            print("Invalid option.")


if __name__ == "__main__":
    import sys

    if "--all" in sys.argv:
        run_all_sites_sensor_loop()
    else:
        main()