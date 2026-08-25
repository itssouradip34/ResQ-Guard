# ResQ-Guard: City-Wide AI ANPR & Vehicle Intelligence Platform
### *Integrated with ResQRoute 2.0 Emergency Corridor Optimization (Web & Mobile Patrol)*

ResQ-Guard is an engineering-ready, city-wide vehicle intelligence and spatial tracking software platform. It ingests live multi-camera feeds, extracts license plates using dual-engine OCR with confidence fusion, reconstructs multi-camera vehicle trajectories on an interactive GIS map, and detects hotlisted, stolen, or cloned vehicles with Explainable-AI (XAI) alerting.

---

## 🌟 Key Features (Releases 0 – 4)

| Feature ID | Name | Description | Priority |
| :--- | :--- | :--- | :--- |
| **F-01** | **Camera Ingestion & Registry** | Live RTSP / looped video ingestion, lat/lng spatial registry, and heartbeat monitoring. | **P0 (Must)** |
| **F-02** | **Vehicle Detection & Tracking** | YOLOv8 multi-class detection with persistent ByteTrack tracking IDs. | **P0 (Must)** |
| **F-03 & F-04** | **Dual-Engine OCR & Fusion** | PaddleOCR + EasyOCR fusion, Indian plate regex validator, and `needs_review` flagging. | **P0 / P1** |
| **F-05** | **Event Ingestion API** | High-throughput `POST /api/v1/ingestion/event` with fuzzy plate matching ($\ge 90\%$). | **P0 (Must)** |
| **F-06** | **Trajectory Reconstruction** | Spatial-temporal aggregation into GeoJSON multi-point / line-string trajectories. | **P0 (Must)** |
| **F-07** | **GIS Live Map Command Center** | Interactive dark command map with `< 2s` live vehicle pins via WebSocket. | **P0 (Must)** |
| **F-08** | **Traffic Analytics Dashboard** | Real-time hourly volume series, vehicle breakdown, peak hour metrics, and zone heatmaps. | **P0 (Must)** |
| **F-09** | **Blacklist & Alerting Engine** | Real-time alert push for hotlist targets and restricted municipal geofences. | **P0 (Must)** |
| **F-10** | **Camera Health Monitoring** | Live FPS telemetry, uptime percentage, and automated failover detection. | **P1 (Should)** |
| **F-11** | **Vehicle DNA / Visual Re-ID** | 8D visual embeddings + cosine distance search for obscured/unreadable plates. | **P1 (Should)** |
| **F-12** | **AI Rule-Based Incidents** | Automated detection for stalled vehicles, wrong-way driving, and rapid collision deceleration. | **P1 (Should)** |
| **F-13 & F-14** | **Predictive AI Engine** | Markov transition matrix for next-camera prediction + rolling congestion forecasting. | **P2 (Could)** |
| **F-15** | **AI City Assistant** | Natural-language query interface translating questions into safe, audited SQL queries. | **P2 (Could)** |
| **F-16** | **Privacy Governance** | Role-based plate masking (`MP04 XX ****`), SHA-256 hashing, and security audit logging. | **P2 (Could)** |
| **F-17** | **Fake & Cloned Plate Detection** | Flags registry type mismatches and impossible travel anomalies ($> 160$ km/h). | **P2 (Could)** |
| **F-18** | **Multi-Modal Vehicle Search** | Free-text search ("white SUV near Central Zone") with candidate ranking & snapshots. | **P2 (Could)** |
| **F-19** | **Explainable-AI Alert Panel** | Human-readable breakdown of triggered rules, confidence weights, and verified evidence. | **P1 (Should)** |
| **F-20** | **Citizen Transparency Portal** | Crowdsourced citizen hazard reporting + anonymized public safety statistics. | **P3 (Stub)** |
| **F-21 & F-22** | **ResQRoute 2.0 Corridor** | Congestion-weighted green wave emergency ambulance routing ($-51.7\%$ travel time). | **P3 (Stub)** |
| **F-23** | **Digital Twin What-If Simulator** | Simulates junction signal changes and lane closures with before/after metrics. | **P3 (Stub)** |

---

## 🚀 Quickstart & Execution Guide

### Option 1: One-Command Docker Compose (Full Stack)
```bash
docker compose up --build
```
- **Web Command Center & Mobile App**: `http://localhost:5173`
- **FastAPI Backend & Interactive Swagger Docs**: `http://localhost:8000/docs`

