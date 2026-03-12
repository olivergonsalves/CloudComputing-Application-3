# Rabbit Hole

Rabbit Hole is a local-first visual knowledge explorer. It turns any searched topic into a clean, expanding hierarchical map so users can explore related concepts without losing context.

## What It Does

- Search a root topic and generate a structured knowledge tree.
- Expand any node to reveal deeper child concepts.
- Keep a stable top-down layout with readable edges.
- Show selected-topic details in the sidebar:
  - title
  - summary
  - source label
  - external article link
  - path from root to selected node
- Save maps locally and reopen later from the same state.
- Store local search history.
- Open a Google search for the selected node from the sidebar.

## Why It Exists

Typical search workflows become tab-heavy and fragmented. Rabbit Hole keeps exploration structured and visible, so users can go deeper into a subject while preserving the full path they took.

## High-Level Architecture

- Frontend: React + TypeScript + Vite + Tailwind + React Flow
- Backend: Node.js + Express + TypeScript
- AI: Anthropic Claude Haiku (child topic generation)
- Knowledge source: Wikipedia (summaries + canonical links)
- Persistence: local JSON files (maps + search history)

## Project Structure

```text
final_project_App3/
  frontend/
  backend/
  .env.example
  package.json
  README.md
```

## Prerequisites

- Node.js 20+ (Node 22 recommended)
- npm 10+

## Setup

1. Clone the repo

```bash
git clone git@github.com:olivergonsalves/CloudComputing-Application-3.git
cd CloudComputing-Application-3
```

2. Create environment file

```bash
cp .env.example .env
```

3. Configure `.env`

```env
PORT=4000
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
WIKIPEDIA_API_BASE=https://en.wikipedia.org/w/api.php
DATA_DIR=./backend/data
VITE_API_BASE_URL=http://localhost:4000
```

4. Install dependencies

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

- Frontend: `http://localhost:5173` (or next available Vite port)
- Backend: `http://localhost:4000`

## Build

```bash
npm run build
```

## Helpful Endpoints

- Health: `GET /api/health`
- Search: `POST /api/search`
- Expand node: `POST /api/expand`
- Topic summary: `GET /api/topic-summary?topic=...`
- Saved maps: `GET /api/maps`, `POST /api/maps`
- Search history: `GET /api/history`
- Anthropic test: `GET /api/test-anthropic?topic=Cloud%20Computing`

## Notes

- This app is local-first; no cloud deployment is required.
- Do not commit real secrets. Keep API keys only in `.env`.
