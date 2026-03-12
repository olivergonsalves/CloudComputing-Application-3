import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  NodeMouseHandler,
  ReactFlow,
  ReactFlowInstance,
  ReactFlowProvider
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BookOpen, Clock3, Save, Search } from "lucide-react";
import { DetailsSidebar } from "./features/sidebar/DetailsSidebar";
import { OverlayModal } from "./features/modals/OverlayModal";
import { TopicNodeView } from "./features/tree/TopicNode";
import { expandNode, getHistory, getMaps, saveMap, searchTopic } from "./lib/api";
import { buildFlowElements } from "./lib/layoutTree";
import { TreeState } from "./types/tree";

const nodeTypes: NodeTypes = { topicNode: TopicNodeView };

function RabbitHoleApp() {
  const [query, setQuery] = useState("");
  const [tree, setTree] = useState<TreeState | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapsModalOpen, setMapsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [savedMaps, setSavedMaps] = useState<Array<{ id: string; rootTopic: string; createdAt: string; tree: TreeState }>>([]);
  const [history, setHistory] = useState<Array<{ id: string; topic: string; timestamp: string }>>([]);
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const expandAbortRef = useRef<AbortController | null>(null);
  const latestSearchRequestRef = useRef(0);
  const latestExpandRequestRef = useRef(0);

  const elements = useMemo(() => {
    if (!tree) {
      return { nodes: [], edges: [] };
    }
    return buildFlowElements(tree);
  }, [tree]);

  const onSearch = useCallback(
    async (evt?: FormEvent) => {
      evt?.preventDefault();
      const topic = query.trim();
      if (!topic) {
        return;
      }

      latestSearchRequestRef.current += 1;
      const requestId = latestSearchRequestRef.current;

      searchAbortRef.current?.abort();
      expandAbortRef.current?.abort();

      const controller = new AbortController();
      searchAbortRef.current = controller;

      setError(null);
      setWarnings([]);
      setLoadingNodeId(null);
      setIsSearching(true);

      try {
        const response = await searchTopic(topic, controller.signal);
        if (requestId !== latestSearchRequestRef.current) {
          return;
        }

        setTree(response.tree);
        setWarnings(response.warnings);

        requestAnimationFrame(() => {
          flow?.fitView({ duration: 300, padding: 0.2 });
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (requestId === latestSearchRequestRef.current) {
          setIsSearching(false);
          searchAbortRef.current = null;
        }
      }
    },
    [query, flow]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    async (_event, node) => {
      if (!tree || loadingNodeId) {
        return;
      }

      latestExpandRequestRef.current += 1;
      const requestId = latestExpandRequestRef.current;

      expandAbortRef.current?.abort();
      const controller = new AbortController();
      expandAbortRef.current = controller;

      setError(null);
      setLoadingNodeId(node.id);

      try {
        const response = await expandNode(tree, node.id, controller.signal);
        if (requestId !== latestExpandRequestRef.current) {
          return;
        }

        setTree(response.tree);
        setWarnings(response.warnings);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Node expansion failed");
      } finally {
        if (requestId === latestExpandRequestRef.current) {
          setLoadingNodeId(null);
          expandAbortRef.current = null;
        }
      }
    },
    [tree, loadingNodeId]
  );

  const onSaveMap = useCallback(async () => {
    if (!tree) {
      return;
    }
    const root = tree.nodes[tree.rootId];
    await saveMap(root.label, tree);
  }, [tree]);

  const openMaps = useCallback(async () => {
    try {
      setError(null);
      const response = await getMaps();
      setSavedMaps(response.maps);
      setMapsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved maps");
    }
  }, []);

  const openHistory = useCallback(async () => {
    try {
      setError(null);
      const response = await getHistory();
      setHistory(response.history);
      setHistoryModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load search history");
    }
  }, []);

  const loadSavedMap = useCallback(
    (mapTree: TreeState) => {
      setTree(mapTree);
      setMapsModalOpen(false);
      requestAnimationFrame(() => {
        flow?.fitView({ duration: 300, padding: 0.2 });
      });
    },
    [flow]
  );

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
      expandAbortRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex h-screen bg-surface text-ink">
      <DetailsSidebar tree={tree} selectedNodeId={tree?.selectedNodeId ?? null} loading={isSearching || !!loadingNodeId} warnings={warnings} />

      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-10 mx-auto mt-4 w-[95%] rounded-xl border border-slate-600/70 bg-[#0b1422]/90 p-3 shadow-soft backdrop-blur">
          <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-lg border border-slate-600 px-3 py-2">
              <Search size={16} className="text-slate-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search any topic..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              disabled={isSearching}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#031422] transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {isSearching ? "Generating..." : "Explore"}
            </button>
            <button type="button" onClick={onSaveMap} className="rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-200">
              <Save size={14} className="mr-1 inline" /> Save map
            </button>
            <button type="button" onClick={openMaps} className="rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-200">
              <BookOpen size={14} className="mr-1 inline" /> Saved maps
            </button>
            <button type="button" onClick={openHistory} className="rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-200">
              <Clock3 size={14} className="mr-1 inline" /> History
            </button>
            <button
              type="button"
              onClick={() => flow?.fitView({ duration: 250, padding: 0.2 })}
              className="rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-200"
            >
              Fit to screen
            </button>
          </form>

          {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
        </div>

        <div className="h-full w-full bg-[radial-gradient(circle_at_top,#17365f_0%,#0a1220_50%,#060b14_100%)] pt-24">
          <ReactFlow
            nodes={elements.nodes}
            edges={elements.edges}
            nodeTypes={nodeTypes}
            fitView
            onInit={setFlow}
            onNodeClick={onNodeClick}
            minZoom={0.3}
            maxZoom={1.7}
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap pannable zoomable className="!bg-[#0b1422]" nodeColor="#30b7ff" />
            <Controls />
            <Background color="#22395a" gap={24} />
          </ReactFlow>
        </div>
      </main>

      <OverlayModal open={mapsModalOpen} onClose={() => setMapsModalOpen(false)} title="Saved Maps">
        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
          {savedMaps.map((entry) => (
            <button
              key={entry.id}
              onClick={() => loadSavedMap(entry.tree)}
              className="flex w-full items-center justify-between rounded border border-slate-700 bg-[#111d31] p-3 text-left text-sm text-slate-200"
            >
              <span>{entry.rootTopic}</span>
              <span className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
            </button>
          ))}
          {savedMaps.length === 0 ? <p className="text-sm text-slate-300">No saved maps yet.</p> : null}
        </div>
      </OverlayModal>

      <OverlayModal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title="Search History">
        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => {
                setQuery(entry.topic);
                setHistoryModalOpen(false);
              }}
              className="flex w-full items-center justify-between rounded border border-slate-700 bg-[#111d31] p-3 text-left text-sm text-slate-200"
            >
              <span>{entry.topic}</span>
              <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
            </button>
          ))}
          {history.length === 0 ? <p className="text-sm text-slate-300">No history yet.</p> : null}
        </div>
      </OverlayModal>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <RabbitHoleApp />
    </ReactFlowProvider>
  );
}
