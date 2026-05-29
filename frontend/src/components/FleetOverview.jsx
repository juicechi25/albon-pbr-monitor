import systemsData from "../data/system.json";
import "./FleetOverview.css";
import { useState } from "react";
import SiteMap from "./SiteMap";

function getFleetAverages(systems) {
  const count = systems.length;

  const total = systems.reduce(
    (acc, system) => {
      acc.temperature += system.temperature;
      acc.ph += system.ph;
      acc.oxygen += system.oxygen;
      acc.turbidity += system.turbidity;
      acc.latency += system.latency;
      return acc;
    },
    {
      temperature: 0,
      ph: 0,
      oxygen: 0,
      turbidity: 0,
      latency: 0,
    }
  );

  return {
    temperature: total.temperature / count,
    ph: total.ph / count,
    oxygen: total.oxygen / count,
    turbidity: total.turbidity / count,
    latency: total.latency / count,
  };
}

function getAlerts(system, averages) {
  const alerts = [];

  if (system.oxygen < averages.oxygen) {
    alerts.push("Oxygen below fleet average");
  }

  if (system.ph < 6.5 || system.ph > 8.2) {
    alerts.push("pH outside safe range");
  }

  if (system.temperature < 20 || system.temperature > 28) {
    alerts.push("Temperature outside safe range");
  }

  if (system.turbidity > averages.turbidity) {
    alerts.push("Turbidity above fleet average");
  }

  if (system.latency > 1000) {
    alerts.push("Connection stale");
  }

  return alerts;
}

function getSeverity(alerts) {
  if (alerts.some((alert) => alert.toLowerCase().includes("stale"))) {
    return "critical";
  }

  if (alerts.length >= 2) {
    return "warning";
  }

  if (alerts.length === 1) {
    return "watch";
  }

  return "healthy";
}

function getHealthScore(system, averages) {
  let score = 100;

  if (system.oxygen < averages.oxygen) score -= 20;
  if (system.ph < 6.5 || system.ph > 8.2) score -= 25;
  if (system.temperature < 20 || system.temperature > 28) score -= 15;
  if (system.turbidity > averages.turbidity) score -= 15;
  if (system.latency > 1000) score -= 25;

  return Math.max(score, 0);
}

function FleetOverview({
  onSelectSystem,
  onLogout,
  unreadMessages,
  onOpenNotifications,
  notificationOpen,
  onCloseNotifications,
}) {
  const averages = getFleetAverages(systemsData);
  const [searchTerm, setSearchTerm] = useState("");

  const sortedSystems = systemsData
  .map((system) => {
    const alerts = getAlerts(system, averages);
    const severity = getSeverity(alerts);
    const healthScore = getHealthScore(system, averages);

    return {
      ...system,
      alerts,
      severity,
      healthScore,
    };
  })
  .filter((system) => {
    const search = searchTerm.toLowerCase();

    return (
      system.id.toLowerCase().includes(search) ||
      system.location.toLowerCase().includes(search)
    );
  })
  .sort((a, b) => a.healthScore - b.healthScore);
  return (
    <div className="fleet-page">
      <header className="fleet-header fleet-header-row">
  <div>
    <h1>Fleet Overview</h1>
        <p>Operator view: monitor all deployed photobioreactors</p>
      </div>

      <div className="notification-wrapper">
  <button
    className="notification-btn"
    onClick={onOpenNotifications}
  >
    🔔

    {unreadMessages.length > 0 && (
      <span className="notification-badge">
        {unreadMessages.length}
      </span>
    )}
  </button>

  {notificationOpen && (
    <aside className="notification-dropdown">
      <div className="notification-header">
        <h2>Notifications</h2>

        <button type="button" onClick={onCloseNotifications}>
          ×
        </button>
      </div>

      {unreadMessages.length === 0 ? (
        <p className="empty-notification">No unread messages</p>
      ) : (
        unreadMessages.map((msg) => (
          <div key={msg.id} className="notification-item">
            <strong>New message from {msg.sender}</strong>
            <p>Client: {msg.systemId}</p>
            <p>{msg.text}</p>
            <span>{msg.timestamp}</span>
          </div>
        ))
      )}
    </aside>
  )}

        <button
          className="logout-btn"
          onClick={onLogout}
        >
          Logout
        </button>

</div>

    </header>
      <div className="search-section">
        <input
          type="text"
          placeholder="Search by client ID or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <section className="fleet-summary">
        <h2>Fleet Averages</h2>

        <div className="average-grid">
          <div className="average-card">
            <span>Average Temperature</span>
            <strong>{averages.temperature.toFixed(1)} °C</strong>
          </div>

          <div className="average-card">
            <span>Average pH</span>
            <strong>{averages.ph.toFixed(2)}</strong>
          </div>

          <div className="average-card">
            <span>Average Oxygen</span>
            <strong>{averages.oxygen.toFixed(0)}%</strong>
          </div>

          <div className="average-card">
            <span>Average Turbidity</span>
            <strong>{averages.turbidity.toFixed(0)} NTU</strong>
          </div>
        </div>
      </section>

      <section className="fleet-list">
        {sortedSystems.map((system) => (
          <div key={system.id} className={`fleet-card ${system.severity}`}>
            <div className="site-info">
              <h2>
                {system.favorite ? "⭐ " : ""}
                {system.id}
              </h2>

              <p className="site-location">{system.location}</p>

              <span className={`status-badge ${system.severity}`}>
                {system.severity.toUpperCase()}
              </span>
            </div>

            <div className="sensor-summary">
              <p>Temp: {system.temperature} °C</p>
              <p>pH: {system.ph}</p>
              <p>Oxygen: {system.oxygen}%</p>
              <p>Turbidity: {system.turbidity} NTU</p>
              <p>Latency: {system.latency} ms</p>
            </div>

            <div className="alert-section">
              <span className="alert-title">Alerts</span>

              {system.alerts.length === 0 ? (
                <p className="no-alerts">No alerts</p>
              ) : (
                system.alerts.map((alert, index) => (
                  <p key={index} className="alert-item">
                    ⚠ {alert}
                  </p>
                ))
              )}
            </div>

            <button
              className="view-button"
              type="button"
              onClick={() =>
                onSelectSystem({
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
                    status: system.severity === "critical" ? "STALE" : "ONLINE",
                  },
                  actuators: {
                    pump: false,
                    lights: true,
                  },
                  favorite: system.favorite,
                })
              }
            >
              View Dashboard
            </button>
          </div>
        ))}
        <SiteMap
  systems={sortedSystems}
  onSelectSystem={(system) =>
    onSelectSystem({
      id: system.id,
      location: system.location,
      sensors: {
        temperature: system.temperature,
        ph: system.ph,
        oxygen: system.oxygen,
        turbidity: system.turbidity,
      },
      connection: {
        latency: system.latency,
        status: system.severity === "critical" ? "STALE" : "ONLINE",
      },
      actuators: {
        pump: false,
        lights: true,
      },
      favorite: system.favorite,
    })
  }
/>
      </section>
    </div>
  );
}

export default FleetOverview;