import { useEffect, useState } from "react";
import Login from "./components/Login.jsx";
import FleetOverview from "./components/FleetOverview.jsx";
import Dashboard from "./components/Dashboard.jsx";
import systemsData from "./data/system.json";
import "./App.css";

export default function App() {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);

  const [logs, setLogs] = useState([]);
  const [systemErrors, setSystemErrors] = useState([]);

  const [latency, setLatency] = useState(45);
  const [pumpOn, setPumpOn] = useState(false);
  const [lightOn, setLightOn] = useState(true);
  const [status, setStatus] = useState("ONLINE");
  const [weather, setWeather] = useState(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState([]);

  const [sensorData, setSensorData] = useState({
    temperature: 24.5,
    ph: 7.2,
    oxygen: 81,
    turbidity: 12,
  });

  const role = currentUser?.role;
  const isOperator = role === "operator";

  function addLog(message) {
    setLogs((prev) => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        message,
      },
      ...prev,
    ]);
  }

  function addSystemError(code, message) {
    setSystemErrors((prev) => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        code,
        message,
      },
      ...prev,
    ]);
  }

  function convertSystem(system) {
    return {
      id: system.id,
      location: system.location,
      latitude: system.latitude,
      longitude: system.longitude,

      sensors: {
        temperature: system.temperature,
        ph: system.ph,
        oxygen: system.oxygen,
        turbidity: system.turbidity,
      },

      connection: {
        latency: system.latency,
        status: system.latency > 1000 ? "STALE" : "ONLINE",
      },

      actuators: {
        pump: false,
        lights: true,
      },

      favorite: system.favorite,
    };
  }

  function handleLogin(user) {
    setCurrentUser(user);
    addLog(`${user.username} logged in`);
  }

  function logout() {
    addLog(`${currentUser?.username} logged out`);

    setCurrentUser(null);
    setSelectedSystem(null);
    setWeather(null);
    setChatOpen(false);
    setNotificationOpen(false);
    setUnreadMessages([]);
    setStatus("ONLINE");
  }

  function handleSelectSystem(system) {
    setSelectedSystem(system);
    setSensorData(system.sensors);
    setLatency(system.connection.latency);
    setStatus(system.connection.status);
    setPumpOn(system.actuators.pump);
    setLightOn(system.actuators.lights);
    setWeather(null);
    setChatOpen(false);
    addLog(`${currentUser?.username || "user"} selected ${system.id}`);
  }

  useEffect(() => {
    if (currentUser?.role === "viewer" && !selectedSystem) {
      const assignedSystem = systemsData.find(
        (system) => system.id === currentUser.siteId
      );

      if (assignedSystem) {
        handleSelectSystem(convertSystem(assignedSystem));
      } else {
        addSystemError(
          "CLIENT_SITE_NOT_FOUND",
          `No system found for assigned site ${currentUser.siteId}`
        );
      }
    }
  }, [currentUser, selectedSystem]);

  useEffect(() => {
    if (!selectedSystem) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/${selectedSystem.id}`);

    ws.onopen = () => {
      console.log("WebSocket connected:", selectedSystem.id);
      addLog(`Live telemetry connected for ${selectedSystem.id}`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setSensorData({
        temperature: data.temperature,
        ph: data.ph,
        oxygen: data.oxygen,
        turbidity: data.turbidity,
      });

      setLatency(data.latency);

      if (data.latency > 1000) {
        setStatus("STALE");
      } else if (data.latency > 200) {
        setStatus("WARNING");
      } else {
        setStatus("ONLINE");
      }
    };

    ws.onerror = () => {
      setStatus("STALE");
      addSystemError(
        "WS_ERROR",
        `WebSocket connection failed for ${selectedSystem.id}`
      );
    };

    ws.onclose = () => {
      setStatus("STALE");
      addSystemError(
        "WS_CLOSED",
        `Live telemetry disconnected for ${selectedSystem.id}`
      );
    };

    return () => {
      ws.close();
    };
  }, [selectedSystem]);

  useEffect(() => {
    if (!selectedSystem?.latitude || !selectedSystem?.longitude) return;

    async function fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedSystem.latitude}&longitude=${selectedSystem.longitude}&current=temperature_2m,rain,wind_speed_10m,relative_humidity_2m`;

        const response = await fetch(url);

        if (!response.ok) {
          addSystemError(
            response.status,
            `Failed to fetch weather for ${selectedSystem.location}`
          );
          setWeather(null);
          return;
        }

        const data = await response.json();
        setWeather(data.current);
      } catch (error) {
        console.error(error);
        addSystemError(
          "WEATHER_API_ERROR",
          `Weather API unavailable for ${selectedSystem.location}`
        );
        setWeather(null);
      }
    }

    fetchWeather();
  }, [selectedSystem]);

  function getWeatherImpact() {
    if (!weather) return "Weather data unavailable.";

    if (weather.rain > 5) {
      return "Heavy rainfall may affect outdoor operation and dilute reactor conditions.";
    }

    if (weather.temperature_2m > 30) {
      return "High outdoor temperature may increase algae stress risk.";
    }

    if (weather.wind_speed_10m > 35) {
      return "High wind speed may affect exposed outdoor equipment.";
    }

    return "Outdoor conditions are suitable for normal operation.";
  }

  async function sendActuatorCommand(actuator, action) {
    try {
      const response = await fetch("http://localhost:8000/actuator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_id: selectedSystem.id,
          actuator,
          action,
          role: currentUser.role,
          username: currentUser.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        addSystemError(response.status, data.detail || "Actuator command failed");
        alert(data.detail || "Actuator command failed");
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      addSystemError(
        "ACTUATOR_API_ERROR",
        "Backend unavailable while sending actuator command"
      );
      alert("Backend unavailable while sending actuator command");
      return false;
    }
  }

  async function measureLatency() {
  const start = performance.now();

  try {
    const response = await fetch("http://localhost:8000/ping");

    if (!response.ok) {
      setStatus("STALE");
      return;
    }

    await response.json();

    const end = performance.now();
    const measuredLatency = Math.round(end - start);

    setLatency(measuredLatency);

    if (measuredLatency > 1000) {
      setStatus("STALE");
    } else if (measuredLatency > 200) {
      setStatus("WARNING");
    } else {
      setStatus("ONLINE");
    }
  } catch (error) {
    setStatus("STALE");
  }
}

useEffect(() => {
  if (!selectedSystem) return;

  measureLatency();

  const interval = setInterval(() => {
    measureLatency();
  }, 1000);

  return () => clearInterval(interval);
}, [selectedSystem]);

  async function togglePump() {
    const success = await sendActuatorCommand("pump", pumpOn ? "off" : "on");

    if (success) {
      setPumpOn(!pumpOn);
      addLog(`Pump ${!pumpOn ? "enabled" : "disabled"}`);
    }
  }

  async function toggleLight() {
    const success = await sendActuatorCommand("lights", lightOn ? "off" : "on");

    if (success) {
      setLightOn(!lightOn);
      addLog(`Lights ${!lightOn ? "enabled" : "disabled"}`);
    }
  }

  async function emergencyStop() {
    try {
      const response = await fetch("http://localhost:8000/emergency-stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_id: selectedSystem.id,
          role: currentUser.role,
          username: currentUser.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        addSystemError(response.status, data.detail || "Emergency stop failed");
        alert(data.detail || "Emergency stop failed");
        return;
      }

      setPumpOn(false);
      setLightOn(false);
      addLog("Emergency stop activated");
    } catch (error) {
      console.error(error);
      addSystemError(
        "EMERGENCY_STOP_API_ERROR",
        "Backend unavailable during emergency stop"
      );
      alert("Backend unavailable during emergency stop");
    }
  }

  async function downloadReport() {
    if (!selectedSystem) return;

    try {
      const response = await fetch(
        `http://localhost:8000/report/${selectedSystem.id}`
      );

      if (!response.ok) {
        addSystemError(response.status, "Failed to download report");
        alert("Failed to download report");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedSystem.id}_report.csv`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);

      addLog(`Downloaded report for ${selectedSystem.id}`);
    } catch (error) {
      console.error(error);
      addSystemError(
        "REPORT_API_ERROR",
        "Backend unavailable or report endpoint failed"
      );
      alert("Backend unavailable or report endpoint failed");
    }
  }

  function getCurrentSiteUnreadMessages() {
    if (!selectedSystem) return [];

    return unreadMessages.filter((msg) => msg.systemId === selectedSystem.id);
  }

  function loadUnreadMessages() {
    if (!currentUser) return;

    const unread = [];

    if (currentUser.role === "operator") {
      systemsData.forEach((system) => {
        const saved = localStorage.getItem(`chat-${system.id}`);
        const messages = saved ? JSON.parse(saved) : [];

        messages.forEach((msg) => {
          if (msg.role === "viewer" && !msg.readByOperator) {
            unread.push(msg);
          }
        });
      });
    }

    if (currentUser.role === "viewer" && selectedSystem) {
      const saved = localStorage.getItem(`chat-${selectedSystem.id}`);
      const messages = saved ? JSON.parse(saved) : [];

      messages.forEach((msg) => {
        if (msg.role === "operator" && !msg.readByViewer) {
          unread.push(msg);
        }
      });
    }

    setUnreadMessages((prev) => {
      const prevIds = prev.map((msg) => msg.id).join(",");
      const nextIds = unread.map((msg) => msg.id).join(",");

      return prevIds === nextIds ? prev : unread;
    });
  }

  useEffect(() => {
    if (!currentUser) return;

    loadUnreadMessages();

    const interval = setInterval(() => {
      loadUnreadMessages();
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser, selectedSystem]);

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (isOperator && !selectedSystem) {
    return (
      <FleetOverview
        onSelectSystem={handleSelectSystem}
        onLogout={logout}
        unreadMessages={unreadMessages}
        notificationOpen={notificationOpen}
        onOpenNotifications={() => setNotificationOpen((prev) => !prev)}
        onCloseNotifications={() => setNotificationOpen(false)}
      />
    );
  }

  if (!selectedSystem) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <Dashboard
      selectedSystem={selectedSystem}
      currentUser={currentUser}
      role={role}
      isOperator={isOperator}
      status={status}
      latency={latency}
      sensorData={sensorData}
      weather={weather}
      pumpOn={pumpOn}
      lightOn={lightOn}
      logs={logs}
      systemErrors={systemErrors}
      chatOpen={chatOpen}
      unreadCount={getCurrentSiteUnreadMessages().length}
      getWeatherImpact={getWeatherImpact}
      onBackToFleet={() => {
        setSelectedSystem(null);
        setWeather(null);
        setChatOpen(false);
        setNotificationOpen(false);
      }}
      onOpenChat={() => setChatOpen(true)}
      onCloseChat={() => setChatOpen(false)}
      onDownloadReport={downloadReport}
      onLogout={logout}
      onTogglePump={togglePump}
      onToggleLight={toggleLight}
      onEmergencyStop={emergencyStop}
    />
  );
}