import {
  Camera, CameraHealth, Vehicle, VehicleEvent, Trajectory,
  Alert, AlertExplanation, Incident, TrafficDashboardSummary,
  CongestionForecast, ResQRouteScenario, DigitalTwinScenario,
  AssistantResponse, SearchCandidate, PublicStats, UserRole
} from '../types';

const API_BASE = '/api/v1';

function getHeaders(role: UserRole = 'authority'): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Role': role
  };
}

export const api = {
  // Cameras
  async getCameras(role?: UserRole): Promise<Camera[]> {
    const res = await fetch(`${API_BASE}/cameras`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch cameras');
    return res.json();
  },

  async getCameraHealth(cameraId: string, role?: UserRole): Promise<CameraHealth> {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/health`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch camera health');
    return res.json();
  },

  async sendHeartbeat(cameraId: string, fps: number, status: string = 'online', role?: UserRole): Promise<Camera> {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/heartbeat`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify({ camera_id: cameraId, fps, status })
    });
    if (!res.ok) throw new Error('Failed to send heartbeat');
    return res.json();
  },

  // Vehicles & Ingestion
  async getVehicles(role?: UserRole): Promise<Vehicle[]> {
    const res = await fetch(`${API_BASE}/vehicles`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return res.json();
  },

  async toggleBlacklist(vehicleId: string, isBlacklisted: boolean, reason?: string, role?: UserRole): Promise<Vehicle> {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/blacklist`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify({ is_blacklisted: isBlacklisted, reason })
    });
    if (!res.ok) throw new Error('Failed to toggle blacklist');
    return res.json();
  },

  async ingestEvent(payload: Partial<VehicleEvent>, role?: UserRole): Promise<VehicleEvent> {
    const res = await fetch(`${API_BASE}/ingestion/event`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to ingest event');
    return res.json();
  },

  // Trajectories
  async getTrajectory(vehicleId: string, role?: UserRole): Promise<Trajectory> {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/trajectory`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch trajectory');
    return res.json();
  },

  async predictTrajectory(vehicleId: string, role?: UserRole): Promise<any> {
    const res = await fetch(`${API_BASE}/predictive/trajectory/${vehicleId}`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to predict trajectory');
    return res.json();
  },

  // Alerts
  async getAlerts(role?: UserRole): Promise<Alert[]> {
    const res = await fetch(`${API_BASE}/alerts`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async acknowledgeAlert(alertId: string, officerName: string = 'Duty Officer', role?: UserRole): Promise<Alert> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify({ acknowledged_by: officerName })
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  async getAlertExplanation(alertId: string, role?: UserRole): Promise<AlertExplanation> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/explanation`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch alert explanation');
    return res.json();
  },

  // Incidents
  async getIncidents(role?: UserRole): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/incidents`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  // Analytics
  async getDashboardSummary(role?: UserRole): Promise<TrafficDashboardSummary> {
    const res = await fetch(`${API_BASE}/analytics/summary`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return res.json();
  },

  async getHeatmapGeoJSON(role?: UserRole): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/heatmap`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch heatmap');
    return res.json();
  },

  async getCongestionForecast(role?: UserRole): Promise<CongestionForecast[]> {
    const res = await fetch(`${API_BASE}/analytics/congestion-forecast`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch congestion forecast');
    return res.json();
  },

  // Vehicle DNA Re-ID & Multi-Modal Search
  async getDNASimilar(vehicleId: string, role?: UserRole): Promise<any[]> {
    const res = await fetch(`${API_BASE}/vehicle-dna/similar?vehicle_id=${vehicleId}`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch DNA similarity');
    return res.json();
  },

  async describeSearch(description: string, color?: string, vehicleType?: string, role?: UserRole): Promise<SearchCandidate[]> {
    const res = await fetch(`${API_BASE}/search/describe`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify({ description, color, vehicle_type: vehicleType })
    });
    if (!res.ok) throw new Error('Failed to perform describe search');
    return res.json();
  },

  // AI City Assistant
  async askAssistant(query: string, role?: UserRole): Promise<AssistantResponse> {
    const res = await fetch(`${API_BASE}/assistant/query`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('Failed to query assistant');
    return res.json();
  },

  // ResQRoute 2.0 & Digital Twin
  async getResQRouteScenario(role?: UserRole): Promise<ResQRouteScenario> {
    const res = await fetch(`${API_BASE}/resqroute/demo-scenario`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch ResQRoute scenario');
    return res.json();
  },

  async optimizeEmergencyCorridor(payload: any, role?: UserRole): Promise<any> {
    const res = await fetch(`${API_BASE}/resqroute/optimize`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to optimize corridor');
    return res.json();
  },

  async getDigitalTwinScenarios(role?: UserRole): Promise<DigitalTwinScenario[]> {
    const res = await fetch(`${API_BASE}/digital-twin/scenarios`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch digital twin scenarios');
    return res.json();
  },

  // Citizen Portal & Governance
  async submitCitizenReport(payload: any, role?: UserRole): Promise<any> {
    const res = await fetch(`${API_BASE}/report`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit report');
    return res.json();
  },

  async getPublicStats(role?: UserRole): Promise<PublicStats> {
    const res = await fetch(`${API_BASE}/public/stats`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch public stats');
    return res.json();
  },

  async getAuditLogs(role?: UserRole): Promise<any[]> {
    const res = await fetch(`${API_BASE}/governance/audit-logs`, { headers: getHeaders(role) });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }
};
