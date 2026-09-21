# Instructions for AI Coding Agents

## Project context

This repository contains **ResQ-Guard**, an engineering-ready, city-wide AI ANPR and vehicle intelligence platform integrated with **ResQRoute 2.0 Emergency Corridor Optimization**.

Read `docs/PRD.md` and `ANPR_Platform_Architecture.md` before implementing product behavior.

## Operating principles

1. Inspect the repository before changing it.
2. Prefer small, coherent changes.
3. Do not rewrite working code without a concrete reason.
4. Do not invent APIs, database fields, environment variables, or provider behavior.
5. Follow existing project conventions unless they conflict with security or correctness.
6. Explain architectural changes before implementing them.
7. Verify behavior rather than assuming code correctness.

## Product & Architectural rules

- Follow the stable feature IDs (`F-01` through `F-23`) and release sequence in `docs/PRD.md`.
- Core database schema (cameras, vehicles, vehicle_events, trajectories, alerts, road_segments) must be preserved; only add tables/columns as additive extensions.
- Ingestion pipeline (`POST /api/v1/ingestion/event`) must maintain high throughput and support fuzzy plate matching ($\ge 90\%$).
- Multi-camera trajectories must be constructed chronologically with valid GeoJSON outputs.
- Explainable AI (XAI) alert panels must render human-readable plain language reasons and rule triggers.
- Map and dashboard interfaces must work with local tiles / mock data for fully offline demo capability.

## Testing & Verification rules

For changes to backend or frontend:
- Run unit/integration tests with `pytest backend/tests/`.
- Ensure frontend builds cleanly with `npm run build`.
- Verify live WebSocket push, trajectory stitching, and alert feeds.

## Agent behavior

Before coding a non-trivial task:
1. Inspect relevant files.
2. Identify dependencies and affected components.
3. State the implementation plan.
4. Implement the smallest correct change.
5. Run appropriate verification.
6. Report files changed and verification performed.
