import time

metrics = {
    "message_count": 0,
    "error_count": 0,
    "latency_total": 0,
    "start_time": time.time(),
}


def record_message(latency):
    metrics["message_count"] += 1
    metrics["latency_total"] += latency


def record_error():
    metrics["error_count"] += 1


def get_metrics():
    count = metrics["message_count"]
    uptime = time.time() - metrics["start_time"]

    avg_latency = (
        metrics["latency_total"] / count
        if count > 0
        else 0
    )

    message_rate = count / uptime if uptime > 0 else 0

    return {
        "message_count": metrics["message_count"],
        "error_count": metrics["error_count"],
        "average_latency": round(avg_latency, 2),
        "message_rate_per_sec": round(message_rate, 2),
        "uptime_seconds": round(uptime, 1),
    }