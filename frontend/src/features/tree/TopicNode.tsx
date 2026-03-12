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
      className={`rounded-xl border px-3 py-2 text-sm shadow-soft transition-all ${
        nodeData.isSelected
          ? "border-accent bg-[#12314f] text-white"
          : "border-[#2b4968] bg-panel/95 text-ink hover:border-accent2"
      }`}
      style={{ minWidth: "190px", maxWidth: "320px" }}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-accent2" />
      <p className="line-clamp-2 font-medium tracking-wide">{nodeData.label}</p>
      <p className="mt-1 text-[11px] text-slate-300">
        {nodeData.node.hasLoadedChildren ? (nodeData.node.isExpanded ? "Expanded" : "Collapsed") : "Click to expand"}
      </p>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-accent" />
    </div>
  );
}

export const TopicNodeView = memo(TopicNodeComponent);
