import { FileInput, MessageSquare } from "lucide-react";
import { NodeWrapper } from "@/components";
import { CustomHandle } from "./CustomHandle";
import { Position } from "@xyflow/react";

export const UserQueryNode = ({ id, data, selected }: any) => {
  return (
    <NodeWrapper
      type="userQuery"
      selected={selected}
      hasTarget={false}
      onSettings={data?.onSettings}
      onDelete={data?.onDelete}
      id={id}
      validationErrors={[]}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <FileInput className={`w-5 h-5 text-[#444444]/80`} />
        <h3 className="font-semibold text-foreground">User Query</h3>
      </div>
      <div className="bg-[#EDF3FF] px-4 py-1.5 text-sm">
        Entry point for queries
      </div>
      <div className="p-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">User Query</label>
            <textarea
              className="w-full p-2 text-sm bg-muted border border-border rounded resize-none nodrag text-muted-foreground"
              placeholder="Write your query here"
              rows={2}
              value={''}
              disabled
              readOnly
              onMouseDown={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="relative w-full h-4 mt-8">
          <div className="absolute -right-5">
            <CustomHandle
              type="source"
              position={Position.Right}
              label="Query"
              tooltipComponents={
                ["llmEngine", "knowledgeBase"]
              }
            />
          </div>
        </div>
      </div>
    </NodeWrapper>
  );
};