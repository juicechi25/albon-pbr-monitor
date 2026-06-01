function Control({
  isOperator,
  status,
  actuatorStates = {},
  emergencyStop,
  stateSynced,
  onToggle,
  onEmergencyStop,
  onResetEmergencyStop,
}) {
  const controlsDisabled =
    !isOperator || status !== "ONLINE" || emergencyStop || !stateSynced;

  return (
    <section className="card">
      <h2>Actuator Control</h2>

      {!isOperator && (
        <p className="warning-text">
          View-only role. Control buttons are disabled.
        </p>
      )}

      {!stateSynced && isOperator && (
        <p className="warning-text">
          Waiting for backend state confirmation. Controls are disabled.
        </p>
      )}

      {emergencyStop && (
        <p className="warning-text">
          CRITICAL: Emergency stop is active. System is locked.
        </p>
      )}

      {!emergencyStop ? (
        <button
          className="emergency-btn"
          disabled={!isOperator}
          onClick={onEmergencyStop}
        >
          EMERGENCY STOP
        </button>
      ) : (
        <button
          className="secondary-btn"
          disabled={!isOperator}
          onClick={onResetEmergencyStop}
        >
          Reset Emergency Stop
        </button>
      )}

      <div className="control-row">
        <span>Pump</span>
        <button
          disabled={controlsDisabled}
          onClick={() => onToggle("pump", actuatorStates.pump)}
        >
          {actuatorStates.pump ? "Turn Pump Off" : "Turn Pump On"}
        </button>
      </div>

      <div className="control-row">
        <span>LED Light Rods</span>
        <button
          disabled={controlsDisabled}
          onClick={() => onToggle("lights", actuatorStates.lights)}
        >
          {actuatorStates.lights ? "Turn Lights Off" : "Turn Lights On"}
        </button>
      </div>

      <div className="state-box">
        <p>Pump: {actuatorStates.pump ? "ON" : "OFF"}</p>
        <p>Lights: {actuatorStates.lights ? "ON" : "OFF"}</p>
        <p>Emergency Stop: {emergencyStop ? "ON" : "OFF"}</p>
      </div>
    </section>
  );
}

export default Control;