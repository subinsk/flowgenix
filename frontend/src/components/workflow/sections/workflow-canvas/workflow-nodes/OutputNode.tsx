import { FileInput, Monitor } from "lucide-react";
import { NodeWrapper } from "@/components";
import type { NodeFieldError } from "@/hooks";
import { CustomHandle } from "./CustomHandle";
import { Position } from "@xyflow/react";

export const OutputNode = ({ id, data, selected }: any) => {
  const nodeErrors: NodeFieldError[] = (data?.validationErrors || []).filter(
    (err: NodeFieldError) => err.nodeId === id && err.nodeType === "output"
  );
  const hasInput = data?.hasInput;
  return (
    <NodeWrapper
      type="output"
      selected={selected}
      hasSource={false}
      onSettings={data?.onSettings}
      onDelete={data?.onDelete}
      id={id}
      validationErrors={data?.validationErrors || []}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <FileInput className={`w-5 h-5 text-[#444444]/80 scale-x-[-1]`} />
        <h3 className="font-semibold text-foreground">LLM Engine</h3>
      </div>
      <div className="bg-[#EDF3FF] px-4 py-1.5 text-sm text-left">
        Output of the result nodes as text
      </div>
      <div className="p-4">
        <div className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Output Text</label>
            <div className="w-full p-3 min-h-[80px] text-sm bg-muted border border-border rounded text-muted-foreground">
              {hasInput ? "Output will be generated based on query" : "Connect to see output preview"}
            </div>
          </div>
        </div>
        <div className="relative w-full h-4 mt-8">
          <div className="absolute -left-5">
            <CustomHandle
              type="target"
              position={Position.Left}
              label="Output"
              tooltipComponents={["llmEngine"]}
            />
          </div>
        </div>
      </div>
    </NodeWrapper>
  );
};