from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class SensorData(BaseModel):
    system_id: str
    temperature: float = Field(ge=18, le=32)
    ph: float = Field(ge=5.5, le=8.5)
    oxygen: int = Field(ge=40, le=95)
    turbidity: int = Field(ge=5, le=50)
    latency: int = Field(ge=0)
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp())


class ActuatorCommand(BaseModel):
    system_id: str
    actuator: Literal["pump", "lights"]
    action: Literal["on", "off"]
    role: Literal["viewer", "operator"]
    username: str


class ChatMessage(BaseModel):
    system_id: str
    sender: str
    role: Literal["viewer", "operator"]
    text: str


class EmergencyStop(BaseModel):
    system_id: str
    role: Literal["viewer", "operator"]
    username: str


class LatencyReport(BaseModel):
    system_id: str
    latency_ms: float = Field(ge=0)