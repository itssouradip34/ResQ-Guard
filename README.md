# ResQ-Guard

**City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking and Urban Traffic Analytics**

Built for Smart India Hackathon 2026 — Team Codester

---

## Overview

ResQ-Guard turns a city's existing CCTV network into a single, connected vehicle-intelligence grid — not a collection of isolated plate-readers. Every camera feeds into one unified pipeline that detects vehicles, reads license plates, reconstructs a vehicle's full multi-camera journey across the city, and surfaces all of it on a live command-center dashboard for law enforcement and traffic planners.

The platform is designed as a **Smart City & Police Command Center Operations Solution**, combining automatic number plate recognition (ANPR), cross-camera trajectory reconstruction, real-time GIS visualization, and an emergency vehicle green-corridor dispatch system into a single deployable product.

## Features

- **Multi-Camera ANPR** — YOLOv8-based vehicle and plate detection with ByteTrack tracking, fed into a dual-engine OCR (PaddleOCR + EasyOCR) with confidence fusion for high-accuracy plate reads.
- **Cross-Camera Trajectory Reconstruction** — Stitches detections from multiple, non-overlapping cameras into one continuous vehicle journey across the city.
- **Live GIS Command Map** — Real-time vehicle movement, camera health, and trajectory replay on an interactive city map, with CCTV stream popups and bounding-box overlays.
- **ResQRoute — Emergency Green Corridor** — A 4-stage automated dispatch workflow (Dispatch → Signal Preemption → Green Wave Locked → Hospital Handover) that clears a live path for ambulances through traffic signal preemption.
- **Traffic & Security Analytics** — City-wide congestion patterns, density heatmaps, and automated blacklist/suspicious-route alerts for law enforcement.
- **Vehicle Intelligence Dossiers** — Per-vehicle case files with sighting history, trajectory replay, and officer case-note logging for investigations.
- **AI City Assistant** — A conversational interface for querying traffic and camera data in natural language, with exportable reports.
- **Mobile Patrol App** — A field-ready PWA for officers, with rapid plate scanning and one-tap dispatch actions.
- **Camera Health Monitoring** — Live FPS/latency dashboards with automated failover detection across the camera network.

## Architecture

ResQ-Guard runs on a single core event pipeline that every feature reads from or writes to, so new capabilities plug in without reworking existing ones:

```
Camera / CCTV Feed
      │
      ▼
CV Pipeline (YOLOv8 detect + track, dual-OCR plate read)
      │
      ▼
Backend API (validate, enrich, persist events)
      │
      ▼
Database & Cache (PostgreSQL + PostGIS, Redis pub/sub)
      │
      ▼
Frontend Dashboard (live map + analytics via WebSocket)
```

**Per-camera CV workers** run as independent processes, so scaling to more cameras is a matter of spinning up more workers rather than rearchitecting the pipeline. The **backend** is a modular monolith (FastAPI) — each capability (vehicles, cameras, trajectories, alerts, analytics, ResQRoute) is its own router and service. **Real-time delivery** is handled via Redis pub/sub feeding WebSocket connections straight to the frontend map and dashboard.

### Tech stack

| Layer | Technology |
|---|---|
| Computer Vision / AI | YOLOv8, ByteTrack, PaddleOCR, EasyOCR, OpenCV |
| Backend | FastAPI (Python, async), WebSocket |
| Database | PostgreSQL + PostGIS, Redis |
| Frontend | React, Vite, TypeScript, TailwindCSS, MapLibre GL JS |
| Routing / GIS | OSRM, OSMnx / NetworkX |

---

*Status: In development for SIH 2026.*