---

### Option 2: Local Development Setup

#### 1. Backend (FastAPI + Python 3.10+)
```bash
cd backend
python -m pip install -r requirements.txt
python run_backend.py
```
*Backend runs on `http://127.0.0.1:8000` with automated startup seeding and background stream runner.*

#### 2. Frontend (React 19 + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

#### 3. Run Backend Test Suite
```bash
python -m pytest backend/tests/
```

---

## 🎬 Scripted Live Demo Guide (PRD Section 11)

Follow these exact steps for the staged presentation:

1. **Boot Stack & Ingestion Ready**:
   - Open `http://localhost:5173`.
   - Observe 6 active camera nodes on the GIS Command Map and live WebSocket connection pill (`LIVE FEED`).

2. **Live Sighting & Pin Update (< 2s)**:
   - Use the **Demo Sighting Injector** in the bottom-left of the GIS Map to trigger a sighting for plate `DL01AB1234` on `Camera 01`.
   - Notice the live pin appears on the map within 2 seconds without page refresh.

3. **Multi-Camera Trajectory Reconstruction**:
   - Click the vehicle pin and select **"Reconstruct Trajectory"** (or switch to the **Vehicle Intelligence** tab).
   - Observe the stitched polyline path connecting checkpoints across the city with timestamps and recorded speeds.

4. **Blacklist Hit & Explainable AI (XAI)**:
   - Inject a sighting for hotlisted target `DL01AB1234` or `MH02CD5678`.
   - A real-time red alert toast fires immediately. Click **"Explain (XAI)"** to inspect the Plain-Language Reason, triggered rules, and verified snapshot crop.

5. **Cloned Plate / Impossible Travel Detection (F-17)**:
   - Observe the `fake_plate_suspected` alert triggered when `MH02CD5678` is sighted across two distant cameras in an implausible timeframe.

6. **Traffic Flow Analytics & Congestion Forecast (F-08 & F-14)**:
   - Open the **Traffic Analytics** tab to view real-time hourly volume series, vehicle type distribution, and predictive 15/30/60-min forecasts.

7. **Camera Outage Simulation (F-10)**:
   - Open the **Camera Health** tab. Click **"Simulate Outage (Kill Camera)"** on Camera 01.
   - The status flips immediately to `OFFLINE` and is logged in the health telemetry.

8. **AI City Assistant (F-15)**:
   - Open the **City Assistant** tab. Click one of the suggested queries (e.g., *"How many vehicles crossed Central Zone today?"*).
   - View the synthesized response along with audited, whitelisted SQL and auto-generated chart data.

9. **ResQRoute 2.0 Emergency Green Wave (F-21 & F-22)**:
   - Open the **ResQRoute 2.0** tab. Click **"Dispatch Emergency Ambulance"**.
   - Watch the animated ambulance navigate the green corridor on the GIS map while traffic signals lock green, saving **51.7% travel time (-13.7 min)**.

10. **Mobile Patrol Mode**:
    - Click the **"Patrol App"** button in the top navigation to switch to the mobile viewport.
    - Test the **Field OCR Plate Scanner** and **Field Alert Acknowledgment** on patrol.

---

## 📡 API Contract Summary

All endpoints conform to OpenAPI specifications accessible at `/docs`:

- `GET  /api/v1/cameras` — List all registered cameras
- `POST /api/v1/ingestion/event` — High-speed ANPR detection ingestion
- `GET  /api/v1/vehicles/{id}/trajectory` — Stitched multi-camera path GeoJSON
- `GET  /api/v1/analytics/summary` — City-wide dashboard metrics
- `GET  /api/v1/analytics/heatmap` — Zone density GeoJSON polygons
- `GET  /api/v1/alerts` — Real-time filterable alert feed
- `GET  /api/v1/alerts/{id}/explanation` — Structured Explainable-AI breakdown
- `GET  /api/v1/vehicle-dna/similar` — Visual Re-ID similarity search
- `POST /api/v1/search/describe` — Natural language vehicle search
- `POST /api/v1/assistant/query` — AI City Assistant natural query
- `GET  /api/v1/resqroute/demo-scenario` — Emergency green wave corridor data
- `GET  /api/v1/digital-twin/scenarios` — What-if junction simulations
- `POST /api/v1/report` — Citizen hazard reporting
- `GET  /api/v1/public/stats` — Anonymized public safety statistics
