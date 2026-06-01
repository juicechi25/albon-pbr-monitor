import asyncio
import csv
import io
from datetime import datetime
import time;


from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from models import ActuatorCommand, ChatMessage, EmergencyStop, LatencyReport, SensorData
from simulator import generate_sensor_data
from storage import (
    systems,
    sensor_history,
    chat_messages,
    logs,
    latest_sensor_data,
    add_log,
    save_sensor_data,
    get_or_create_state,
)
from metrics import record_message, record_error, get_metrics


active_connections = {}

app = FastAPI(title="ALBON PBR Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "ALBON PBR backend running"}


@app.get("/systems")
def get_systems():
    return [
        {"system_id": system_id, **state}
        for system_id, state in systems.items()
    ]




@app.post("/sensor")
def post_sensor(data: SensorData):
    sensor_dict = data.model_dump()
    save_sensor_data(sensor_dict)
    record_message(sensor_dict["latency"])

    add_log(
        "INFO",
        data.system_id,
        "sensor reading received from simulator",
        "simulator",
        sensor_dict,
    )

    return {
        "status": "received",
        "data": sensor_dict,
    }

@app.get("/systems/{system_id}/state")
def get_state(system_id: str):
    return get_or_create_state(system_id)

@app.get("/ping")
def ping():
    return {
        "status": "ok",
        "server_time": datetime.now().isoformat(timespec="milliseconds")
    }

@app.post("/actuator")
def control_actuator(command: ActuatorCommand):
    state = get_or_create_state(command.system_id)

    if command.role != "operator":
        record_error()
        add_log(
            "WARNING",
            command.system_id,
            "unauthorised actuator attempt",
            command.username,
            command.dict(),
        )
        raise HTTPException(
            status_code=403,
            detail="Only operators can control actuators",
        )

    if state["emergency_stop"]:
        record_error()
        raise HTTPException(
            status_code=423,
            detail="System is in emergency stop mode",
        )

    state[command.actuator] = command.action == "on"

    add_log(
        "INFO",
        command.system_id,
        "actuator command acknowledged",
        command.username,
        {
            "actuator": command.actuator,
            "action": command.action,
        },
    )

    return {
        "status": "acknowledged",
        "system_id": command.system_id,
        "actuator": command.actuator,
        "state": state[command.actuator],
    }


@app.post("/emergency-stop")
def emergency_stop(data: EmergencyStop):
    if data.role != "operator":
        record_error()
        raise HTTPException(
            status_code=403,
            detail="Only operators can trigger emergency stop",
        )

    state = get_or_create_state(data.system_id)
    state["pump"] = False
    state["lights"] = False
    state["emergency_stop"] = True

    add_log(
        "CRITICAL",
        data.system_id,
        "emergency stop activated",
        data.username,
    )

    return {
        "status": "emergency_stop_activated",
        "system_id": data.system_id,
        "state": state,
    }

@app.post("/reset-emergency-stop")
def reset_emergency_stop(data: EmergencyStop):
    if data.role != "operator":
        record_error()
        raise HTTPException(
            status_code=403,
            detail="Only operators can reset emergency stop",
        )

    state = get_or_create_state(data.system_id)
    state["emergency_stop"] = False

    add_log(
        "INFO",
        data.system_id,
        "emergency stop reset",
        data.username,
    )

    return {
        "status": "emergency_stop_reset",
        "system_id": data.system_id,
        "state": state,
    }


@app.get("/metrics")
def metrics_endpoint():
    return get_metrics()


@app.post("/latency")
def post_latency(report: LatencyReport):
    record_message(report.latency_ms)
    return {"status": "recorded"}


@app.get("/logs")
def logs_endpoint():
    return logs[-100:]


@app.get("/chat/{system_id}")
def get_chat(system_id: str):
    return chat_messages.get(system_id, [])


@app.post("/chat")
def post_chat(message: ChatMessage):
    if message.system_id not in chat_messages:
        chat_messages[message.system_id] = []

    new_message = {
        "id": int(datetime.now().timestamp() * 1000),
        "system_id": message.system_id,
        "sender": message.sender,
        "role": message.role,
        "text": message.text,
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "read_by_operator": message.role == "operator",
        "read_by_viewer": message.role == "viewer",
    }

    chat_messages[message.system_id].append(new_message)

    add_log(
        "INFO",
        message.system_id,
        "chat message sent",
        message.sender,
    )

    return new_message


@app.post("/chat/{system_id}/read")
def mark_chat_read(system_id: str, role: str):
    if system_id in chat_messages:
        for msg in chat_messages[system_id]:
            if role == "operator":
                msg["read_by_operator"] = True
            elif role == "viewer":
                msg["read_by_viewer"] = True
    return {"status": "success"}


@app.get("/report/{system_id}")
def download_report(system_id: str):
    records = sensor_history.get(system_id, [])

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "system_id",
            "temperature",
            "ph",
            "oxygen",
            "turbidity",
            "latency",
            "timestamp",
        ],
    )

    writer.writeheader()

    for record in records:
        writer.writerow(record)

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={system_id}_report.csv"
        },
    )

@app.websocket("/ws/{system_id}")
async def websocket_sensor_stream(websocket: WebSocket, system_id: str):
    await websocket.accept()

    add_log("INFO", system_id, "websocket connected")

    try:
        while True:
            latest = latest_sensor_data.get(system_id)

            if latest and time.time() - latest.get("timestamp", 0) <= 2:
                data = latest
            else:
                data = generate_sensor_data(system_id)
                save_sensor_data(data)

            await websocket.send_json(data)
            await asyncio.sleep(1)

    except Exception:
        add_log("WARNING", system_id, "websocket disconnected")
    await websocket.accept()

    add_log("INFO", system_id, "websocket connected")

    try:
        while True:
            latest = latest_sensor_data.get(system_id)

            # If simulator has posted data recently, use it.
            # If not, generate fresh fallback data so dashboard still moves.
            if latest and time.time() - latest.get("timestamp", 0) <= 2:
                data = latest
            else:
                data = generate_sensor_data(system_id)
                save_sensor_data(data)

            print("Sending WS data:", data)

            await websocket.send_json(data)
            await asyncio.sleep(1)

    except Exception:
        add_log("WARNING", system_id, "websocket disconnected")
    await websocket.accept()

    add_log("INFO", system_id, "websocket connected")

    try:
        while True:
            if system_id in latest_sensor_data:
                data = latest_sensor_data[system_id]
            else:
                data = generate_sensor_data(system_id)
                save_sensor_data(data)

            await websocket.send_json(data)
            await asyncio.sleep(1)

    except Exception:
        add_log("WARNING", system_id, "websocket disconnected")