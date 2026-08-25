export type UserRole = 'authority' | 'analyst';

export interface Camera {
  id: string;
  name: string;
  video_path?: string;
  rtsp_url?: string;
  latitude: float;
  longitude: float;
  zone: string;
  road_segment?: string;
  status: 'online' | 'degraded' | 'offline';
  fps: number;
  last_heartbeat?: string;
  created_at?: string;
}

export type float = number;

export interface CameraHealth {
  camera_id: string;
  camera_name: string;
  current_status: string;
  current_fps: number;
  uptime_percentage: number;
  recent_fps_history: Array<{
    time: string;
    fps: number;
    status: string;
  }>;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  plate_hash: string;
  vehicle_type: string;
  color: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  needs_review: boolean;
  dna_embedding?: number[];
  first_seen: string;
  last_seen: string;
}

export interface VehicleEvent {
  id: string;
  vehicle_id: string;
  camera_id: string;
  camera_name?: string;
  plate_text: string;
  confidence: number;
  fused_confidence: number;
  plate_format_valid: boolean;
  needs_review: boolean;
  bbox?: number[];
  vehicle_type: string;
  color: string;
  speed_estimate: number;
  direction_vector?: any;
  ocr_engine_scores?: {
    paddle_ocr?: { text: string; conf: number };
    easy_ocr?: { text: string; conf: number };
    char_agreement?: number;
    format_valid?: boolean;
  };
  snapshot_url?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface Trajectory {
  id: string;
  vehicle_id: string;
  plate_number: string;
  vehicle_type: string;
  color: string;
  start_time: string;
  end_time: string;
  total_distance_km: number;
  path_geojson: {
    type: string;
    geometry: {
      type: string;
      coordinates: number[][] | number[];
    };
    properties: Record<string, any>;
  };
  camera_sequence: Array<{
    camera_id: string;
    camera_name: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed_estimate: number;
    confidence: number;
  }>;
  updated_at: string;
}

export interface Alert {
  id: string;
  alert_type: 'blacklist_hit' | 'suspicious_route' | 'fake_plate_suspected';
  vehicle_id?: string;
  plate_text?: string;
  camera_id?: string;
  camera_name?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  timestamp: string;
  explanation_summary?: string;
}

export interface AlertExplanation {
  alert_id: string;
  summary: string;
  rules_triggered: Array<{
    rule_name: string;
    status: string;
    condition?: string;
    confidence?: number;
    weight?: string;
    evidence?: string;
  }>;
  contributing_factors?: Record<string, any>;
  evidence_urls?: string[];
  created_at: string;
}

export interface Incident {
  id: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  camera_id: string;
  camera_name?: string;
  incident_type: 'stopped_too_long' | 'wrong_direction' | 'sudden_deceleration';
  confidence: number;
  severity: string;
  details?: string;
  evidence_url?: string;
  created_at: string;
}

export interface TrafficDashboardSummary {
  total_vehicles_today: number;
  peak_hour: string;
  peak_volume: number;
  top_zone_by_volume: string;
  top_zone_count: number;
  active_cameras_count: number;
  active_alerts_count: number;
  vehicle_type_breakdown: Record<string, number>;
  hourly_series: Array<{
    time_bucket: string;
    volume: number;
    by_type: Record<string, number>;
    by_camera: Record<string, number>;
  }>;
  avg_speed_kmh: number;
}

export interface CongestionForecast {
  road_segment_id: string;
  road_segment_name: string;
  zone: string;
  predicted_time: string;
  predicted_level: 'low' | 'medium' | 'high' | 'severe';
  predicted_volume: number;
  speed_impact_kmh: number;
}

export interface ResQRouteScenario {
  id: string;
  name: string;
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_type: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  normal_route: {
    distance_km: number;
    estimated_time_min: number;
    average_speed_kmh: number;
    congestion_delay_min: number;
    signals_encountered: number;
    signals_delayed: number;
    waypoints: number[][];
  };
  optimized_resq_corridor: {
    distance_km: number;
    estimated_time_min: number;
    average_speed_kmh: number;
    congestion_delay_min: number;
    signals_encountered: number;
    signals_cleared_green: number;
    time_saved_min: number;
    time_saved_pct: number;
    waypoints: number[][];
    cleared_intersections?: Array<{ name: string; status: string; camera_id: string }>;
  };
}

export interface DigitalTwinScenario {
  id: string;
  junction_id: string;
  junction_name: string;
  name: string;
  description: string;
  current_metrics: {
    avg_delay_sec: number;
    queue_length_m: number;
    hourly_throughput: number;
    congestion_index: number;
  };
  simulated_metrics: {
    avg_delay_sec: number;
    queue_length_m: number;
    hourly_throughput: number;
    congestion_index: number;
  };
  delta_percentage: {
    delay_reduction: number;
    queue_reduction: number;
    throughput_gain: number;
  };
  recommendation: string;
}

export interface AssistantResponse {
  query: string;
  answer: string;
  generated_sql?: string;
  chart_type?: 'bar' | 'line' | 'pie' | 'metric';
  chart_data?: any;
  confidence: number;
  sources: string[];
}

export interface SearchCandidate {
  vehicle_id: string;
  plate_number: string;
  vehicle_type: string;
  color: string;
  last_camera: string;
  last_seen: string;
  match_score: number;
  reasons: string[];
  snapshot_url?: string;
}

export interface PublicStats {
  monitored_vehicles_today: number;
  active_surveillance_zones: number;
  corridor_interventions_count: number;
  incident_resolutions_rate: number;
  safety_index_score: number;
  masked_recent_activity: Array<{
    masked_plate: string;
    vehicle_type: string;
    timestamp: string;
    status: string;
  }>;
}
