import os
import random
import time

import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("ALBON_API_BASE_URL", "http://127.0.0.1:8000")
USERNAME = os.getenv("ALBON_SIMULATOR_USERNAME", "simulator_operator")

VALID_SYSTEMS = [
    os.getenv("PBR_001", "PBR-001"),
    os.getenv("PBR_002", "PBR-002"),
    os.getenv("PBR_003", "PBR-003"),
    os.getenv("PBR_004", "PBR-004"),
]


def generate_sensor_data(system_id: str):
    return {
        "system_id": system_id,
        "temperature": round(random.uniform(22, 29), 1),
        "ph": round(random.uniform(6.7, 8.4), 2),
        "oxygen": random.randint(55, 90),
        "turbidity": random.randint(8, 35),
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


def run_auto_sensor_loop(system_id: str):
    print("\nPublishing sensor data every 1 second.")
    print("Press Ctrl+C to stop.")

    try:
        while True:
            publish_sensor_data(system_id)
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nStopped sensor simulator.")


def select_system():
    print("\nAvailable Sites")

    for index, site in enumerate(VALID_SYSTEMS, start=1):
        print(f"{index}. {site}")

    while True:
        choice = input("Select site: ").strip()

        if choice.isdigit():
            index = int(choice)

            if 1 <= index <= len(VALID_SYSTEMS):
                return VALID_SYSTEMS[index - 1]

        print("Invalid site. Please choose 1-4.")


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
    main()