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
      <aside className="w-full border-b border-[#2a2a2a] bg-[#111111] p-4 text-[#d2d2d2] lg:h-full lg:w-[340px] lg:border-b-0 lg:border-r">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <h2 className="text-lg font-semibold text-white">Rabbit Hole</h2>
          <p className="mt-3 text-sm text-[#a8a8a8]">Search a topic to generate a hierarchical knowledge tree.</p>
        </div>
      </aside>
    );
  }

  const selected = selectedNodeId ? tree.nodes[selectedNodeId] : tree.nodes[tree.rootId];
  const path = buildPath(tree, selected?.id ?? null);

  return (
    <aside className="w-full border-b border-[#2a2a2a] bg-[#111111] p-4 text-[#d2d2d2] lg:h-full lg:w-[340px] lg:border-b-0 lg:border-r">
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
        <h2 className="text-lg font-semibold text-white">{selected?.label ?? "Topic"}</h2>

        {loading ? (
          <div className="mt-4 animate-pulse space-y-2">
            <div className="h-3 w-11/12 rounded bg-[#343434]" />
            <div className="h-3 w-9/12 rounded bg-[#343434]" />
            <div className="h-3 w-10/12 rounded bg-[#343434]" />
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-[#bcbcbc]">{selected?.summary}</p>
            <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#161616] p-3 text-xs">
              <p>
                Source: <span className="font-semibold uppercase tracking-wide text-[#e5e5e5]">{selected?.source.sourceLabel}</span>
              </p>
              {selected?.summaryIsFallback ? <p className="mt-1 text-amber-300">Fallback-generated summary.</p> : null}
            </div>

            {selected?.externalUrl ? (
              <a
                href={selected.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-lg border border-[#3c3c3c] bg-[#262626] px-3 py-2 text-sm font-semibold text-[#f4f4f4] transition hover:border-[#595959] hover:bg-[#2c2c2c]"
              >
                Read full article
              </a>
            ) : null}

            {selected?.label ? (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(selected.label)}`}
                target="_blank"
                rel="noreferrer"
                className="ml-2 mt-4 inline-block rounded-lg border border-[#2a2a2a] bg-[#181818] px-3 py-2 text-sm font-semibold text-[#e2e2e2] transition hover:border-[#4b4b4b] hover:bg-[#202020]"
              >
                Google search
              </a>
            ) : null}

            <div className="mt-5 rounded-xl border border-[#2a2a2a] bg-[#161616] p-3">
              <h3 className="text-sm font-semibold text-[#f0f0f0]">Current Path</h3>
              <p className="mt-2 text-xs leading-5 text-[#a8a8a8]">{path.join(" -> ")}</p>
            </div>

            {warnings.length > 0 ? (
              <div className="mt-5 space-y-2">
                {warnings.map((warning) => (
                  <p key={warning} className="rounded-lg border border-amber-500/40 bg-amber-900/20 p-2 text-xs text-amber-200">
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
      {warnings.length > 0 ? (
        <div className="mt-3">
          <p className="rounded-lg border border-[#3a2b2b] bg-[#201818] p-2 text-xs text-[#e4b8b8]">
            Tip: If warnings persist, retry expansion or verify API/network health.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
