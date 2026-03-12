import { TreeState } from "../../types/tree";

interface DetailsSidebarProps {
  tree: TreeState | null;
  loading: boolean;
  selectedNodeId: string | null;
  warnings: string[];
}

function buildPath(tree: TreeState, selectedNodeId: string | null): string[] {
  if (!selectedNodeId || !tree.nodes[selectedNodeId]) {
    return [];
  }

  const labels: string[] = [];
  let cursor = tree.nodes[selectedNodeId];

  while (cursor) {
    labels.push(cursor.label);
    if (!cursor.parentId) {
      break;
    }
    cursor = tree.nodes[cursor.parentId];
  }

  return labels.reverse();
}

export function DetailsSidebar({ tree, selectedNodeId, loading, warnings }: DetailsSidebarProps) {
  if (!tree) {
    return (
      <aside className="w-full max-w-sm border-r border-slate-700/40 bg-[#0d1829] p-4 text-slate-200">
        <h2 className="text-lg font-semibold text-white">Rabbit Hole</h2>
        <p className="mt-3 text-sm text-slate-300">Search a topic to generate a hierarchical knowledge tree.</p>
      </aside>
    );
  }

  const selected = selectedNodeId ? tree.nodes[selectedNodeId] : tree.nodes[tree.rootId];
  const path = buildPath(tree, selected?.id ?? null);

  return (
    <aside className="w-full max-w-sm border-r border-slate-700/40 bg-[#0d1829] p-4 text-slate-200">
      <h2 className="text-lg font-semibold text-white">{selected?.label ?? "Topic"}</h2>

      {loading ? (
        <div className="mt-4 animate-pulse space-y-2">
          <div className="h-3 w-11/12 rounded bg-slate-700" />
          <div className="h-3 w-9/12 rounded bg-slate-700" />
          <div className="h-3 w-10/12 rounded bg-slate-700" />
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-300">{selected?.summary}</p>
          <div className="mt-4 rounded-lg border border-slate-700/70 bg-[#0b1422] p-3 text-xs">
            <p>
              Source: <span className="font-semibold uppercase tracking-wide">{selected?.source.sourceLabel}</span>
            </p>
            {selected?.summaryIsFallback ? <p className="mt-1 text-amber-300">Fallback-generated summary.</p> : null}
          </div>

          {selected?.externalUrl ? (
            <a
              href={selected.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block rounded-md bg-accent px-3 py-2 text-sm font-semibold text-[#021522] transition hover:bg-cyan-300"
            >
              Read full article
            </a>
          ) : null}

          {selected?.label ? (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(selected.label)}`}
              target="_blank"
              rel="noreferrer"
              className="ml-2 mt-4 inline-block rounded-md border border-slate-500 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-300"
            >
              Google search
            </a>
          ) : null}

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-200">Current Path</h3>
            <p className="mt-2 text-xs leading-5 text-slate-300">{path.join(" -> ")}</p>
          </div>

          {warnings.length > 0 ? (
            <div className="mt-5 space-y-2">
              {warnings.map((warning) => (
                <p key={warning} className="rounded border border-amber-500/40 bg-amber-900/20 p-2 text-xs text-amber-200">
                  {warning}
                </p>
              ))}
            </div>
          ) : null}
        </>
      )}
    </aside>
  );
}
