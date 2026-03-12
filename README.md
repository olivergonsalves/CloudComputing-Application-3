# Rabbit Hole

Rabbit Hole is a local-first visual knowledge explorer that builds a strict hierarchical topic tree from any search term. You can expand/collapse branches, keep the full exploration path visible, and save/reopen complete maps locally.

## 1) Proposed Folder Structure

```text
rabbit-hole/
  frontend/
    src/
      components/
      features/
        modals/
        sidebar/
        tree/
      lib/
      styles/
      types/
      App.tsx
      main.tsx
    index.html
    package.json
    tailwind.config.ts
    vite.config.ts
  backend/
    src/
      clients/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
      app.ts
      server.ts
    data/
    package.json
    tsconfig.json
  .env.example
  package.json
  README.md
```

## 2) Data Model

`TreeNode`
- `id: string`
- `label: string`
- `normalizedLabel: string`
- `parentId: string | null`
- `depth: number`
- `children: string[]`
- `isExpanded: boolean`
- `hasLoadedChildren: boolean`
- `source: { sourceLabel, confidence, discoveredBy[] }`
- `summary: string`
- `externalUrl: string`
- `summaryIsFallback: boolean`

`TreeState`
- `rootId: string`
- `nodes: Record<string, TreeNode>`
- `selectedNodeId: string | null`

`SavedMap`
- `id: string`
- `rootTopic: string`
- `createdAt: ISO timestamp`
- `updatedAt: ISO timestamp`
- `tree: TreeState`

`SearchHistoryItem`
- `id: string`
- `topic: string`
- `timestamp: ISO timestamp`

## 3) Tree Layout Strategy (No Intersections Guarantee)

The frontend uses a deterministic hierarchical layout algorithm (strict tree, not force graph):

1. Compute each visible node width (`max(minWidth, labelLengthEstimate)`).
2. Recursively compute subtree widths bottom-up:
   - leaf width = node width
   - internal width = `max(node width, sum(child subtree widths + sibling gaps))`
3. Assign positions top-down:
   - root centered
   - each child group centered under parent
   - siblings placed left-to-right by subtree width
4. Render only visible descendants (`isExpanded` chain).
5. Draw parent->child edges with React Flow `smoothstep` edges.

Why this avoids crossings/overlap:
- Stable sibling order + contiguous non-overlapping horizontal intervals per subtree.
- Children always directly below parents, preserving left-to-right ancestor ordering.
- Subtree-width allocation prevents node overlap.
- No free-form physics or force layout randomness.

## 4) API Contract

### `POST /api/search`
Request:
```json
{ "topic": "Artificial Intelligence" }
```
Response:
```json
{ "tree": { "rootId": "...", "nodes": {}, "selectedNodeId": "..." }, "warnings": [] }
```

### `POST /api/expand`
Request:
```json
{ "tree": { "rootId": "...", "nodes": {}, "selectedNodeId": "..." }, "nodeId": "..." }
```
Behavior:
- If `hasLoadedChildren=true`: toggles collapse/expand only.
- Else: fetches children, merges safely, marks node expanded.

Response:
```json
{ "tree": { "rootId": "...", "nodes": {}, "selectedNodeId": "..." }, "warnings": [] }
```

### `GET /api/topic-summary?topic=...`
Response:
```json
{
  "title": "...",
  "summary": "...",
  "externalUrl": "https://...",
  "sourceLabel": "wikipedia|fallback",
  "summaryIsFallback": false
}
```

### `GET /api/maps`
Response:
```json
{ "maps": [ { "id": "...", "rootTopic": "...", "createdAt": "...", "updatedAt": "...", "tree": {} } ] }
```

### `POST /api/maps`
Request:
```json
{ "rootTopic": "Artificial Intelligence", "tree": { "rootId": "...", "nodes": {}, "selectedNodeId": "..." } }
```
Response:
```json
{ "map": { "id": "...", "rootTopic": "...", "createdAt": "...", "updatedAt": "...", "tree": {} } }
```

### `GET /api/history`
Response:
```json
{ "history": [ { "id": "...", "topic": "...", "timestamp": "..." } ] }
```

---

## Implementation Notes

- Frontend: React + TypeScript + Vite + Tailwind + React Flow.
- Backend: Node + Express + TypeScript.
- Persistence: local JSON files in `backend/data` (`maps.json`, `history.json`).
- Integrations:
  - Wikipedia API: summary + canonical link.
  - Anthropic Haiku: strict JSON child-topic refinement (4-6 children).
- External responses are schema-validated where applicable (`zod`).
- Fallback behavior:
  - Anthropic failure -> Wikipedia search-only candidates.
  - Wikipedia summary failure -> fallback summary + search URL.

## Local Setup

1. Copy env file:
```bash
cp .env.example .env
```

2. Fill keys in `.env`:
- `ANTHROPIC_API_KEY`

3. Install dependencies:
```bash
npm install
```

4. Run frontend + backend together:
```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Useful Scripts

```bash
npm run dev
npm run build
npm run start
```

## Stability Guarantees Implemented

- Strict hierarchical tree layout (not graph physics).
- Unique stable node IDs (UUID).
- Duplicate child prevention under parent.
- Global normalized-label dedupe to prevent displayed cycles.
- Deterministic expand/collapse without deleting loaded descendants.
- Safe branch merge without corrupting unrelated branches.
- Loading/error states for search and branch expansion.
