import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "./SiteMap.css";

function SiteMap({ systems, onSelectSystem }) {
  return (
    <section className="site-map-card">
      <h2>Site Map</h2>

      <MapContainer
        center={[-33.8688, 151.2093]}
        zoom={10}
        className="site-map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {systems.map((system) => (
          <Marker
            key={system.id}
            position={[system.latitude, system.longitude]}
          >
            <Popup>
              <strong>{system.id}</strong>
              <br />
              {system.location}
              <br />
              Status: {system.severity}
              <br />
              Health: {system.healthScore}/100
              <br />
              <button onClick={() => onSelectSystem(system)}>
                Open Dashboard
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
}

export default SiteMap;