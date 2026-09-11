import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { LiveMap } from './components/map/LiveMap';
import { VehicleExplorer } from './components/vehicles/VehicleExplorer';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CameraHealthGrid } from './components/camera/CameraHealthGrid';
import { IncidentFeedView } from './components/incidents/IncidentFeedView';
import { AICityAssistantView } from './components/assistant/AICityAssistantView';
import { ResQRoutePanel } from './components/resqroute/ResQRoutePanel';
import { DigitalTwinSimulatorView } from './components/digital_twin/DigitalTwinSimulatorView';
import { CitizenPortalView } from './components/citizen/CitizenPortalView';
import { GovernanceView } from './components/governance/GovernanceView';
import { AlertFeed } from './components/alerts/AlertFeed';
import { ExplainableAIDrawer } from './components/alerts/ExplainableAIDrawer';
import { MobilePatrolApp } from './components/mobile/MobilePatrolApp';
import { LiveVideoMonitoring } from './components/live_video/LiveVideoMonitoring';
import { OCRStudioView } from './components/ocr_studio/OCRStudioView';
import { HowItWorksView } from './components/architecture/HowItWorksView';
import { Camera, VehicleEvent, Alert, Trajectory, ResQRouteScenario } from './types';
import { api } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('live_video');
  const [isMobileMode, setIsMobileMode] = useState<boolean>(false);

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [recentEvents, setRecentEvents] = useState<VehicleEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTrajectory, setActiveTrajectory] = useState<Trajectory | null>(null);
  const [resqScenario, setResqScenario] = useState<ResQRouteScenario | null>(null);
  const [isResqSimulating, setIsResqSimulating] = useState<boolean>(false);

  // Active Alert Explanation Drawer (F-19)
  const [selectedAlertForXAI, setSelectedAlertForXAI] = useState<Alert | null>(null);

  // Live Alert Toast Notification
  const [latestToastAlert, setLatestToastAlert] = useState<Alert | null>(null);

  // 1. Initial Load
  const loadInitialData = async () => {
    try {
      const [cams, alts, resq] = await Promise.all([
        api.getCameras().catch(() => []),
        api.getAlerts().catch(() => []),
        api.getResQRouteScenario().catch(() => null)
      ]);
      setCameras(cams);
      setAlerts(alts);
      setResqScenario(resq);
    } catch (err) {
      console.error('Error loading initial data', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Real-Time WebSocket Hook (Live Events, Alerts, Camera FPS)
  const { isConnected: isWsConnected } = useWebSocket({
    onVehicleEvent: (newEvent) => {
      setRecentEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
    },
    onAlert: (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
      setLatestToastAlert(newAlert);
      setTimeout(() => setLatestToastAlert(null), 5000);
    },
    onCameraStatus: (statusUpdate) => {
      setCameras((prev) =>
        prev.map((c) =>
          c.id === statusUpdate.camera_id
            ? { ...c, fps: statusUpdate.fps, status: statusUpdate.status }
            : c
        )
      );
    }
  });

  // Acknowledge Alert Handler
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const updated = await api.acknowledgeAlert(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
      if (selectedAlertForXAI?.id === alertId) {
        setSelectedAlertForXAI(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trajectory Selection Handler
  const handleSelectVehicleForTrajectory = async (vehicleId: string) => {
    try {
      const traj = await api.getTrajectory(vehicleId);
      setActiveTrajectory(traj);
      setActiveTab('map');
    } catch (e) {
      console.error(e);
    }
  };

  // Trajectory Selection by Plate string
  const handleSelectVehicleForTrajectoryByPlate = async (plate: string) => {
    try {
      const vehs = await api.getVehicles();
      const cleanTarget = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const match = vehs.find((v) => v.plate_number.replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanTarget);
      if (match) {
        const traj = await api.getTrajectory(match.id);
        setActiveTrajectory(traj);
        setActiveTab('map');
      } else {
        setActiveTab('vehicles');
      }
    } catch (e) {
      console.error(e);
      setActiveTab('vehicles');
    }
  };

  const activeAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100 flex flex-col">
      {/* Global Command Center Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMode={isMobileMode}
        setIsMobileMode={setIsMobileMode}
        activeAlertsCount={activeAlertsCount}
        onOpenAlerts={() => setActiveTab('alerts_feed')}
        isWsConnected={isWsConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
        {/* Real-time Toast Alert Notification (F-09) */}
        {latestToastAlert && (
          <div className="fixed top-16 right-6 z-[3000] max-w-md w-full animate-bounce">
            <div className="p-4 rounded-2xl bg-[#0b1626]/95 border-2 border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.5)] backdrop-blur-xl flex items-center justify-between gap-3 font-mono text-xs">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/40">
                  REAL-TIME ALERT DETECTED
                </span>
                <p className="font-extrabold text-white text-sm">{latestToastAlert.plate_text}</p>
                <p className="text-slate-300 text-[11px] line-clamp-1">{latestToastAlert.message}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedAlertForXAI(latestToastAlert);
                  setLatestToastAlert(null);
                }}
                className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs whitespace-nowrap"
              >
                EXPLAIN XAI
              </button>
            </div>
          </div>
        )}

        {/* View Switching */}
        {isMobileMode ? (
          <MobilePatrolApp
            cameras={cameras}
            alerts={alerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            resqScenario={resqScenario}
          />
        ) : (
          <>
            {activeTab === 'live_video' && (
              <LiveVideoMonitoring
                cameras={cameras}
                onTriggerAlert={(newAlert) => {
                  const createdAlert: Alert = {
                    id: `alert-${Date.now()}`,
                    alert_type: newAlert.alert_type || 'emergency_preemption',
                    plate_text: newAlert.plate_text || 'EMERGENCY',
                    camera_id: newAlert.camera_id || 'cam-01',
                    severity: (newAlert.severity as any) || 'critical',
                    message: newAlert.message || 'Emergency Preemption Triggered',
                    acknowledged: false,
                    timestamp: new Date().toISOString()
                  };
                  setAlerts((prev) => [createdAlert, ...prev]);
                  setLatestToastAlert(createdAlert);
                  setTimeout(() => setLatestToastAlert(null), 6000);
                }}
                onSelectVehicleForTracking={handleSelectVehicleForTrajectoryByPlate}
              />
            )}

            {activeTab === 'ocr_studio' && <OCRStudioView />}

            {activeTab === 'how_it_works' && <HowItWorksView />}

            {activeTab === 'map' && (
              <LiveMap
                cameras={cameras}
                recentEvents={recentEvents}
                activeTrajectory={activeTrajectory}
                onSelectVehicle={handleSelectVehicleForTrajectory}
                resqScenario={resqScenario}
                isResqActive={isResqSimulating}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehicleExplorer
                onViewTrajectoryOnMap={(traj) => {
                  setActiveTrajectory(traj);
                  setActiveTab('map');
                }}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsView />}

            {activeTab === 'cameras' && (
              <CameraHealthGrid
                cameras={cameras}
                onRefresh={loadInitialData}
              />
            )}

            {activeTab === 'incidents' && <IncidentFeedView />}

            {activeTab === 'assistant' && <AICityAssistantView />}

            {activeTab === 'resqroute' && (
              <ResQRoutePanel
                scenario={resqScenario}
                isSimulating={isResqSimulating}
                onToggleSimulation={() => setIsResqSimulating(!isResqSimulating)}
                onViewOnMap={() => setActiveTab('map')}
              />
            )}

            {activeTab === 'digital_twin' && <DigitalTwinSimulatorView />}

            {activeTab === 'citizen' && <CitizenPortalView />}

            {activeTab === 'governance' && <GovernanceView />}

            {activeTab === 'alerts_feed' && (
              <AlertFeed
                alerts={alerts}
                onSelectAlert={setSelectedAlertForXAI}
                onAcknowledge={handleAcknowledgeAlert}
              />
            )}
          </>
        )}
      </main>

      {/* Explainable AI Detail Modal (F-19) */}
      <ExplainableAIDrawer
        alert={selectedAlertForXAI}
        onClose={() => setSelectedAlertForXAI(null)}
        onAcknowledge={handleAcknowledgeAlert}
      />
    </div>
  );
};

export default App;
