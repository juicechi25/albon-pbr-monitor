import { useEffect, useState } from "react";
import "./App.css";
import Login from "./components/Login";

export default function App() {
  const [role, setRole] = useState(null);

  const [latency, setLatency] = useState(45);
  const [pumpOn, setPumpOn] = useState(false);
  const [lightOn, setLightOn] = useState(true);
  const [status, setStatus] = useState("ONLINE");
  const [logs, setLogs] = useState([]);

  const [sensorData, setSensorData] = useState({
    temperature: 24.5,
    ph: 7.2,
    oxygen: 81,
    turbidity: 12,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const fakeSentTime = Date.now() - Math.floor(Math.random() * 120);
      const newLatency = Date.now() - fakeSentTime;

      setLatency(newLatency);

      setSensorData({
        temperature: (23 + Math.random() * 3).toFixed(1),
        ph: (6.8 + Math.random() * 0.8).toFixed(2),
        oxygen: Math.floor(75 + Math.random() * 15),
        turbidity: Math.floor(8 + Math.random() * 10),
      });

      if (newLatency > 1000) {
        setStatus("STALE");
      } else if (newLatency > 200) {
        setStatus("WARNING");
      } else {
        setStatus("ONLINE");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function logout() {
    setRole(null);
  }

  const isOperator = role === "operator";

  if (!role) {
    return <Login onLogin={setRole} />;
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>ALBON Photobioreactor Dashboard</h1>
          <p>Role: {role}</p>
        </div>

        <button className="secondary-btn" onClick={logout}>
          Logout
        </button>
      </header>

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
          <h2>Actuator Control</h2>

          {!isOperator && (
            <p className="warning-text">
              View-only role. Control buttons are disabled.
            </p>
          )}

          <div className="control-row">
            <span>Pump</span>
            <button
              disabled={!isOperator || status !== "ONLINE"}
              onClick={() => setPumpOn(!pumpOn)}
            >
              {pumpOn ? "Turn Pump Off" : "Turn Pump On"}
            </button>
          </div>

          <div className="control-row">
            <span>LED Light Rods</span>
            <button
              disabled={!isOperator || status !== "ONLINE"}
              onClick={() => setLightOn(!lightOn)}
            >
              {lightOn ? "Turn Lights Off" : "Turn Lights On"}
            </button>
          </div>

          <div className="state-box">
            <p>Pump State: {pumpOn ? "ON" : "OFF"}</p>
            <p>Light State: {lightOn ? "ON" : "OFF"}</p>
          </div>
        </section>
      </main>
    </div>
  );
}