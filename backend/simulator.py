import random
import time


def generate_sensor_data(system_id: str):
    return {
        "system_id": system_id,
        "temperature": round(random.uniform(22, 29), 1),
        "ph": round(random.uniform(6.7, 8.4), 2),
        "oxygen": random.randint(55, 90),
        "turbidity": random.randint(8, 35),
        "latency": random.randint(20, 1200),
        "timestamp": time.time(),
    }