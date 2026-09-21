# Product Requirements Document (PRD)
# City-Wide AI ANPR & Vehicle Intelligence Platform

| Field | Value |
|---|---|
| Doc type | Product Requirements Document (Engineering-ready) |
| Prepared for | Autonomous/agentic build (Antigravity) + human team |
| Source architecture | `ANPR_Platform_Architecture.md` (v1) |
| Status | Approved for build |
| Owner | Lead Architect |
| Version | 1.0 |

> **How to use this PRD (for Antigravity/agentic build):** Every feature below has a stable ID (`F-##`), a MoSCoW priority, explicit **functional requirements** (`FR-##.#`), and **acceptance criteria** written as checkable statements. Build strictly in **Release order (Section 6)**. Do not build a feature whose dependencies (listed per-feature) aren't done. Do not modify the core schema (Section 8.1) when implementing anything marked P1/P2 — only add new tables/columns as specified.

---

## 1. Product Vision

Build a **modular, city-wide vehicle intelligence platform** that ingests live/recorded camera feeds, extracts license plates with high-confidence OCR, reconstructs vehicle trajectories across multiple cameras on a GIS map, and surfaces real-time alerts for blacklisted or suspicious vehicles — while laying an extensible foundation for predictive analytics, incident detection, emergency response, and citizen-facing intelligence, all on a free/open-source stack that runs fully offline in a demo environment and scales to a real cloud deployment without architectural rewrite.

## 2. Goals & Success Metrics

| Goal | Metric | Target (MVP demo) |
|---|---|---|
| Accurate ANPR | Plate read accuracy (fused OCR) on demo footage | ≥ 90% correct full-plate reads |
| Real-time responsiveness | Event → map pin latency | < 2 seconds |
| Trajectory correctness | Correctly stitched multi-camera path for a test vehicle | 100% on scripted demo scenario |
| Alerting reliability | Blacklist hit → alert fired | 100%, < 3 seconds |
| System resilience | Full stack boots and runs demo | Single `docker compose up`, zero internet dependency |
| Modularity | Add one optional feature | Zero changes to ingestion API or core schema |

## 3. Target Users / Personas

| Persona | Needs |
|---|---|
| **Traffic Police Control Room Operator** | Real-time map, alerts, search by plate, incident feed |
| **Investigating Officer** | Vehicle timeline/history, trajectory replay, visual re-ID search |
| **Traffic Planning Authority** | Aggregate analytics, congestion trends, zone heatmaps |
| **Emergency Dispatch** | Fastest-corridor routing for ambulances/fire (ResQRoute) |
| **City Administrator / Judge (SIH)** | Dashboard overview, "what-if" simulation, privacy/governance assurance |
| **Citizen (Phase 3, optional)** | Report suspicious vehicles, view public safety stats (anonymized) |

## 4. Scope

**In scope (this PRD):** everything in Section 6 (F-01 through F-20), including net-new innovative features (F-17–F-20).
**Out of scope (explicitly):** live integration with national vehicle registries (VAHAN/NCRB), real signal-control hardware integration, production-grade legal e-challan issuance, live payment/toll processing. These are represented only as mocked/stubbed interfaces.

---

## 5. Feature Inventory & Prioritization (MoSCoW)

