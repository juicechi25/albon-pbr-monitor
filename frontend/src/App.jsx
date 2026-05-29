import { useEffect, useState } from "react";
import Login from "./components/Login.jsx";
import FleetOverview from "./components/FleetOverview.jsx";
import ChatBox from "./components/ChatBox.jsx";
import systemsData from "./data/system.json";
import "./App.css";

export default function App() {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [logs, setLogs] = useState([]);

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
    setUnreadMessages([]);
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
    setUnreadMessages([]);
    addLog(`${currentUser?.username || "user"} selected ${system.id}`);
  }

  useEffect(() => {
    if (currentUser?.role === "viewer" && !selectedSystem) {
      const assignedSystem = systemsData.find(
        (system) => system.id === currentUser.siteId
      );

      if (assignedSystem) {
        handleSelectSystem(convertSystem(assignedSystem));
      }
    }
  }, [currentUser, selectedSystem]);

  useEffect(() => {
    if (!selectedSystem) return;

    const interval = setInterval(() => {
      const newLatency = Math.floor(Math.random() * 2000);

      setLatency(newLatency);

      setSensorData((prev) => ({
        temperature: (
          Number(prev.temperature) +
          (Math.random() - 0.5)
        ).toFixed(1),
        ph: (Number(prev.ph) + (Math.random() - 0.5) * 0.1).toFixed(2),
        oxygen: Math.max(
          0,
          Math.min(
            100,
            Number(prev.oxygen) + Math.floor(Math.random() * 5 - 2)
          )
        ),
        turbidity: Math.max(
          0,
          Number(prev.turbidity) + Math.floor(Math.random() * 3 - 1)
        ),
      }));

      if (newLatency > 1000) {
        setStatus("STALE");
      } else if (newLatency > 200) {
        setStatus("WARNING");
      } else {
        setStatus("ONLINE");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSystem]);

  useEffect(() => {
    if (!selectedSystem?.latitude || !selectedSystem?.longitude) return;

    async function fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedSystem.latitude}&longitude=${selectedSystem.longitude}&current=temperature_2m,rain,wind_speed_10m,relative_humidity_2m`;

        const response = await fetch(url);
        const data = await response.json();

        setWeather(data.current);
      } catch (error) {
        console.error("Failed to fetch weather:", error);
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

  function togglePump() {
    setPumpOn((prev) => !prev);
    addLog(!pumpOn ? "Pump enabled" : "Pump disabled");
  }

  function toggleLight() {
    setLightOn((prev) => !prev);
    addLog(!lightOn ? "LED lights enabled" : "LED lights disabled");
  }

  function emergencyStop() {
    setPumpOn(false);
    setLightOn(false);
    addLog("EMERGENCY STOP activated");
  }

  function loadAllUnreadMessages() {
  if (!isOperator) return;

  const unread = [];

  systemsData.forEach((system) => {
    const saved = localStorage.getItem(`chat-${system.id}`);
    const messages = saved ? JSON.parse(saved) : [];

    messages.forEach((msg) => {
      if (msg.role === "viewer" && !msg.readByOperator) {
        unread.push(msg);
      }
    });
  });

  setUnreadMessages(unread);
}
useEffect(() => {
  if (!isOperator) return;

  loadAllUnreadMessages();

  const interval = setInterval(() => {
    loadAllUnreadMessages();
  }, 1000);

  return () => clearInterval(interval);
}, [isOperator]);


  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (isOperator && !selectedSystem) {
  return (
    <>
      <FleetOverview
        onSelectSystem={handleSelectSystem}
        onLogout={logout}
        unreadMessages={unreadMessages}
        notificationOpen={notificationOpen}
        onOpenNotifications={() =>
          setNotificationOpen((prev) => !prev)
        }
        onCloseNotifications={() => setNotificationOpen(false)}
      />

      {notificationOpen && (
        <aside className="notification-sidebar">
          <div className="notification-header">
            <h2>Notifications</h2>

            <button
              type="button"
              onClick={() => setNotificationOpen(false)}
            >
              ×
            </button>
          </div>

          {unreadMessages.length === 0 ? (
            <p>No unread messages</p>
          ) : (
            unreadMessages.map((msg) => (
              <div key={msg.id} className="notification-item">
                <strong>{msg.sender}</strong>
                <p>Client: {msg.systemId}</p>
                <p>{msg.text}</p>
                <span>{msg.timestamp}</span>
              </div>
            ))
          )}
        </aside>
      )}
    </>
  );
}
  if (!selectedSystem) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>{selectedSystem.id} Dashboard</h1>
          <p>
            Location: {selectedSystem.location} | Role: {role}
          </p>
        </div>

        <div className="header-actions">
          {isOperator && (
            <button
              className="secondary-btn"
              onClick={() => {
                setSelectedSystem(null);
                setWeather(null);
                setChatOpen(false);
                setUnreadMessages([]);
              }}
            >
              Back to Fleet
            </button>
          )}

          <button
            className="chat-toggle-btn"
            type="button"
            onClick={() => setChatOpen(true)}
          >
            💬 Chat
            {unreadMessages.length > 0 && (
              <span className="notification-badge">
                {unreadMessages.length}
              </span>
            )}
          </button>

          <button className="secondary-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {isOperator && unreadMessages.length > 0 && (
        <section className="status-banner warning">
          New message from client {unreadMessages[0].systemId}
        </section>
      )}

      <section className={`status-banner ${status.toLowerCase()}`}>
        System Status: {status} | Latency: {latency} ms
      </section>

      <main className="dashboard">
        <section className="card">
          <h2>Live Sensor Telemetry</h2>

          <div className="grid">
            <div className="metric">
              <span>Temperature</span>
              <strong>{sensorData.temperature} °C</strong>
            </div>

            <div className="metric">
              <span>pH</span>
              <strong>{sensorData.ph}</strong>
            </div>

            <div className="metric">
              <span>Dissolved Oxygen</span>
              <strong>{sensorData.oxygen}%</strong>
            </div>

            <div className="metric">
              <span>Turbidity</span>
              <strong>{sensorData.turbidity} NTU</strong>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Latency Monitor</h2>

          <div className="latency-box">
            <strong>{latency} ms</strong>
            <p>
              {latency <= 200
                ? "Good live update speed"
                : latency <= 1000
                ? "Warning: delayed updates"
                : "Unsafe: stale data"}
            </p>
          </div>
        </section>

        <section className="card">
          <h2>Outdoor Weather</h2>

          {weather ? (
            <>
              <div className="grid">
                <div className="metric">
                  <span>Air Temperature</span>
                  <strong>{weather.temperature_2m} °C</strong>
                </div>

                <div className="metric">
                  <span>Humidity</span>
                  <strong>{weather.relative_humidity_2m}%</strong>
                </div>

                <div className="metric">
                  <span>Rainfall</span>
                  <strong>{weather.rain} mm</strong>
                </div>

                <div className="metric">
                  <span>Wind Speed</span>
                  <strong>{weather.wind_speed_10m} km/h</strong>
                </div>
              </div>

              <div className="state-box">
                <p>{getWeatherImpact()}</p>
              </div>
            </>
          ) : (
            <p>Loading weather for {selectedSystem.location}...</p>
          )}
        </section>

        <section className="card">
          <h2>Actuator Control</h2>

          {!isOperator && (
            <p className="warning-text">
              View-only role. Control buttons are disabled.
            </p>
          )}

          <button
            className="emergency-btn"
            disabled={!isOperator}
            onClick={emergencyStop}
          >
            EMERGENCY STOP
          </button>

          <div className="control-row">
            <span>Pump</span>
            <button
              disabled={!isOperator || status !== "ONLINE"}
              onClick={togglePump}
            >
              {pumpOn ? "Turn Pump Off" : "Turn Pump On"}
            </button>
          </div>

          <div className="control-row">
            <span>LED Light Rods</span>
            <button
              disabled={!isOperator || status !== "ONLINE"}
              onClick={toggleLight}
            >
              {lightOn ? "Turn Lights Off" : "Turn Lights On"}
            </button>
          </div>

          <div className="state-box">
            <p>Pump State: {pumpOn ? "ON" : "OFF"}</p>
            <p>Light State: {lightOn ? "ON" : "OFF"}</p>
          </div>
        </section>

        {isOperator && (
          <section className="card">
            <h2>Activity Log</h2>

            <div className="log-container">
              {logs.length === 0 ? (
                <p>No events recorded.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="log-entry">
                    <span>{log.timestamp}</span>
                    <p>{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
        {notificationOpen && isOperator && (
        <aside className="notification-sidebar">
          <div className="notification-header">
            <h2>Notifications</h2>

            <button
              onClick={() => setNotificationOpen(false)}
            >
              ×
            </button>
          </div>

          {unreadMessages.length === 0 ? (
            <p>No unread messages</p>
          ) : (
            unreadMessages.map((msg) => (
              <div
                key={msg.id}
                className="notification-item"
              >
                <strong>{msg.sender}</strong>

                <p>
                  Client: {msg.systemId}
                </p>

                <p>{msg.text}</p>

                <span>{msg.timestamp}</span>
              </div>
            ))
          )}
        </aside>
      )}
      <ChatBox
        systemId={selectedSystem.id}
        currentUser={currentUser}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onNewUnread={setUnreadMessages}
      />
    </div>
  );
}