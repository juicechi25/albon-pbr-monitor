function formatLabel(key) {
  const labels = {
    temperature: "Temperature",
    ph: "pH",
    oxygen: "Dissolved Oxygen",
    turbidity: "Turbidity",
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function getUnit(key) {
  const units = {
    temperature: "°C",
    oxygen: "%",
    turbidity: "NTU",
  };
  return units[key] || "";
}

function Sensor({ sensorData }) {
  return (
    <section className="card">
      <h2>Live Sensor Telemetry</h2>

      <div className="grid">
        {Object.entries(sensorData).map(([key, value]) => (
          <div key={key} className="metric">
            <span>{formatLabel(key)}</span>
            <strong>
              {value} {getUnit(key)}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Sensor;