| ID | Feature | Priority | Source |
|---|---|---|---|
| F-01 | Camera ingestion & registry | P0 (Must) | Core infra |
| F-02 | Vehicle detection & multi-object tracking | P0 (Must) | Requirement #1 |
| F-03 | License plate detection & dual-engine OCR | P0 (Must) | Requirement #1 |
| F-04 | OCR confidence fusion | P1 (Should) | Requirement #7 |
| F-05 | Event ingestion API & persistence | P0 (Must) | Core infra |
| F-06 | Multi-camera trajectory reconstruction | P0 (Must) | Requirement #2 |
| F-07 | GIS live map visualization | P0 (Must) | Requirement #3 |
| F-08 | City-wide traffic analytics dashboard | P0 (Must) | Requirement #4 |
| F-09 | Blacklist & suspicious-route alerting | P0 (Must) | Requirement #5 |
| F-10 | Camera health monitoring | P1 (Should) | Requirement #15 |
| F-11 | Vehicle DNA / visual re-identification | P1 (Should) | Requirement #6 |
| F-12 | AI rule-based incident detection | P1 (Should) | Requirement #10 |
| F-13 | Predictive vehicle trajectory | P2 (Could) | Requirement #8 |
| F-14 | Predictive congestion forecasting | P2 (Could) | Requirement #9 |
| F-15 | AI City Assistant (NL query) | P2 (Could) | Requirement #13 |
| F-16 | Privacy-preserving analytics & governance | P2 (Could) | Requirement #16 |
| F-17 | **Fake/tampered/stolen-plate detection** *(new)* | P2 (Could) | Innovative addition |
| F-18 | **Multi-modal natural-language vehicle search** *(new)* | P2 (Could) | Innovative addition |
| F-19 | **Explainable-AI alert panel** *(new)* | P1 (Should) | Innovative addition |
| F-20 | **Citizen reporting + public transparency portal** *(new)* | P3 (Won't, this cycle) | Innovative addition |
| F-21 | ResQRoute emergency response integration | P3 (Won't, stub only) | Requirement #11 |
| F-22 | Emergency corridor optimization | P3 (Won't, stub only) | Requirement #12 |
| F-23 | Digital twin / what-if traffic simulation | P3 (Won't, stub only) | Requirement #14 |

---

## 6. Release Plan (build order — do not reorder)

- **Release 0 — Foundation:** infra scaffold, DB schema, Docker Compose skeleton, seed data
- **Release 1 — Core MVP (P0):** F-01 → F-09 — must be fully demo-able end to end
- **Release 2 — Should-Have (P1):** F-04, F-10, F-11, F-12, F-19
- **Release 3 — Could-Have (P2):** F-13, F-14, F-15, F-16, F-17, F-18
- **Release 4 — Stubs (P3):** F-20, F-21, F-22, F-23 (API contract + placeholder UI only)

---

## 7. Detailed Feature Requirements

### F-01 · Camera Ingestion & Registry — P0
**Dependencies:** none (foundation)
**User story:** As an operator, I need every camera registered with a location and status so events can be geolocated and camera outages are visible.

- **FR-01.1** System shall support registering a camera with: name, RTSP URL or local video file path, lat/lng, road segment reference.
- **FR-01.2** Each camera shall emit a heartbeat (status + FPS) at a configurable interval (default 10s).
- **FR-01.3** Seed script shall load ≥3 demo cameras from `sample-data/seed-cameras.json` pointing at looped local video files (offline mode).

**Acceptance criteria:**
- [ ] `GET /api/v1/cameras` returns all registered cameras with live status.
- [ ] A camera with no heartbeat for >30s is marked `offline` automatically.

---

### F-02 · Vehicle Detection & Multi-Object Tracking — P0
**Dependencies:** F-01

- **FR-02.1** Each camera process shall run YOLOv8 to detect vehicles (car/bus/truck/motorbike classes) per frame.
- **FR-02.2** ByteTrack shall assign a persistent `track_id` per vehicle within a single camera's field of view.
- **FR-02.3** Detection shall run at ≥5 FPS on demo hardware (CPU acceptable for MVP).

**Acceptance criteria:**
- [ ] Bounding boxes + track IDs visible in a debug overlay window/log for at least one sample video.
- [ ] Track IDs remain stable while a vehicle is continuously visible (no more than 1 ID-switch per 10s in test clip).

---

### F-03 · License Plate Detection & Dual-Engine OCR — P0
**Dependencies:** F-02

- **FR-03.1** For each tracked vehicle, crop the plate region via a plate-detector model or ROI heuristic.
- **FR-03.2** Run **both** PaddleOCR and EasyOCR on each crop.
- **FR-03.3** Normalize output (uppercase, strip whitespace/special chars) and validate against an Indian plate-format regex (state-code aware).
- **FR-03.4** Persist raw OCR outputs from both engines plus per-engine confidence in `ocr_engine_scores` JSONB.

**Acceptance criteria:**
- [ ] Given a clear demo plate crop, both engines return output and it is stored.
- [ ] Invalid-format strings are flagged `plate_format_valid = false` but still stored (never silently dropped).

---

### F-04 · OCR Confidence Fusion — P1
**Dependencies:** F-03

- **FR-04.1** Compute a fused confidence score using: (a) per-engine confidence, (b) char-level agreement between engines, (c) regex format validity bonus.
- **FR-04.2** If engines disagree beyond a threshold, flag event `needs_review = true`.
- **FR-04.3** Expose fused score on every event and vehicle record.

**Acceptance criteria:**
- [ ] Agreement between engines → confidence ≥ 0.85.
- [ ] Disagreement → `needs_review` flag set and surfaced in UI.

---

### F-05 · Event Ingestion API & Persistence — P0
**Dependencies:** F-03

- **FR-05.1** `POST /api/v1/ingestion/event` accepts a validated event payload (camera_id, plate_text, confidence, bbox, vehicle_type, color, timestamp, snapshot).
- **FR-05.2** Backend performs fuzzy plate match against existing `vehicles`; creates new vehicle record if no match ≥ 90% similarity.
- **FR-05.3** Event persisted with a PostGIS `POINT` derived from the camera's registered location.
- **FR-05.4** On successful persist, publish to Redis channel `vehicle_events`.

**Acceptance criteria:**
- [ ] Duplicate plate across 2 cameras resolves to the same `vehicle_id`.
- [ ] Malformed payload returns HTTP 422 with field-level errors, never a silent failure.

---

### F-06 · Multi-Camera Trajectory Reconstruction — P0
**Dependencies:** F-05

- **FR-06.1** A background worker groups a vehicle's events within a rolling time window (default 4 hours) ordered by `event_time`.
- **FR-06.2** Worker builds a PostGIS `LINESTRING` connecting sighting points in order and upserts into `trajectories`.
- **FR-06.3** `GET /api/v1/vehicles/{id}/trajectory` returns the path as GeoJSON.

**Acceptance criteria:**
- [ ] Scripted demo vehicle appearing at Camera A then Camera B produces one trajectory record linking both, in correct time order.
- [ ] Trajectory GeoJSON renders as a connected line on the frontend map.

---

### F-07 · GIS Live Map Visualization — P0
**Dependencies:** F-05, F-06

- **FR-07.1** Frontend renders all cameras as markers on a MapLibre/OSM map.
- **FR-07.2** New vehicle events push a live pin via WebSocket (`/ws/live-feed`) within 2 seconds of ingestion.
- **FR-07.3** Clicking a vehicle pin shows plate, type, color, confidence, and a "view trajectory" action rendering the stitched path.
- **FR-07.4** Map tiles must work fully offline (pre-cached MBTiles or local tile server).

**Acceptance criteria:**
- [ ] Live demo: playing a seeded video produces a visible new pin on the map within 2s, no manual refresh.
- [ ] Map is usable with no internet connection.

---

### F-08 · City-Wide Traffic Analytics Dashboard — P0
**Dependencies:** F-05

- **FR-08.1** Aggregation worker computes rolling counts: vehicles/hour per camera, per zone, per vehicle type.
- **FR-08.2** `GET /api/v1/analytics/traffic-volume` returns time-bucketed series.
- **FR-08.3** `GET /api/v1/analytics/heatmap` returns zone-level density as GeoJSON for map overlay.
- **FR-08.4** Dashboard displays: total vehicles today, peak hour, top zone by volume, vehicle-type breakdown chart.

**Acceptance criteria:**
- [ ] Dashboard numbers update within 60s of new events being ingested.
- [ ] Heatmap visibly differentiates high vs. low traffic zones on the demo map.

---

### F-09 · Blacklist & Suspicious-Route Alerting — P0
**Dependencies:** F-05

- **FR-09.1** `POST /api/v1/vehicles/{id}/blacklist` adds/removes a vehicle from the blacklist with a reason.
- **FR-09.2** On every new event, alert engine checks `vehicle.is_blacklisted`; if true, create an `alerts` row (`alert_type = blacklist_hit`) and publish to Redis `alerts` channel.
- **FR-09.3** Route-rule engine checks whether the event's camera/zone is in a configured restricted geofence for that vehicle category; if so, raise `alert_type = suspicious_route`.
- **FR-09.4** Alerts push live to frontend via WebSocket and appear in `GET /api/v1/alerts` (filterable, paginated).
- **FR-09.5** Operator can acknowledge an alert (`POST /api/v1/alerts/{id}/acknowledge`).

**Acceptance criteria:**
- [ ] Seeded blacklist + scripted demo video guarantees a live alert fires on stage, <3s from event to UI toast.
- [ ] Acknowledged alerts are visually distinguished from open alerts.

---

### F-10 · Camera Health Monitoring — P1
**Dependencies:** F-01

- **FR-10.1** `camera_health_logs` records FPS + status on every heartbeat.
- **FR-10.2** `GET /api/v1/cameras/{id}/health` returns uptime % and recent FPS history.
- **FR-10.3** Frontend `/camera-health` shows a grid of all cameras color-coded by status (online/degraded/offline).

**Acceptance criteria:**
- [ ] Killing a demo camera container flips its status to `offline` within 30s, visible in UI without refresh.

---

### F-11 · Vehicle DNA / Visual Re-Identification — P1
**Dependencies:** F-02, F-05

- **FR-11.1** For each tracked vehicle, compute a lightweight visual embedding (color histogram + MobileNet/OSNet feature vector).
- **FR-11.2** Store embedding in `vehicles.dna_embedding` (pgvector).
- **FR-11.3** `GET /api/v1/vehicle-dna/similar?vehicle_id=...` returns top-N visually similar vehicles by cosine distance — useful when plate is unreadable/obscured.

**Acceptance criteria:**
- [ ] Given a vehicle with an obscured/unread plate, the similarity search still returns plausible visual matches from the same demo dataset.

---

### F-12 · AI Rule-Based Incident Detection — P1
**Dependencies:** F-06

- **FR-12.1** Detect "stopped too long" (no position change > N seconds in a non-parking zone).
- **FR-12.2** Detect "wrong-direction" (movement vector opposed to road segment's tagged direction).
- **FR-12.3** Detect "sudden deceleration" (speed_estimate drop beyond threshold between consecutive events).
- **FR-12.4** Each detection creates an `incidents` row with type, confidence, and evidence (linked snapshot).
- **FR-12.5** `GET /api/v1/incidents` surfaces a live feed on `/incidents`.

**Acceptance criteria:**
- [ ] Scripted demo clip with a deliberately "stalled" vehicle produces a stopped-vehicle incident within the configured threshold window.

---

### F-13 · Predictive Vehicle Trajectory — P2
**Dependencies:** F-06

- **FR-13.1** Build a Markov transition matrix over historical camera-to-camera movements per vehicle type/zone.
- **FR-13.2** `GET /api/v1/predictive/trajectory/{vehicle_id}` returns top-3 likely next camera/zone with probability.

**Acceptance criteria:**
- [ ] Given ≥20 seeded historical transitions A→B, prediction for a vehicle currently at A ranks B in top-3.

---

### F-14 · Predictive Congestion Forecasting — P2
**Dependencies:** F-08

- **FR-14.1** Rolling-window regression (or Prophet) forecasts event density per `road_segment` for next 15/30/60 minutes.
- **FR-14.2** `GET /api/v1/predictive/congestion` returns forecast level (low/med/high) per segment.
- **FR-14.3** Frontend `/predictive` overlays forecast as a colored line layer on the map.

**Acceptance criteria:**
- [ ] Forecast output updates on a schedule (≥ every 5 min) and is visibly distinct from current/live congestion coloring.

---

### F-15 · AI City Assistant (Natural-Language Query) — P2
**Dependencies:** F-08

- **FR-15.1** `POST /api/v1/assistant/query` accepts a natural-language question.
- **FR-15.2** Backend translates to SQL against a **read-only, whitelisted view** (never raw tables, never arbitrary SQL execution).
- **FR-15.3** Every query + generated SQL + response logged to `assistant_query_logs` for auditability.
- **FR-15.4** Response includes both a natural-language answer and, where applicable, a chart/table.

**Acceptance criteria:**
- [ ] "How many vehicles crossed Zone X today?" returns a correct numeric answer sourced from `analytics` views.
- [ ] Any attempt to reference a non-whitelisted table/column is rejected with a safe error, not executed.

---

### F-16 · Privacy-Preserving Analytics & Governance — P2
**Dependencies:** F-05, F-08

- **FR-16.1** Introduce `role` on API auth context: `authority` (full plate access) vs `analyst` (masked plates only).
- **FR-16.2** Analytics/aggregation views use `plate_hash` (one-way hash), never raw plate text.
- **FR-16.3** Every raw-plate lookup and blacklist mutation is written to `audit_log` (who, when, what).
- **FR-16.4** Public-facing endpoints (if any, Phase 3) never expose raw plate numbers, only masked format (`MP04 XX ****`).

**Acceptance criteria:**
- [ ] An `analyst`-role API call attempting to fetch a raw plate returns masked data.
- [ ] `audit_log` contains an entry for every blacklist change made during the demo.

---

### F-17 · Fake / Tampered / Stolen-Plate Detection — P2 *(new innovative feature)*
**Dependencies:** F-04, F-11
**Rationale:** A very common real-world evasion tactic is a mismatched, obscured, or duplicated plate. Cheap to add given existing DNA embeddings.

- **FR-17.1** Flag `plate_vehicle_type_mismatch`: OCR'd plate's registered vehicle type (from a seeded mock registry) doesn't match the CV-detected vehicle type/color.
- **FR-17.2** Flag `duplicate_plate_multi_location`: same plate detected at two geographically distant cameras within an implausibly short time window (impossible-travel check using PostGIS distance/time).
- **FR-17.3** Flag `plate_visual_mismatch`: same plate text but Vehicle DNA embedding differs significantly from that plate's historical embedding cluster (possible clone/tamper).
- **FR-17.4** All flags raise an `alert_type = fake_plate_suspected` with the specific sub-reason.

**Acceptance criteria:**
- [ ] Seeded "impossible travel" scenario (same plate, two far-apart cameras, 2 minutes apart) triggers `duplicate_plate_multi_location`.

---

### F-18 · Multi-Modal Natural-Language Vehicle Search — P2 *(new innovative feature)*
**Dependencies:** F-11, F-15
**Rationale:** Investigators often don't have a full plate — just a description ("white SUV near City Mall around 6pm").

- **FR-18.1** `POST /api/v1/search/describe` accepts free text describing color/type/time-window/rough location.
- **FR-18.2** Parses attributes (color, type, time range, zone) and filters `vehicle_events` accordingly, ranked by Vehicle DNA similarity if a reference image is also provided.
- **FR-18.3** Returns a ranked candidate list with snapshot thumbnails.

**Acceptance criteria:**
- [ ] Query "white SUV near Camera-2 this afternoon" returns only white/SUV-type events from Camera-2's zone in the correct time range.

---

### F-19 · Explainable-AI Alert Panel — P1 *(new innovative feature)*
**Dependencies:** F-09, F-12
**Rationale:** Judges and real operators trust alerts more when the "why" is visible — very low build cost, high credibility payoff.

- **FR-19.1** Every alert stores a structured `explanation` object: rule(s) triggered, contributing scores/thresholds, and the evidence snapshot(s).
- **FR-19.2** Frontend alert detail view renders the explanation as a human-readable breakdown (not just a raw JSON dump).

**Acceptance criteria:**
- [ ] Opening any alert shows a plain-language reason (e.g., "Vehicle MP04AB1234 is blacklisted for [reason]; detected at Camera-3, 14:02, confidence 0.94").

---

### F-20 · Citizen Reporting + Public Transparency Portal — P3 (stub only) *(new innovative feature)*
**Dependencies:** F-16
**Rationale:** Strong "beyond the problem statement" innovation angle for SIH judging — crowdsourced input + public trust via transparency, without handling real citizen PII in the hackathon build.

- **FR-20.1 (stub)** Mocked `/report` endpoint accepting a citizen-submitted plate + description + photo (stored, not processed by CV pipeline in MVP).
- **FR-20.2 (stub)** Public dashboard route showing **only anonymized, aggregate** stats (e.g., "1,204 vehicles monitored today across 5 zones") — no raw plate data ever.

**Acceptance criteria:**
- [ ] Endpoint and public route exist and return mocked/aggregate data; explicitly documented as Phase-2 scope in UI ("Coming soon").

---

### F-21 · ResQRoute Emergency Response Integration — P3 (stub only)
**Dependencies:** F-07, F-08

- **FR-21.1 (stub)** `GET /api/v1/resqroute/demo-scenario` returns one hardcoded ambulance scenario: start point, destination, and a precomputed OSRM route.
- **FR-21.2 (stub)** Frontend `/resqroute` animates the ambulance moving along the route on the map with live "corridor cleared" markers (visual only, no real signal integration).

**Acceptance criteria:**
- [ ] Demo scenario plays end-to-end without needing any live external API.

---

### F-22 · Emergency Corridor Optimization — P3 (stub only)
**Dependencies:** F-21

- **FR-22.1 (stub)** Backend computes a congestion-weighted shortest path using OSRM/networkx for exactly one predefined route, comparing "normal route" vs "optimized corridor route" travel time.
- **FR-22.2 (stub)** UI shows a simple before/after time-saved comparison card.

**Acceptance criteria:**
- [ ] Optimized route is demonstrably shorter/faster than the naive route on the demo road network extract.

---

### F-23 · Digital Twin / What-If Traffic Simulation — P3 (stub only)
**Dependencies:** F-08

- **FR-23.1 (stub)** A single pre-built SUMO scenario for one junction, with 2–3 precomputed "what-if" outcomes (e.g., "add a signal phase," "close one lane").
- **FR-23.2 (stub)** `GET /api/v1/digital-twin/junction/{id}/simulate?scenario=X` returns precomputed results (video/GIF or metrics JSON) — not a live simulation engine.

**Acceptance criteria:**
- [ ] Selecting a scenario in the UI displays the corresponding precomputed outcome without errors.

---

## 8. Data Requirements

### 8.1 Core Schema (frozen after Release 1 — do not modify, only extend)
Use exactly the schema defined in `ANPR_Platform_Architecture.md`, Section 5.1:
`cameras`, `vehicles`, `vehicle_events`, `trajectories`, `alerts`, `road_segments`.

### 8.2 Extended Schema (additive, per new/optional feature)
```sql
-- existing optional tables (from architecture doc)
incidents (id, vehicle_id NULL, camera_id, incident_type, confidence, evidence_url, created_at)
congestion_forecasts (id, road_segment_id, predicted_time, predicted_level, model_version)
camera_health_logs (id, camera_id, checked_at, fps, status)
assistant_query_logs (id, query_text, generated_sql, response_text, created_at)

-- new tables for this PRD's innovative features
mock_vehicle_registry (id, plate_number, registered_type, registered_color)   -- F-17
plate_integrity_flags (id, event_id, flag_type, details JSONB, created_at)     -- F-17
alert_explanations (id, alert_id, rules_triggered JSONB, evidence_urls TEXT[])  -- F-19
citizen_reports (id, plate_text NULL, description, photo_url, status, created_at) -- F-20 (stub)
audit_log (id, actor_role, action, target_type, target_id, created_at)          -- F-16
```

---

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Event ingestion → map update < 2s; dashboard queries < 1s on demo dataset |
| Availability (demo) | Full stack starts via single `docker compose up`; zero external network calls required |
| Scalability (documented, not built) | Architecture must support swapping Redis pub/sub → Kafka and monolith → microservices without schema changes (see architecture doc §12.2) |
| Security | No hardcoded secrets; `.env`-based config; role-based access on raw plate data (F-16) |
| Privacy | Raw plate access is role-gated and audit-logged from Release 1 onward |
| Accessibility | Frontend must be usable via keyboard nav; color-coded status indicators must also carry a text/icon label (not color-only) |
| Explainability | Every automated alert must carry a human-readable reason (F-19) |
| Modularity | New feature = new router + new table(s); zero edits to ingestion API or core schema (validated in code review) |

---

## 10. API Summary (contract-first — implement to this spec)

See `ANPR_Platform_Architecture.md` §9 for the base contract. This PRD adds:

```
POST   /api/v1/search/describe                      # F-18
GET    /api/v1/vehicle-dna/similar                    # F-11
GET    /api/v1/incidents                                 # F-12
POST   /api/v1/report                                      # F-20 (stub)
GET    /api/v1/public/stats                                  # F-20 (stub, anonymized)
GET    /api/v1/alerts/{id}/explanation                         # F-19
```

All new endpoints must appear in the auto-generated `/docs` (FastAPI/OpenAPI) with example payloads.

---

## 11. Demo Script Requirements (must be scripted & rehearsed, not improvised)

1. Boot stack (`docker compose up`) — under 2 minutes to ready state.
2. Play seeded video on Camera-1 → live pin appears on map within 2s.
3. Same seeded vehicle appears on Camera-2 minutes later → trajectory line connects both on map.
4. A pre-blacklisted plate appears on Camera-3 → alert toast fires live, explanation panel shown (F-19).
5. Open Analytics dashboard → show live-updating volume chart + heatmap.
6. Open Camera Health → kill one camera container on stage → status flips to offline live.
7. (If Release 2/3 built) Show Vehicle DNA similarity search on an obscured-plate event.
8. (If Release 2/3 built) Show incident feed catching a scripted "stalled vehicle" clip.
9. Close with roadmap slide: architecture doc §12.2 (cloud) + stubbed F-20/21/22/23 screens as "what's next."

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| OCR accuracy poor on low-quality demo footage | Use well-lit, front-facing plate footage for the scripted demo path; keep dual-engine fusion as a fallback |
| Live camera flakiness on stage wifi | Use local looped video files as default "cameras," not live RTSP, for the actual demo |
| Scope creep into P2/P3 features breaking P0 timeline | Hard freeze rule: Release 1 (P0) must be complete and demo-safe before any Release 2+ work starts |
| Map tiles requiring internet | Pre-cache MBTiles / local tile server bundled in Docker Compose |
| Judges probing edge cases (fake plates, duplicate detection) | F-17 exists specifically to pre-empt this line of questioning |

---

## 13. Explicitly Out of Scope (this build cycle)

- Real integration with government vehicle databases (VAHAN, NCRB, e-Challan systems)
- Real signal-control hardware / traffic light integration
- Production user authentication/SSO (a simple role header/mock auth is sufficient for demo)
- Payment/toll processing
- Training a custom deep ReID network (embedding-based similarity is sufficient)
- Full-city SUMO simulation (single-junction precomputed demo only)

---

## 14. Glossary

- **ANPR** — Automatic Number Plate Recognition
- **ReID** — Re-identification (matching the same object across camera views)
- **PostGIS** — Spatial extension for PostgreSQL
- **OSRM** — Open Source Routing Machine
- **Fusion score** — Combined confidence from multiple OCR engines + format validation
- **Stub** — A feature with a real API contract and UI but mocked/precomputed backend logic

---

*This PRD is the authoritative build spec. The companion architecture document (`ANPR_Platform_Architecture.md`) remains the system-design reference; where the two differ, this PRD's feature requirements and acceptance criteria take precedence for implementation decisions.*
