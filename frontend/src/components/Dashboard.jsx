import DashboardHeader from "./DashboardHeader.jsx";
import Sensor from "./Sensor.jsx";
import LatencyMonitor from "./LatencyMonitor.jsx";
import WeatherCard from "./WeatherCard.jsx";
import Control from "./Control.jsx";
import ActivityLog from "./Log.jsx";
import ChatBox from "./ChatBox.jsx";
import SystemErrors from "./SystemError.jsx";

function Dashboard({
  selectedSystem,
  currentUser,
  role,
  isOperator,
  status,
  latency,
  sensorData,
  weather,
  logs = [],
  chatOpen,
  unreadCount,
  getWeatherImpact,
  onBackToFleet,
  onOpenChat,
  onCloseChat,
  onDownloadReport,
  onLogout,
  onToggleActuator,
  onEmergencyStop,
  onResetEmergencyStop,
  emergencyStopActive,
  actuatorStates,
  stateSynced,
  systemErrors = [],
}) {
  return (
    <div className="page">
      <DashboardHeader
        selectedSystem={selectedSystem}
        role={role}
        isOperator={isOperator}
        onBackToFleet={onBackToFleet}
        onOpenChat={onOpenChat}
        unreadCount={unreadCount}
        onDownloadReport={onDownloadReport}
        onLogout={onLogout}
      />

      {isOperator && unreadCount > 0 && (
        <section className="status-banner warning">
          New message from client {selectedSystem.id}
        </section>
      )}

      <section className={`status-banner ${status.toLowerCase()}`}>
        System Status: {status} | Latency: {latency} ms
      </section>

      <main className="dashboard">
        <Sensor sensorData={sensorData} />

        <LatencyMonitor latency={latency} />

        <WeatherCard
          weather={weather}
          selectedSystem={selectedSystem}
          getWeatherImpact={getWeatherImpact}
        />

        <Control
          isOperator={isOperator}
          status={status}
          actuatorStates={actuatorStates}
          emergencyStop={emergencyStopActive}
          stateSynced={stateSynced}
          onToggle={onToggleActuator}
          onEmergencyStop={onEmergencyStop}
          onResetEmergencyStop={onResetEmergencyStop}
        />

        {isOperator && <ActivityLog logs={logs} />}

        {isOperator && <SystemErrors errors={systemErrors} />}
      </main>

      <ChatBox
        systemId={selectedSystem.id}
        currentUser={currentUser}
        isOpen={chatOpen}
        onClose={onCloseChat}
      />
    </div>
  );
}

export default Dashboard;