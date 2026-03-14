import { memo } from "react";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { TreeNode } from "../../types/tree";

interface NodeData {
  label: string;
  node: TreeNode;
  isSelected: boolean;
}

function TopicNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as NodeData;

  return (
    <div
      className={`rounded-2xl border px-3 py-2 text-sm shadow-soft transition-all duration-200 ${
        nodeData.isSelected
          ? "border-[#4a4a4a] bg-[#242424] text-white"
          : "border-[#2a2a2a] bg-[#1a1a1a] text-ink hover:-translate-y-0.5 hover:border-[#4a4a4a] hover:bg-[#202020]"
      }`}
      style={{ minWidth: "190px", maxWidth: "320px" }}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-[#5d5d5d]" />
      <p className="line-clamp-2 font-semibold tracking-[0.01em]">{nodeData.label}</p>
      <p className="mt-1 text-[11px] text-[#a1a1a1]">
        {nodeData.node.hasLoadedChildren ? (nodeData.node.isExpanded ? "Expanded" : "Collapsed") : "Click to expand"}
      </p>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-[#8a8a8a]" />
    </div>
  );
}

export const TopicNodeView = memo(TopicNodeComponent);
