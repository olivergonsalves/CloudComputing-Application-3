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
import { BookOpen, Clock3, Compass, Save, Search } from "lucide-react";
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
      setWarnings([]);
      setError(null);
      requestAnimationFrame(() => {
        flow?.fitView({ duration: 300, padding: 0.2 });
      });
    },
    [flow]
  );

  const onResetApp = useCallback(() => {
    searchAbortRef.current?.abort();
    expandAbortRef.current?.abort();
    latestSearchRequestRef.current += 1;
    latestExpandRequestRef.current += 1;

    setQuery("");
    setTree(null);
    setWarnings([]);
    setError(null);
    setIsSearching(false);
    setLoadingNodeId(null);
    setMapsModalOpen(false);
    setHistoryModalOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
      expandAbortRef.current?.abort();
    };
  }, []);

  return (
    <div className="h-screen bg-surface text-ink">
      <header className="border-b border-[#2a2a2a] bg-[#111111] px-4 py-3">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3">
          <button
            type="button"
            onClick={onResetApp}
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#4a4a4a] hover:bg-[#202020]"
          >
            <Compass size={16} className="text-[#dbdbdb] transition group-hover:rotate-45" />
            <span className="whitespace-nowrap">Rabbit Hole Explorer</span>
          </button>

          <form onSubmit={onSearch} className="mx-auto flex w-full max-w-3xl items-center gap-2">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 transition focus-within:border-[#474747]">
              <Search size={16} className="text-slate-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search any topic..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#828282]"
              />
            </div>
            <button
              disabled={isSearching}
              className="rounded-xl border border-[#3b3b3b] bg-[#2a2a2a] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#575757] hover:bg-[#313131] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSearching ? "Generating..." : "Explore"}
            </button>
          </form>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <button type="button" onClick={onSaveMap} className="rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-200">
              <Save size={14} className="mr-1 inline" /> Save map
            </button>
            <button type="button" onClick={openMaps} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-slate-200 transition hover:border-[#505050] hover:bg-[#222]">
              <BookOpen size={14} className="mr-1 inline" /> Saved maps
            </button>
            <button type="button" onClick={openHistory} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-slate-200 transition hover:border-[#505050] hover:bg-[#222]">
              <Clock3 size={14} className="mr-1 inline" /> History
            </button>
            <button
              type="button"
              onClick={() => flow?.fitView({ duration: 250, padding: 0.2 })}
              className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-slate-200 transition hover:border-[#505050] hover:bg-[#222]"
            >
              Fit to screen
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-74px)] flex-col lg:flex-row">
        <DetailsSidebar tree={tree} selectedNodeId={tree?.selectedNodeId ?? null} loading={isSearching || !!loadingNodeId} warnings={warnings} />

        <main className="relative flex-1 overflow-hidden">
          {error ? (
            <p className="absolute left-4 right-4 top-4 z-20 rounded-lg border border-[#4a2020] bg-[#271616] p-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}

          <div className="h-full w-full bg-[radial-gradient(circle_at_top,#191919_0%,#121212_55%,#0f0f0f_100%)] transition-colors">
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
            <MiniMap pannable zoomable className="!bg-[#161616] !border !border-[#2a2a2a]" nodeColor="#6d6d6d" />
            <Controls />
            <Background color="#252525" gap={28} />
          </ReactFlow>
        </div>
        </main>
      </div>

      <OverlayModal open={mapsModalOpen} onClose={() => setMapsModalOpen(false)} title="Saved Maps">
        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
          {savedMaps.map((entry) => (
            <button
              key={entry.id}
              onClick={() => loadSavedMap(entry.tree)}
              className="flex w-full items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#161616] p-3 text-left text-sm text-slate-200 transition hover:border-[#474747] hover:bg-[#1d1d1d]"
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
              className="flex w-full items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#161616] p-3 text-left text-sm text-slate-200 transition hover:border-[#474747] hover:bg-[#1d1d1d]"
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
