import { Monitor } from "lucide-react";
import { NodeWrapper } from "@/components";
import type { NodeFieldError } from "@/hooks";

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
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-foreground">Output</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Preview</label>
            <div className="w-full p-3 min-h-[80px] text-sm bg-muted border border-border rounded text-muted-foreground">
              {hasInput ? "Output will appear here..." : "Connect to see output preview"}
            </div>
          </div>
        </div>
        {hasInput && (
          <div className="mt-3 flex justify-end">
            <div className="text-xs px-2 py-1 bg-orange-500 text-white rounded">Output</div>
          </div>
        )}
      </div>
    </NodeWrapper>
  );
};